# EN: Builds and tests the memory-allocator mini-project, then runs the demo, which prints the
#     fragmentation benchmark and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto memory-allocator e depois roda a demo, que imprime o
#     benchmark de fragmentação e grava results/. O único requisito é o Docker.
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
docker compose run --rm rust-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "memory-allocator: all tests passed"
