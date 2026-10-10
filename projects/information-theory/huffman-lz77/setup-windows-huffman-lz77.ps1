# EN: Builds and tests the huffman-lz77 mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto huffman-lz77. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto huffman-lz77. El único requisito es Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm rust-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "huffman-lz77: all tests passed"
