# EN: The load test: 200 concurrent buyers of 10 units, three rounds per strategy, with k6
#     against the local API. Then the report step checks the acceptance criteria and rewrites
#     results/ and the table of both READMEs. Usage: .\load-test-windows.ps1 [-Rounds 3]
# PT: O teste de carga: 200 compradores concorrentes de 10 unidades, três rodadas por estratégia,
#     com k6 contra a API local. Depois a etapa de relatório confere os critérios de aceite e
#     reescreve results/ e a tabela dos dois READMEs. Uso: .\load-test-windows.ps1 [-Rounds 3]
param([int]$Rounds = 3)

# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
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

	foreach ($strategy in "naive", "optimistic", "pessimistic", "serializable") {
		foreach ($round in 1..$Rounds) {
			docker compose run --rm -e STRATEGY=$strategy -e ROUND=$round k6
			if ($LASTEXITCODE -ne 0) { throw "k6 failed for $strategy round $round" }
		}
	}

	docker compose run --rm -e LOAD_TEST_COMMAND=".\load-test-windows.ps1 -Rounds $Rounds" report
	if ($LASTEXITCODE -ne 0) { throw "the report found an acceptance violation" }
}
catch {
	Write-Output "overselling-checkout load test: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
