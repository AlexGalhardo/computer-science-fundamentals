# EN: Builds and tests the flaky-tests mini-project. The only requirement is Docker.
#     It runs the deterministic tests, then each flaky test 50 times (each must fail at least
#     once) and each fixed test 500 times (none may fail). Containers are removed at the end.
# PT: Constrói e testa o mini-projeto flaky-tests. O único requisito é o Docker.
#     Roda os testes determinísticos, depois cada teste intermitente 50 vezes (cada um precisa
#     falhar ao menos uma vez) e cada teste corrigido 500 vezes (nenhum pode falhar). Os
#     contêineres são removidos no fim.
# ES: Construye y prueba el mini-proyecto flaky-tests. El único requisito es Docker.
#     Ejecuta las pruebas deterministas, luego cada prueba intermitente 50 veces (cada una debe
#     fallar al menos una vez) y cada prueba corregida 500 veces (ninguna puede fallar). Los
#     contenedores se eliminan al final.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
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
	foreach ($service in @("ts-test", "flaky", "fixed")) {
		docker compose run --rm $service
		if ($LASTEXITCODE -ne 0) { throw "$service failed" }
	}
	Write-Output "flaky-tests: all tests passed"
}
catch {
	Write-Output "flaky-tests: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
