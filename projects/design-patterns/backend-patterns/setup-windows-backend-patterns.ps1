# EN: Builds and tests the backend-patterns mini-project. The only requirement is Docker.
# PT: Constroi e testa o mini-projeto backend-patterns. O unico requisito e o Docker.
# ES: Construye y prueba el miniproyecto backend-patterns. El unico requisito es Docker.
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

Write-Output "backend-patterns: all tests passed"

# EN: The demo runs one scenario per pattern, on the failing design and on the pattern version.
# PT: A demo roda um cenario por padrao, no desenho com defeito e na versao com o padrao.
# ES: La demo ejecuta un escenario por patron, en el diseno que falla y en la version con el patron.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
