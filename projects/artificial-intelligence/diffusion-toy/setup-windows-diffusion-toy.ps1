# EN: Builds and tests the diffusion-toy mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto diffusion-toy. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto diffusion-toy. El único requisito es Docker.
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
Write-Output "diffusion-toy: all tests passed"

# EN: The demo trains the network, runs the forward and the reverse process and rewrites the
#     figures and the tables in ./results.
# PT: A demo treina a rede, roda o processo direto e o reverso e regrava as figuras e as tabelas
#     em ./results.
# ES: La demo entrena la red, ejecuta el proceso directo y el inverso y reescribe las figuras y las
#     tablas en ./results.
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "diffusion-toy: figures and tables written to results/"
