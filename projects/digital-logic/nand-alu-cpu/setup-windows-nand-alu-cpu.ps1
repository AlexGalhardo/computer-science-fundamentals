# EN: Builds and tests the nand-alu-cpu mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto nand-alu-cpu. O único requisito é o Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm ts-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "nand-alu-cpu: all tests passed"

# EN: Each demo runs programs/multiply.asm on the CPU, prints the trace and rewrites
#     results/trace.txt. The two implementations write the same bytes.
# PT: Cada demo executa programs/multiply.asm na CPU, imprime o trace e regrava
#     results/trace.txt. As duas implementacoes gravam os mesmos bytes.
docker compose run --rm ts-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-demo
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output "nand-alu-cpu: trace written to results/trace.txt"
