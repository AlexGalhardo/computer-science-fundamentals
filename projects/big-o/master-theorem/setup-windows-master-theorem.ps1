# EN: Builds and tests the master-theorem mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto master-theorem. O único requisito é o Docker.
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

Write-Output "master-theorem: all tests passed"

# EN: The demo classifies the known recurrences, checks three of them empirically and rewrites
#     ./results, which the page reads.
# PT: A demo classifica as recorrencias conhecidas, confere tres delas empiricamente e regrava
#     ./results, que a pagina le.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "master-theorem: open dashboard/index.html in a browser to draw recursion trees"
