# EN: Builds and tests the http-server-raw-tcp mini-project. The only requirement is Docker.
#     Three steps: the Go tests, a check with curl, and a check with a real browser.
#     Containers are removed at the end, even when a step fails.
# PT: Constrói e testa o mini-projeto http-server-raw-tcp. O único requisito é o Docker.
#     Três etapas: os testes em Go, uma checagem com o curl, e uma checagem com um navegador de
#     verdade. Os contêineres são removidos no fim, mesmo quando uma etapa falha.
# ES: Construye y prueba el miniproyecto http-server-raw-tcp. El único requisito es Docker.
#     Tres etapas: las pruebas en Go, una comprobación con curl y una comprobación con un
#     navegador de verdad. Los contenedores se eliminan al final, incluso cuando una etapa falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte
#     en un error fatal siempre que la salida se redirige, así que los fallos se comprueban por el código de salida.
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
	docker compose run --rm go-test
	if ($LASTEXITCODE -ne 0) { throw "Go tests failed" }
	docker compose run --rm curl-check
	if ($LASTEXITCODE -ne 0) { throw "curl check failed" }
	docker compose run --rm browser-check
	if ($LASTEXITCODE -ne 0) { throw "browser check failed" }
	Write-Output "http-server-raw-tcp: all tests passed"
}
catch {
	Write-Output "http-server-raw-tcp: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
