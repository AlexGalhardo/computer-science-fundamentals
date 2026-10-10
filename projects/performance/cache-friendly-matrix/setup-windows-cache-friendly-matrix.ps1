# EN: Builds and tests the cache-friendly-matrix mini-project. The only requirement is Docker.
#     For the demo, run `docker compose run --rm cpp-speedup` (see the README).
# PT: Constrói e testa o mini-projeto cache-friendly-matrix. O único requisito é o Docker.
#     Para a demonstração, rode `docker compose run --rm cpp-speedup` (veja o README).
# ES: Construye y prueba el miniproyecto cache-friendly-matrix. El único requisito es Docker.
#     Para la demostración, ejecuta `docker compose run --rm cpp-speedup` (ver el README).
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 lo convierte en un error
#     fatal siempre que la salida se redirige, así que las fallas se verifican por el código de salida.
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
	docker compose run --rm cpp-test
	if ($LASTEXITCODE -ne 0) { throw "C++ tests failed" }
	docker compose run --rm rust-test
	if ($LASTEXITCODE -ne 0) { throw "Rust tests failed" }
	Write-Output "cache-friendly-matrix: all tests passed"
}
catch {
	Write-Output "cache-friendly-matrix: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
