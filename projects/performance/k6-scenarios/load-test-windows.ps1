# EN: The demo: the four k6 scenarios (load, stress, spike, soak) against the API with a pool of
#     2 connections, then the same four with a pool of 20. Then the report step writes one
#     Markdown summary per scenario and fails unless every scenario crossed a threshold before
#     the fix and none after. Takes about six minutes.
#     Usage: .\load-test-windows.ps1 [-PoolBefore 2] [-PoolAfter 20]
# PT: A demonstração: os quatro cenários de k6 (load, stress, spike, soak) contra a API com um pool
#     de 2 conexões, depois os mesmos quatro com um pool de 20. Depois a etapa de relatório grava
#     um resumo Markdown por cenário e falha a menos que todo cenário tenha ultrapassado um
#     threshold antes da correção e nenhum depois. Leva cerca de seis minutos.
#     Uso: .\load-test-windows.ps1 [-PoolBefore 2] [-PoolAfter 20]
param([int]$PoolBefore = 2, [int]$PoolAfter = 20)

# EN: Docker writes its progress to stderr, so failures are checked by exit code (see the setup script).
# PT: O Docker escreve o progresso em stderr, então as falhas são conferidas pelo código de saída
#     (veja o script de setup).
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

$code = 0
try {
	New-Item -ItemType Directory -Force k6-results | Out-Null
	Remove-Item k6-results\*.json -ErrorAction SilentlyContinue

	docker compose build
	if ($LASTEXITCODE -ne 0) { throw "build failed" }

	foreach ($variant in @(@("before", $PoolBefore), @("after", $PoolAfter))) {
		foreach ($scenario in @("load", "stress", "spike", "soak")) {
			# EN: A fresh API process for every scenario, so the queue left by one never leaks into the next.
			# PT: Um processo novo da API para cada cenário, então a fila deixada por um nunca vaza para o seguinte.
			$env:POOL_SIZE = "$($variant[1])"
			docker compose up -d --wait --force-recreate api
			if ($LASTEXITCODE -ne 0) { throw "the API did not start" }
			# EN: Exit code 99 means "a threshold was crossed", which is the expected outcome before
			#     the fix. Any other failure stops the script. The report step is the judge of both.
			# PT: Código de saída 99 significa "um threshold foi ultrapassado", que é o resultado
			#     esperado antes da correção. Qualquer outra falha para o script. A etapa de
			#     relatório é quem julga os dois casos.
			docker compose run --rm -e "SCENARIO=$scenario" -e "VARIANT=$($variant[0])" k6
			if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 99) { throw "k6 failed with exit code $LASTEXITCODE" }
			Write-Output "$($variant[0]) ${scenario}: k6 exit code $LASTEXITCODE"
		}
	}

	$env:LOAD_TEST_COMMAND = ".\load-test-windows.ps1 -PoolBefore $PoolBefore -PoolAfter $PoolAfter"
	docker compose run --rm report
	if ($LASTEXITCODE -ne 0) { throw "the report found a violated acceptance criterion" }
}
catch {
	Write-Output "k6-scenarios: $_"
	$code = 1
}
finally {
	Remove-Item Env:\POOL_SIZE -ErrorAction SilentlyContinue
	docker compose down -v --remove-orphans
}
exit $code
