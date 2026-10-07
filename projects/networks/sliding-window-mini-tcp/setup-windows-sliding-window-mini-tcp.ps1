# EN: Builds and tests the sliding-window-mini-tcp mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto sliding-window-mini-tcp. O único requisito é o Docker.
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
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "sliding-window-mini-tcp: all tests passed"
