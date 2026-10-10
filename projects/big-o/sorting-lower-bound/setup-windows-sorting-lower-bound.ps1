# EN: Builds and tests the sorting-lower-bound mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto sorting-lower-bound. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto sorting-lower-bound. El único requisito es Docker.
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

Write-Output "sorting-lower-bound: all tests passed"

# EN: The demos print the decision tree and the comparison tables, and rewrite ./results.
# PT: As demos imprimem a arvore de decisao e as tabelas de comparacoes, e regravam ./results.
# ES: Las demos imprimen el árbol de decisión y las tablas de comparaciones, y reescriben ./results.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "sorting-lower-bound: tables written to results/"
