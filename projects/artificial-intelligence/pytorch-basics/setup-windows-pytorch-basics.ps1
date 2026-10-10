# EN: Builds and tests the pytorch-basics mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto pytorch-basics. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto pytorch-basics. El único requisito es Docker.
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
Write-Output "pytorch-basics: all tests passed"

# EN: The demo checks the gradients, trains the network, times both versions and rewrites the
#     tables and the loss chart in ./results.
# PT: A demo confere os gradientes, treina a rede, mede o tempo das duas versões e regrava as
#     tabelas e o gráfico de perda em ./results.
# ES: La demo comprueba los gradientes, entrena la red, mide el tiempo de las dos versiones y
#     reescribe las tablas y el gráfico de pérdida en ./results.
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "pytorch-basics: results written to results/"
