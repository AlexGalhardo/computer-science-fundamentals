# EN: Builds and tests the structured-logs mini-project. The only requirement is Docker.
#     Unit tests run first, with no network. Then the end-to-end test starts both variants of
#     the three services, the broker and Loki. Containers and volumes are removed at the end,
#     even when a test fails.
# PT: Constrói e testa o mini-projeto structured-logs. O único requisito é o Docker.
#     Os testes unitários rodam primeiro, sem rede. Depois o teste de ponta a ponta sobe as duas
#     variantes dos três serviços, o broker e o Loki. Contêineres e volumes são removidos no
#     fim, mesmo quando um teste falha.
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

$code = 0
try {
	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "unit tests failed" }
	docker compose run --rm e2e-test
	if ($LASTEXITCODE -ne 0) { throw "end-to-end tests failed" }
	Write-Output "structured-logs: all tests passed"
}
catch {
	Write-Output "structured-logs: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
