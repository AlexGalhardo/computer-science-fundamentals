# EN: Builds and tests the paging-tlb mini-project, then runs the demo, which prints the
#     page-fault tables and the TLB experiment and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto paging-tlb e depois roda a demo, que imprime as tabelas de
#     faltas de página e o experimento da TLB e grava results/. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto paging-tlb y luego ejecuta la demo, que imprime las
#     tablas de fallos de página y el experimento de la TLB y escribe results/. El único
#     requisito es Docker.
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm rust-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "paging-tlb: all tests passed"
