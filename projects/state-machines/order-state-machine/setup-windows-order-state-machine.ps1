# EN: Builds, tests and demonstrates the order-state-machine mini-project. The only requirement
#     is Docker.
# PT: Constroi, testa e demonstra o mini-projeto order-state-machine. O unico requisito e o
#     Docker.
# ES: Construye, prueba y demuestra el miniproyecto order-state-machine. El unico requisito es
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
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "order-state-machine: all tests passed"

# EN: The demo walks a full order and then an order with a rejected transition, in both
#     languages.
# PT: A demo conduz um pedido completo e depois um pedido com uma transicao rejeitada, nas duas
#     linguagens.
# ES: La demo recorre un pedido completo y luego un pedido con una transicion rechazada, en los
#     dos lenguajes.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm elixir-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
