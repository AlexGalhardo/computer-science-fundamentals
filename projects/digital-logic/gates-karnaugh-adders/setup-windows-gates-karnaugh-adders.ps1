# EN: Builds and tests the gates-karnaugh-adders mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto gates-karnaugh-adders. O único requisito é o Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

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

Write-Output "gates-karnaugh-adders: all tests passed"

# EN: The demos print truth tables, minimal expressions and an addition, and rewrite ./results.
# PT: As demos imprimem tabelas-verdade, expressoes minimas e uma soma, e regravam ./results.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "gates-karnaugh-adders: reports written to results/"
