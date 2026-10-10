# EN: Builds and tests the didactic-blockchain mini-project, then runs the demo with three nodes.
#     The only requirement is Docker. With the argument `bench` it measures the mining time by
#     difficulty instead and rewrites results/mining.md. Containers and the network are removed
#     at the end, even when a step fails.
# PT: Constrói e testa o mini-projeto didactic-blockchain e depois roda a demo com três nós. O
#     único requisito é o Docker. Com o argumento `bench` ele mede o tempo de mineração por
#     dificuldade e reescreve results/mining.md. Contêineres e a rede são removidos no fim,
#     mesmo quando uma etapa falha.
# ES: Construye y prueba el miniproyecto didactic-blockchain y luego ejecuta la demo con tres
#     nodos. El único requisito es Docker. Con el argumento `bench` mide el tiempo de minería
#     por dificultad y reescribe results/mining.md. Los contenedores y la red se eliminan al
#     final, incluso cuando una etapa falla.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
param([string]$Mode = "")

$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

if ($Mode -eq "bench") {
	New-Item -ItemType Directory -Force results | Out-Null
	$steps = @("bench-ts", "bench-rust", "report")
} else {
	$steps = @("ts-test", "rust-test", "rust-demo", "demo")
}

$code = 0
docker compose build
$code = $LASTEXITCODE
foreach ($step in $steps) {
	if ($code -ne 0) { break }
	docker compose run --rm $step
	$code = $LASTEXITCODE
}

docker compose down -v --remove-orphans

if ($code -ne 0) { exit $code }

if ($Mode -eq "bench") {
	Write-Output "didactic-blockchain: results/mining.md written"
} else {
	Write-Output "didactic-blockchain: all tests passed"
}
