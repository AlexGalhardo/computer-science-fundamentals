# EN: Builds and tests the ssrf-lab mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the narrated demo, run: docker compose run --rm demo
# PT: Constrói e testa o mini-projeto ssrf-lab. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para a demo narrada, rode: docker compose run --rm demo
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
	Write-Output "ssrf-lab: all tests passed"
}
catch {
	Write-Output "ssrf-lab: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
