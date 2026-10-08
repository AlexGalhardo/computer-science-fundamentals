# EN: Runs the burst experiment and rewrites results/ (burst.json, burst.md and the two SVG
#     charts). The container has no network and nothing is sent anywhere: it is a simulation.
# PT: Roda o experimento de rajada e regrava results/ (burst.json, burst.md e os dois gráficos
#     SVG). O contêiner não tem rede e nada é enviado a lugar nenhum: é uma simulação.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build ts-test
$code = $LASTEXITCODE
if ($code -eq 0) {
	docker compose run --rm experiment
	$code = $LASTEXITCODE
}

docker compose down -v --remove-orphans

exit $code
