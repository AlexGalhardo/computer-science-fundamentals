# EN: Builds and tests the solid-before-after mini-project. The only requirement is Docker.
# PT: Constroi e testa o mini-projeto solid-before-after. O unico requisito e o Docker.
# ES: Construye y prueba el miniproyecto solid-before-after. El unico requisito es Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

# EN: The Java build also checks the formatting and treats every compiler warning as an error.
# PT: O build do Java tambem confere a formatacao e trata todo aviso do compilador como erro.
# ES: La construccion de Java tambien comprueba el formato y trata todo aviso del compilador como error.
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm java-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "solid-before-after: all tests passed"

# EN: The demo runs the same call on both versions of each principle and compares the answers.
# PT: A demo executa a mesma chamada nas duas versoes de cada principio e compara as respostas.
# ES: La demo ejecuta la misma llamada en las dos versiones de cada principio y compara las respuestas.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
