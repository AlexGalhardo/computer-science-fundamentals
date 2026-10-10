# EN: Builds and tests the pubsub-backpressure mini-project. The only requirement is Docker.
#     The TypeScript end-to-end tests use a real RabbitMQ; the memory experiment and the Elixir
#     GenStage tests need no service. Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto pubsub-backpressure. O único requisito é o Docker.
#     Os testes de ponta a ponta em TypeScript usam um RabbitMQ real; o experimento de memória e os
#     testes do GenStage em Elixir não precisam de serviço. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto pubsub-backpressure. El único requisito es Docker.
#     Las pruebas de extremo a extremo en TypeScript usan un RabbitMQ real; el experimento de
#     memoria y las pruebas de GenStage en Elixir no necesitan ningún servicio. Los contenedores y
#     volúmenes se eliminan al final, incluso cuando una prueba falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe su progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en un
#     error fatal siempre que la salida se redirige, así que los fallos se verifican por el código
#     de salida.
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
	foreach ($service in @("ts-test", "elixir-test", "ts-e2e")) {
		docker compose run --rm $service
		if ($LASTEXITCODE -ne 0) { throw "$service failed" }
	}
	Write-Output "pubsub-backpressure: all tests passed"
}
catch {
	Write-Output "pubsub-backpressure: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
