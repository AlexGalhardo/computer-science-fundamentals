# EN: Builds and tests the slo-alert mini-project. The only requirement is Docker.
#     Order: unit tests (no network), the Prometheus rule tester, the proof that k6 refuses a
#     target that is not local, and then the end-to-end incident, which takes about three
#     minutes: k6 overloads the local shop, the alert fires and resolves. Containers and
#     volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto slo-alert. O único requisito é o Docker.
#     Ordem: testes unitários (sem rede), o testador de regras do Prometheus, a prova de que o
#     k6 recusa um alvo que não é local, e depois o incidente de ponta a ponta, que leva cerca
#     de três minutos: o k6 sobrecarrega a loja local, o alerta dispara e se resolve.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el miniproyecto slo-alert. El único requisito es Docker.
#     Orden: pruebas unitarias (sin red), el probador de reglas de Prometheus, la prueba de que
#     k6 rechaza un objetivo que no es local, y luego el incidente de extremo a extremo, que dura
#     unos tres minutos: k6 sobrecarga la tienda local, la alerta se dispara y se resuelve.
#     Los contenedores y los volúmenes se eliminan al final, incluso cuando una prueba falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte
#     en un error fatal siempre que la salida se redirige, así que los fallos se revisan por el código de salida.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

$code = 0
try {
	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "unit tests failed" }
	docker compose run --rm rules-test
	if ($LASTEXITCODE -ne 0) { throw "rule tests failed" }
	docker compose run --rm load-refusal-test
	if ($LASTEXITCODE -ne 0) { throw "k6 accepted a target that is not local" }
	docker compose run --rm e2e-test
	if ($LASTEXITCODE -ne 0) { throw "end-to-end test failed" }
	Write-Output "slo-alert: all tests passed"
}
catch {
	Write-Output "slo-alert: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
