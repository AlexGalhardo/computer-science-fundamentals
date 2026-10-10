# EN: Builds and tests the test-pyramid mini-project. The only requirement is Docker.
#     It runs the five suites, from the cheapest to the most expensive, and then the bug matrix,
#     which runs every suite against every seeded bug and writes results/bug-matrix.md.
#     Containers and volumes are removed at the end, even when a suite fails.
# PT: Constrói e testa o mini-projeto test-pyramid. O único requisito é o Docker.
#     Roda as cinco suítes, da mais barata para a mais cara, e depois a matriz de bugs, que roda
#     cada suíte contra cada bug semeado e escreve results/bug-matrix.md.
#     Contêineres e volumes são removidos no fim, mesmo quando uma suíte falha.
# ES: Construye y prueba el mini-proyecto test-pyramid. El único requisito es Docker.
#     Ejecuta las cinco suites, de la más barata a la más cara, y luego la matriz de bugs, que ejecuta
#     cada suite contra cada bug sembrado y escribe results/bug-matrix.md.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una suite falla.
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe su progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte
#     en un error fatal siempre que la salida se redirige, así que los fallos se comprueban por código de salida.
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
	foreach ($service in @("typecheck", "unit", "integration", "regression", "smoke", "e2e", "matrix")) {
		docker compose run --rm $service
		if ($LASTEXITCODE -ne 0) { throw "$service failed" }
	}
	Write-Output "test-pyramid: all tests passed"
}
catch {
	Write-Output "test-pyramid: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
