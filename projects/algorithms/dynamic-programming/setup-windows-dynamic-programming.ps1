# EN: Builds and tests the dynamic-programming mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto dynamic-programming. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto dynamic-programming. El único requisito es Docker.
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
docker compose run --rm python-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "dynamic-programming: all tests passed"
