# EN: Builds and tests the embeddings-vector-search mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto embeddings-vector-search. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto embeddings-vector-search. El único requisito es Docker.
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
Write-Output "embeddings-vector-search: all tests passed"

# EN: The demos print the neighbours, the trade-off of the index and the retrieved passages, and
#     rewrite ./results.
# PT: As demos imprimem os vizinhos, a troca do indice e as passagens recuperadas, e regravam
#     ./results.
# ES: Las demos imprimen los vecinos, el intercambio del indice y los pasajes recuperados, y
#     reescriben ./results.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "embeddings-vector-search: tables written to results/"

# EN: The search command prints the passages retrieved for any question.
# PT: O comando de busca imprime as passagens recuperadas para qualquer pergunta.
# ES: El comando de busqueda imprime los pasajes recuperados para cualquier pregunta.
docker compose run --rm ts-search "How do I bake a loaf of bread?"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
