# EN: Builds and tests the bpe-tokenizer mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto bpe-tokenizer. O único requisito é o Docker.
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
Write-Output "bpe-tokenizer: all tests passed"

# EN: The demos print the table "vocabulary size against number of tokens" and rewrite ./results.
# PT: As demos imprimem a tabela "tamanho do vocabulario contra numero de tokens" e regravam ./results.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "bpe-tokenizer: tables written to results/"

# EN: The CLI shows the tokens of any sentence.
# PT: A CLI mostra os tokens de qualquer frase.
docker compose run --rm ts-cli "Tokens are not words."
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
