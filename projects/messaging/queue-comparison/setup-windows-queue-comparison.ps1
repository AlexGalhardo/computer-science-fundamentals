# EN: Builds and tests the queue-comparison mini-project. The only requirement is Docker.
#     The brokers are tested one at a time and removed in between, so the machine never holds
#     Redis, RabbitMQ, Kafka and LocalStack at once. Everything is removed at the end, even when
#     a test fails.
# PT: Constrói e testa o mini-projeto queue-comparison. O único requisito é o Docker.
#     Os brokers são testados um por vez e removidos entre um e outro, então a máquina nunca
#     segura Redis, RabbitMQ, Kafka e LocalStack ao mesmo tempo. Tudo é removido no fim, mesmo
#     quando um teste falha.
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
	foreach ($broker in @("bullmq", "rabbitmq", "kafka", "sqs")) {
		docker compose run --rm "test-$broker"
		if ($LASTEXITCODE -ne 0) { throw "integration tests failed on $broker" }
		docker compose down -v --remove-orphans
	}
	Write-Output "queue-comparison: all tests passed"
}
catch {
	Write-Output "queue-comparison: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
