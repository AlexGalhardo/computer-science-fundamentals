# EN: Builds and tests the tensorflow-keras-basics mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto tensorflow-keras-basics. O único requisito é o Docker.
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
Write-Output "tensorflow-keras-basics: all tests passed"

# EN: The demo trains the network with fit and with a gradient tape and rewrites the tables and
#     the loss chart in ./results. TensorFlow prints a few lines about not finding a GPU: they
#     are harmless, everything here runs on the CPU.
# PT: A demo treina a rede com o fit e com uma fita de gradiente e regrava as tabelas e o
#     gráfico de perda em ./results. O TensorFlow imprime algumas linhas sobre não encontrar
#     GPU: são inofensivas, tudo aqui roda na CPU.
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "tensorflow-keras-basics: results written to results/"
