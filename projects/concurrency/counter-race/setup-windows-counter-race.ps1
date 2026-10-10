# EN: Builds and tests the counter-race mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto counter-race. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto counter-race. El único requisito es Docker.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm rust-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm java-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "counter-race: all tests passed"
