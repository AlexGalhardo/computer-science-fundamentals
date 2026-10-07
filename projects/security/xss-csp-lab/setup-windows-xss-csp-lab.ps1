# EN: Builds and tests the xss-csp-lab mini-project. The only requirement is Docker.
#     It runs the unit tests (ts-test) and the browser tests (e2e, Playwright with Chromium).
#     Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto xss-csp-lab. O único requisito é o Docker.
#     Roda os testes unitários (ts-test) e os testes de navegador (e2e, Playwright com Chromium).
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
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
	docker compose run --rm e2e
	if ($LASTEXITCODE -ne 0) { throw "browser tests failed" }
	Write-Output "xss-csp-lab: all tests passed"
}
catch {
	Write-Output "xss-csp-lab: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
