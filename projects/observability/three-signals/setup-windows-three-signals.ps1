# EN: Builds and tests the three-signals mini-project. The only requirement is Docker.
#     Unit tests run first, with no network. Then the whole stack starts (three services, the
#     collector, Tempo, Prometheus, Loki and Grafana) and the end-to-end test queries each back
#     end. Containers and volumes are removed at the end, even when a test fails.
#     To explore by hand instead: `docker compose up -d`, then open http://127.0.0.1:3000.
# PT: Constrói e testa o mini-projeto three-signals. O único requisito é o Docker.
#     Os testes unitários rodam primeiro, sem rede. Depois a pilha inteira sobe (três serviços,
#     o collector, Tempo, Prometheus, Loki e Grafana) e o teste de ponta a ponta consulta cada
#     back end. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para explorar à mão: `docker compose up -d`, e abra http://127.0.0.1:3000.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

# EN: Port 0 lets Docker pick a free host port for Grafana during the test run.
# PT: A porta 0 deixa o Docker escolher uma porta livre do host para o Grafana durante os testes.
if (-not $env:GRAFANA_PORT) { $env:GRAFANA_PORT = "0" }

$code = 0
try {
	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "TypeScript unit tests failed" }
	docker compose run --rm go-test
	if ($LASTEXITCODE -ne 0) { throw "Go unit tests failed" }
	docker compose run --rm e2e-test
	if ($LASTEXITCODE -ne 0) { throw "end-to-end tests failed" }
	Write-Output "three-signals: all tests passed"
}
catch {
	Write-Output "three-signals: $_"
	$code = 1
}
finally {
	docker compose --profile screenshot down -v --remove-orphans
}
exit $code
