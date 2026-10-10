# EN: Builds and tests the outbox-saga mini-project. The only requirement is Docker.
#     The tests are end to end: two services, two databases and a broker. Containers and volumes are
#     removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto outbox-saga. O único requisito é o Docker.
#     Os testes são de ponta a ponta: dois serviços, dois bancos e um broker. Contêineres e volumes são
#     removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto outbox-saga. El único requisito es Docker.
#     Las pruebas son de extremo a extremo: dos servicios, dos bases de datos y un broker. Los
#     contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en un
#     error fatal siempre que la salida se redirige, así que los fallos se verifican por el código de salida.
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
	if ($LASTEXITCODE -ne 0) { throw "tests failed" }
	Write-Output "outbox-saga: all tests passed"
}
catch {
	Write-Output "outbox-saga: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
