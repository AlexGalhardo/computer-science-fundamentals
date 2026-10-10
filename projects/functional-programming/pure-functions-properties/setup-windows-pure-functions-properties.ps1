# EN: Builds, tests and demonstrates the pure-functions-properties mini-project. The only
#     requirement is Docker.
# PT: Constroi, testa e demonstra o mini-projeto pure-functions-properties. O unico requisito
#     e o Docker.
# ES: Construye, prueba y demuestra el mini-proyecto pure-functions-properties. El unico requisito
#     es Docker.
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
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "pure-functions-properties: all tests passed"

# EN: The demo prints the impure and the pure checkout, the property that finds the seeded
#     bug with its shrunk counterexample, and the sales pipeline, in both languages.
# PT: A demo imprime o checkout impuro e o puro, a propriedade que encontra o erro plantado
#     com o contraexemplo reduzido, e o pipeline de vendas, nas duas linguagens.
# ES: La demo imprime el checkout impuro y el puro, la propiedad que encuentra el error sembrado
#     con el contraejemplo reducido, y el pipeline de ventas, en los dos lenguajes.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose down -v
