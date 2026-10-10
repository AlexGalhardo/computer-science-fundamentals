# EN: Builds and tests the ci-pipeline mini-project. The only requirement is Docker.
#     With no argument (or "test") it demonstrates every quality gate of
#     .github/workflows/ci.yml and checks, for each one, that it passes on a clean copy and
#     fails with the prepared change. With "demo <gate> [<gate> ...]" it shows only those gates.
#     The repository is mounted read-only, so no container writes into it. Containers and
#     networks are removed at the end.
# PT: Constrói e testa o mini-projeto ci-pipeline. O único requisito é o Docker.
#     Sem argumento (ou com "test") demonstra cada portão de qualidade do
#     .github/workflows/ci.yml e confere, para cada um, que ele passa em uma cópia limpa e falha
#     com a mudança preparada. Com "demo <gate> [<gate> ...]" mostra só esses portões.
#     O repositório é montado somente leitura, então nenhum contêiner escreve nele. Contêineres e
#     redes são removidos no fim.
# ES: Construye y prueba el mini-proyecto ci-pipeline. El único requisito es Docker.
#     Sin argumento (o con "test") demuestra cada puerta de calidad de
#     .github/workflows/ci.yml y comprueba, para cada una, que pasa en una copia limpia y falla
#     con el cambio preparado. Con "demo <gate> [<gate> ...]" muestra solo esas puertas.
#     El repositorio se monta de solo lectura, así que ningún contenedor escribe en él. Los
#     contenedores y redes se eliminan al final.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

$allGates = "biome markdownlint typecheck unit-tests quiz-validate docs-index format-python format-go format-rust format-cpp format-elixir quiz-e2e dashboards mini-project"

# EN: Each gate runs in the image the workflow uses for it, so the gate name picks the service.
# PT: Cada portão roda na imagem que o workflow usa para ele, então o nome do portão escolhe o serviço.
# ES: Cada puerta corre en la imagen que el workflow usa para ella, así que el nombre de la puerta elige el servicio.
function Get-GateService([string]$gate) {
	if ($gate -like "format-*") { return $gate.Substring(7) }
	if ($gate -eq "quiz-e2e") { return "e2e" }
	if ($gate -eq "dashboards") { return "dashboards" }
	return "ts"
}

$mode = "test"
if ($args.Count -gt 0) { $mode = $args[0] }
if ($mode -ne "test" -and $mode -ne "demo") {
	Write-Output "usage: setup-windows-ci-pipeline.ps1 [test | demo <gate> [<gate> ...]]"
	exit 2
}
if ($mode -eq "demo" -and $args.Count -lt 2) {
	Write-Output "usage: setup-windows-ci-pipeline.ps1 demo <gate> [<gate> ...]"
	Write-Output "gates: $allGates"
	exit 2
}

$code = 0
try {
	if ($mode -eq "demo") {
		foreach ($gate in $args[1..($args.Count - 1)]) {
			$service = Get-GateService $gate
			docker compose build $service
			if ($LASTEXITCODE -ne 0) { throw "the build of $service failed" }
			docker compose run --rm $service $gate
			if ($LASTEXITCODE -ne 0) { throw "the demonstration of $gate did not behave as expected" }
		}
	}
	else {
		docker compose build
		if ($LASTEXITCODE -ne 0) { throw "build failed" }
		foreach ($service in @("ts", "python", "go", "rust", "cpp", "elixir", "e2e", "dashboards")) {
			docker compose run --rm $service
			if ($LASTEXITCODE -ne 0) { throw "the gates of the $service service did not behave as expected" }
		}
		Write-Output "ci-pipeline: all tests passed"
	}
}
catch {
	Write-Output "ci-pipeline: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
