# EN: Builds and tests the balanced-trees mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto balanced-trees. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto balanced-trees. El único requisito es Docker.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm cpp-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm java-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "balanced-trees: all tests passed"
