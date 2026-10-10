# EN: Builds and tests the deadlock-mini-shell mini-project, then runs the two demos: the
#     deadlock report (which writes results/) and a script in the mini shell. The only
#     requirement is Docker.
# PT: Constrói e testa o mini-projeto deadlock-mini-shell e depois roda as duas demos: o
#     relatório de impasses (que grava results/) e um script no mini shell. O único requisito
#     é o Docker.
# ES: Construye y prueba el mini-proyecto deadlock-mini-shell y luego ejecuta las dos demos: el
#     informe de deadlocks (que escribe results/) y un script en el mini shell. El único
#     requisito es Docker.
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
docker compose run --rm cpp-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm shell-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "deadlock-mini-shell: all tests passed"
