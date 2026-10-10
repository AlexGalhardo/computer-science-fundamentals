# EN: Builds the quiz as a static site and serves it on localhost. The only requirement is Docker.
#     Pass "test" to run the unit and end-to-end tests instead.
# PT: Constrói o quiz como site estático e o serve em localhost. O único requisito é o Docker.
#     Passe "test" para rodar os testes unitários e de ponta a ponta.
# ES: Construye el quiz como sitio estático y lo sirve en localhost. El único requisito es Docker.
#     Pasa "test" para ejecutar las pruebas unitarias y de extremo a extremo.
param([string]$Mode = "")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

if ($Mode -eq "test") {
	docker compose --profile test build quiz-fixture unit e2e
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
	docker compose --profile test run --rm unit
	if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
	docker compose --profile test up -d quiz-fixture
	docker compose --profile test run --rm e2e
	$status = $LASTEXITCODE
	docker compose --profile test down
	exit $status
}

docker compose up -d --build quiz
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$port = if ($env:QUIZ_PORT) { $env:QUIZ_PORT } else { "3000" }
Write-Output "Quiz running at http://localhost:$port"
Write-Output "Stop it with: docker compose down"
