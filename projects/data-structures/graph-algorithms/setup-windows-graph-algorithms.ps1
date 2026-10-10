# EN: Builds and tests the graph-algorithms mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto graph-algorithms. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto graph-algorithms. El único requisito es Docker.
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
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "graph-algorithms: all tests passed"
