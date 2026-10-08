# EN: Builds and tests the neural-network-from-scratch mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto neural-network-from-scratch. O único requisito é o Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "neural-network-from-scratch: all tests passed"

# EN: The demo trains both networks and rewrites the loss tables and the figures in ./results.
# PT: A demo treina as duas redes e regrava as tabelas de perda e as figuras em ./results.
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "neural-network-from-scratch: results written to results/"
