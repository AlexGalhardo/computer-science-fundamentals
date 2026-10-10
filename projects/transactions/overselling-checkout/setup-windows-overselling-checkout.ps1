# EN: Builds and tests the overselling-checkout mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the k6 load test and the results table, run .\load-test-windows.ps1.
# PT: Constrói e testa o mini-projeto overselling-checkout. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o teste de carga com k6 e a tabela de resultados, rode .\load-test-windows.ps1.
# ES: Construye y prueba el mini-proyecto overselling-checkout. El único requisito es Docker.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para la prueba de carga con k6 y la tabla de resultados, ejecuta .\load-test-windows.ps1.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en un
#     error fatal siempre que la salida se redirige, así que los fallos se verifican por el código de salida.
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
	if ($LASTEXITCODE -ne 0) { throw "tests failed" }
	Write-Output "overselling-checkout: all tests passed"
}
catch {
	Write-Output "overselling-checkout: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
