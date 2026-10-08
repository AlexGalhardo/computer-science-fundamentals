# EN: Builds and tests the computer-vision-cnn mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto computer-vision-cnn. O único requisito é o Docker.
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
Write-Output "computer-vision-cnn: all tests passed"

# EN: The demo trains the three networks, prints the accuracy tables and rewrites ./results
#     (results.md, the loss curve and the pictures of the filters and activation maps).
# PT: A demo treina as tres redes, imprime as tabelas de acuracia e regrava ./results
#     (results.md, a curva de perda e as figuras dos filtros e dos mapas de ativacao).
docker compose run --rm python-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "computer-vision-cnn: tables and pictures written to results/"
