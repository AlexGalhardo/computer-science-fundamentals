# EN: Builds and tests the mutation-testing mini-project. The only requirement is Docker.
#     It runs the tests, the coverage report of both suites (each must be 100%) and the mutation
#     run, which fails unless the weak suite scores under 60% and the strong one over 90%.
# PT: Constrói e testa o mini-projeto mutation-testing. O único requisito é o Docker.
#     Roda os testes, o relatório de cobertura das duas suítes (cada uma precisa dar 100%) e a
#     execução de mutação, que falha a menos que a suíte fraca pontue abaixo de 60% e a forte
#     acima de 90%.
# ES: Construye y prueba el mini-proyecto mutation-testing. El único requisito es Docker.
#     Ejecuta las pruebas, el informe de cobertura de las dos suites (cada una debe dar 100%) y la
#     ejecución de mutación, que falla a menos que la suite débil puntúe por debajo de 60% y la fuerte
#     por encima de 90%.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

New-Item -ItemType Directory -Force results | Out-Null

$code = 0
try {
	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	foreach ($service in @("ts-test", "coverage-weak", "coverage-strong", "mutation")) {
		docker compose run --rm $service
		if ($LASTEXITCODE -ne 0) { throw "$service failed" }
	}
	Write-Output "mutation-testing: all tests passed"
}
catch {
	Write-Output "mutation-testing: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
