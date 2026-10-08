# EN: Builds and tests the flame-graph mini-project. The only requirement is Docker.
#     Three gates: the unit tests of each language (which also check the committed profiles),
#     and a live run that loads both services, profiles them and checks that the fresh flame
#     graphs point at the hot function. The live run writes to out/, which git ignores, so the
#     committed results/ never change here. Containers are removed at the end, even on failure.
# PT: Constrói e testa o mini-projeto flame-graph. O único requisito é o Docker.
#     Três portões: os testes unitários de cada linguagem (que também conferem os perfis
#     versionados), e uma execução ao vivo que carrega os dois serviços, tira os perfis e
#     confere que os flame graphs novos apontam para a função quente. A execução ao vivo grava
#     em out/, que o git ignora, então a pasta results/ versionada nunca muda aqui. Os
#     contêineres são removidos no fim, mesmo em caso de falha.
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
	docker compose run --rm go-test
	if ($LASTEXITCODE -ne 0) { throw "Go tests failed" }
	docker compose run --rm ts-test
	if ($LASTEXITCODE -ne 0) { throw "TypeScript tests failed" }

	New-Item -ItemType Directory -Force out, profiles | Out-Null
	$env:OUT_DIR = "out"
	docker compose run --rm flame
	if ($LASTEXITCODE -ne 0) { throw "live profile check failed" }
	Write-Output "flame-graph: all tests passed"
}
catch {
	Write-Output "flame-graph: $_"
	$code = 1
}
finally {
	Remove-Item Env:OUT_DIR -ErrorAction SilentlyContinue
	docker compose down -v --remove-orphans
}
exit $code
