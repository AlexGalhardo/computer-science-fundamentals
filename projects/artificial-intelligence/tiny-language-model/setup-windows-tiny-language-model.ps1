# EN: Builds and tests the tiny-language-model mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto tiny-language-model. O único requisito é o Docker.
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
Write-Output "tiny-language-model: all tests passed"

# EN: The demo trains the bigram and the transformer, prints the loss and sampling tables and
#     rewrites ./results (results.md, loss-curve.svg, attention.svg).
# PT: A demo treina o bigrama e o transformer, imprime as tabelas de perda e de amostragem e
#     regrava ./results (results.md, loss-curve.svg, attention.svg).
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "tiny-language-model: tables and figures written to results/"
