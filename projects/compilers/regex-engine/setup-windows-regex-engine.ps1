# EN: Builds and tests the regex-engine mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto regex-engine. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto regex-engine. El único requisito es Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "regex-engine: all tests passed"
