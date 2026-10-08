# EN: Builds and tests the idempotency-dlq mini-project. The only requirement is Docker.
#     The TypeScript end-to-end tests use a real RabbitMQ and a real PostgreSQL; the Go tests are
#     in-memory. Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto idempotency-dlq. O único requisito é o Docker.
#     Os testes de ponta a ponta em TypeScript usam um RabbitMQ e um PostgreSQL reais; os testes
#     em Go são em memória. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
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
	foreach ($service in @("ts-test", "go-test", "ts-e2e")) {
		docker compose run --rm $service
		if ($LASTEXITCODE -ne 0) { throw "$service failed" }
	}
	Write-Output "idempotency-dlq: all tests passed"
}
catch {
	Write-Output "idempotency-dlq: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
