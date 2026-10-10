# EN: Builds and tests the aloha-csma mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto aloha-csma. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto aloha-csma. El único requisito es Docker.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "aloha-csma: all tests passed"
