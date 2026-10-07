# EN: Builds and tests the big-o-lab mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto big-o-lab. O único requisito é o Docker.
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

Write-Output "big-o-lab: all tests passed"

# EN: The demo prints the tables and rewrites ./results, which the dashboard reads.
# PT: A demo imprime as tabelas e regrava ./results, que o dashboard le.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "big-o-lab: open dashboard/index.html in a browser to see the charts"
