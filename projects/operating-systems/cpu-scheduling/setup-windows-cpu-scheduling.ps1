# EN: Builds and tests the cpu-scheduling mini-project, then runs the demo, which prints the
#     Gantt charts and the comparison table and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto cpu-scheduling e depois roda a demo, que imprime os gráficos
#     de Gantt e a tabela de comparação e grava results/. O único requisito é o Docker.
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
docker compose run --rm demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "cpu-scheduling: all tests passed. Open dashboard/index.html to see the Gantt charts."
