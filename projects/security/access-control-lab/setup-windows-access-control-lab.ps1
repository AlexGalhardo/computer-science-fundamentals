# EN: Builds and tests the access-control-lab security lab. The only requirement is Docker.
#     Containers, networks and volumes are removed at the end, even when a test fails.
#     For the narrated walk-through, run: docker compose run --rm demo
# PT: Constrói e testa o laboratório de segurança access-control-lab. O único requisito é o Docker.
#     Contêineres, redes e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o passo a passo narrado, rode: docker compose run --rm demo
# ES: Construye y prueba el laboratorio de seguridad access-control-lab. El único requisito es Docker.
#     Los contenedores, redes y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para el paso a paso narrado, ejecuta: docker compose run --rm demo
# EN: Docker writes its progress to stderr. With "Stop", Windows PowerShell 5.1 turns that into a
#     terminating error whenever the output is redirected, so failures are checked by exit code.
# PT: O Docker escreve o progresso em stderr. Com "Stop", o Windows PowerShell 5.1 transforma isso
#     em erro fatal sempre que a saída é redirecionada, então as falhas são conferidas pelo código de saída.
# ES: Docker escribe el progreso en stderr. Con "Stop", Windows PowerShell 5.1 convierte eso en un
#     error fatal siempre que la salida se redirige, así que los fallos se comprueban por el código de salida.
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
	Write-Output "access-control-lab: all tests passed"
}
catch {
	Write-Output "access-control-lab: $_"
	$code = 1
}
finally {
	docker compose down -v --remove-orphans
}
exit $code
