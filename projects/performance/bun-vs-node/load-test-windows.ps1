# EN: The load test: k6 against each setup, one at a time, several rounds each. Every round starts
#     from a fresh server container, so the memory peak of one round does not leak into the next.
#     Then the report step rewrites results/ and the table of both READMEs.
#     Usage: .\load-test-windows.ps1 [-Rounds 3]
# PT: O teste de carga: k6 contra cada configuração, uma de cada vez, várias rodadas cada. Toda
#     rodada começa de um contêiner de servidor novo, então o pico de memória de uma rodada não
#     vaza para a seguinte. Depois a etapa de relatório reescreve results/ e a tabela dos dois READMEs.
#     Uso: .\load-test-windows.ps1 [-Rounds 3]
# ES: La prueba de carga: k6 contra cada configuración, una a la vez, varias rondas cada una. Toda
#     ronda parte de un contenedor de servidor nuevo, así que el pico de memoria de una ronda no
#     se filtra a la siguiente. Después la etapa de reporte reescribe results/ y la tabla de los README.
#     Uso: .\load-test-windows.ps1 [-Rounds 3]
param([int]$Rounds = 3)

# EN: Docker writes its progress to stderr, so failures are checked by exit code (see the setup script).
# PT: O Docker escreve o progresso em stderr, então as falhas são conferidas pelo código de saída
#     (veja o script de setup).
# ES: Docker escribe el progreso en stderr, así que las fallas se verifican por el código de salida
#     (ver el script de setup).
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

$code = 0
try {
	New-Item -ItemType Directory -Force k6-results | Out-Null
	Remove-Item k6-results\*.json -ErrorAction SilentlyContinue

	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }

	foreach ($setup in @("bun", "node", "node-pm2")) {
		for ($round = 1; $round -le $Rounds; $round++) {
			$server = "$setup-server"
			docker compose up -d --wait --force-recreate $server
			if ($LASTEXITCODE -ne 0) { throw "$server did not start" }
			docker compose run --rm -e "BASE_URL=http://${server}:3000" -e "SETUP=$setup" -e "ROUND=$round" k6
			if ($LASTEXITCODE -ne 0) { throw "k6 failed for $setup round $round" }
			docker compose stop $server
		}
	}

	$env:LOAD_TEST_COMMAND = ".\load-test-windows.ps1 -Rounds $Rounds"
	docker compose run --rm report
	if ($LASTEXITCODE -ne 0) { throw "the report found a violated acceptance criterion" }
}
catch {
	Write-Output "bun-vs-node: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
