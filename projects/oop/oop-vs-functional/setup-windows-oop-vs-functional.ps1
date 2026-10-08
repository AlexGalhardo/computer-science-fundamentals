# EN: Builds, tests and demonstrates the oop-vs-functional mini-project. The only requirement
#     is Docker.
# PT: Constrói, testa e demonstra o mini-projeto oop-vs-functional. O único requisito é o
#     Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm java-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "oop-vs-functional: all tests passed"

# EN: The demo prints the receipt of every shared scenario, then the comparison table.
# PT: A demo imprime o recibo de cada cenário compartilhado e depois a tabela de comparação.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm compare
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
