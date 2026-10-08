# EN: Builds, tests and demonstrates the code-smells mini-project. The only requirement is
#     Docker.
# PT: Constrói, testa e demonstra o mini-projeto code-smells. O único requisito é o Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

# EN: The build already checks types (tsc), format (Spotless) and the negative compile test.
# PT: O build já confere os tipos (tsc), o formato (Spotless) e o teste negativo de compilação.
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm java-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "code-smells: all tests passed"

docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
