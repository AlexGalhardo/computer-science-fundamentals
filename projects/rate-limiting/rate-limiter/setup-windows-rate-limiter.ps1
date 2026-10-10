# EN: Builds and tests the rate-limiter mini-project. The only requirement is Docker.
#     Steps: in-memory algorithms in TypeScript and in Go, then two application instances
#     sharing one Redis under concurrent load. Containers, network and volumes are removed at
#     the end, even when a step fails. For the burst experiment and its chart, run
#     .\experiment-windows.ps1.
# PT: Constrói e testa o mini-projeto rate-limiter. O único requisito é o Docker.
#     Etapas: algoritmos em memória em TypeScript e em Go, depois duas instâncias da aplicação
#     compartilhando um Redis sob carga concorrente. Contêineres, rede e volumes são removidos
#     no fim, mesmo quando uma etapa falha. Para o experimento de rajada e o seu gráfico, rode
#     .\experiment-windows.ps1.
# ES: Construye y prueba el miniproyecto rate-limiter. El único requisito es Docker.
#     Pasos: algoritmos en memoria en TypeScript y en Go, luego dos instancias de la aplicación
#     compartiendo un Redis bajo carga concurrente. Los contenedores, la red y los volúmenes se
#     eliminan al final, incluso cuando un paso falla. Para el experimento de ráfaga y su
#     gráfico, ejecuta .\experiment-windows.ps1.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

$code = 0
docker compose build
$code = $LASTEXITCODE
foreach ($service in @("ts-test", "go-test", "distributed-test")) {
	if ($code -eq 0) {
		docker compose run --rm $service
		$code = $LASTEXITCODE
	}
}

docker compose down -v --remove-orphans

if ($code -ne 0) { exit $code }
Write-Output "rate-limiter: all tests passed"
