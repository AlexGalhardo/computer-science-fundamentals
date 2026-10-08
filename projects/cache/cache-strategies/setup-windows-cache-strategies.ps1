# EN: Builds and tests the cache-strategies mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the k6 load test and the results tables, run .\load-test-windows.ps1.
# PT: Constrói e testa o mini-projeto cache-strategies. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o teste de carga com k6 e as tabelas de resultados, rode .\load-test-windows.ps1.
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
	if ($LASTEXITCODE -ne 0) { throw "tests failed" }
	Write-Output "cache-strategies: all tests passed"
}
catch {
	Write-Output "cache-strategies: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
