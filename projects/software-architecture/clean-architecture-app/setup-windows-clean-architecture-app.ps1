# EN: Builds, tests and demonstrates the clean-architecture-app mini-project. The only
#     requirement is Docker. Containers and volumes are removed at the end, even when a step fails.
# PT: Constrói, testa e demonstra o mini-projeto clean-architecture-app. O único requisito é o
#     Docker. Contêineres e volumes são removidos no fim, mesmo quando um passo falha.
# ES: Construye, prueba y demuestra el mini-proyecto clean-architecture-app. El único requisito es
#     Docker. Los contenedores y volúmenes se eliminan al final, incluso cuando un paso falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en un
#     error fatal siempre que la salida se redirige, así que las fallas se verifican por el código
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
	# EN: Types, dependency rule and unit tests, in a container with no network.
	# PT: Tipos, regra de dependência e testes de unidade, em um contêiner sem rede.
	# ES: Tipos, regla de dependencia y pruebas unitarias, en un contenedor sin red.
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "unit tests failed" }
	# EN: The PostgreSQL adapter against a real PostgreSQL.
	# PT: O adaptador PostgreSQL contra um PostgreSQL de verdade.
	# ES: El adaptador PostgreSQL contra un PostgreSQL de verdad.
	docker compose run --rm ts-integration
	if ($LASTEXITCODE -ne 0) { throw "integration tests failed" }
	# EN: The demo: terminal and HTTP over the same use cases.
	# PT: A demonstração: terminal e HTTP sobre os mesmos casos de uso.
	# ES: La demostración: terminal y HTTP sobre los mismos casos de uso.
	docker compose run --rm demo
	if ($LASTEXITCODE -ne 0) { throw "demo failed" }
	Write-Output "clean-architecture-app: all tests passed"
}
catch {
	Write-Output "clean-architecture-app: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
