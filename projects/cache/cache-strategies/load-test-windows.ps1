# EN: The load test, with k6 against the local API. First the stampede: 300 readers of one hot
#     key, with no protection, with a lock and with early refresh. Then hit rate and latency:
#     three strategies times three times to live. The report step checks the acceptance
#     criteria and rewrites results/ and the tables of both READMEs.
#     Usage: .\load-test-windows.ps1 [-Rounds 3]     (default 3, about 6 minutes)
# PT: O teste de carga, com k6 contra a API local. Primeiro o estouro da manada: 300 leitores de
#     uma chave quente, sem proteção, com trava e com renovação antecipada. Depois taxa de acerto
#     e latência: três estratégias vezes três tempos de vida. A etapa de relatório confere os
#     critérios de aceite e reescreve results/ e as tabelas dos dois READMEs.
#     Uso: .\load-test-windows.ps1 [-Rounds 3]       (padrão 3, cerca de 6 minutos)
# ES: La prueba de carga, con k6 contra la API local. Primero el stampede: 300 lectores de una
#     clave caliente, sin protección, con bloqueo y con renovación anticipada. Después tasa de
#     aciertos y latencia: tres estrategias por tres tiempos de vida. El paso de reporte
#     verifica los criterios de aceptación y reescribe results/ y las tablas de los tres README.
#     Uso: .\load-test-windows.ps1 [-Rounds 3]       (por defecto 3, unos 6 minutos)
param([int]$Rounds = 3)

# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe su progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en
#     un error fatal siempre que la salida se redirige, así que las fallas se verifican por el código de salida.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

$code = 0
try {
	New-Item -ItemType Directory -Force k6-results | Out-Null
	Remove-Item k6-results\*.json -ErrorAction SilentlyContinue

	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }
	docker compose up -d --wait api
	if ($LASTEXITCODE -ne 0) { throw "the API did not start" }

	foreach ($round in 1..$Rounds) {
		foreach ($mode in "none", "lock", "early") {
			docker compose run --rm -e MODE=$mode -e ROUND=$round k6-stampede
			if ($LASTEXITCODE -ne 0) { throw "k6 failed for stampede $mode round $round" }
		}
		foreach ($strategy in "cache-aside", "write-through", "write-behind") {
			foreach ($ttl in 250, 1000, 5000) {
				docker compose run --rm -e STRATEGY=$strategy -e TTL_MS=$ttl -e ROUND=$round k6-hit-rate
				if ($LASTEXITCODE -ne 0) { throw "k6 failed for hit-rate $strategy ttl $ttl round $round" }
			}
		}
	}

	docker compose run --rm -e LOAD_TEST_COMMAND=".\load-test-windows.ps1 -Rounds $Rounds" report
	if ($LASTEXITCODE -ne 0) { throw "the report found an acceptance violation" }
}
catch {
	Write-Output "cache-strategies load test: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
