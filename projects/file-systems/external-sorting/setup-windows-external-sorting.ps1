# EN: Builds and tests the external-sorting mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto external-sorting. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto external-sorting. El único requisito es Docker.
# "Continue": PowerShell 5.1 treats Docker stderr output as an error; exit codes are checked instead.
$ErrorActionPreference = "Continue"

Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Error "Docker is required: https://docs.docker.com/get-docker/"
	exit 1
}

docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm rust-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# EN: The memory-limit demo: each container has 32 MiB of memory and no swap, and sorts a file
#     of 320 MiB. The program fails if its peak resident memory reaches the limit.
# PT: A demonstração do limite de memória: cada contêiner tem 32 MiB de memória e nenhum swap, e
#     ordena um arquivo de 320 MiB. O programa falha se o pico de memória residente chegar ao limite.
# ES: La demostración del límite de memoria: cada contenedor tiene 32 MiB de memoria y ningún
#     swap, y ordena un archivo de 320 MiB. El programa falla si su pico de memoria residente
#     llega al límite.
docker compose run --rm rust-limit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose run --rm go-limit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# EN: The proof that the limit is real: under the same limit, loading the whole file to sort it
#     in memory must NOT finish. The kernel kills the process (exit code 137).
# PT: A prova de que o limite é real: sob o mesmo limite, carregar o arquivo inteiro para ordenar
#     na memória NÃO pode terminar. O núcleo mata o processo (código de saída 137).
# ES: La prueba de que el límite es real: bajo el mismo límite, cargar el archivo entero para
#     ordenarlo en memoria NO puede terminar. El kernel mata el proceso (código de salida 137).
foreach ($service in @("rust-limit", "go-limit")) {
	docker compose run --rm $service extsort in-memory-check 32
	if ($LASTEXITCODE -eq 0) {
		Write-Output "${service}: the in-memory sort finished, so the memory limit is not being enforced"
		exit 1
	}
	Write-Output "${service}: the in-memory sort was killed under the 32 MiB limit, as expected"
}

Write-Output "external-sorting: all tests passed"
# The last docker command above is expected to fail, so the exit code is set explicitly.
exit 0
