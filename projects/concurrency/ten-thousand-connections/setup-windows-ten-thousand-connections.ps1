# EN: Builds and tests the ten-thousand-connections mini-project. The only requirement is Docker.
#     The load test itself is a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto ten-thousand-connections. O único requisito é o Docker.
#     O teste de carga em si é um comando separado, documentado no README.
# ES: Construye y prueba el mini-proyecto ten-thousand-connections. El único requisito es Docker.
#     La prueba de carga en sí es un comando separado, documentado en el README.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# The same protocol suite against the three servers, started on the internal network.
docker compose run --rm protocol-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# The load script must refuse a target that is not local.
docker compose run --rm k6-refusal-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# Stops the three servers, so that a later load test starts from fresh processes.
docker compose --profile load down
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "ten-thousand-connections: all tests passed"
