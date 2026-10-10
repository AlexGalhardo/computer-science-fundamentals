#!/usr/bin/env sh
# EN: Builds and tests the external-sorting mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto external-sorting. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto external-sorting. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm rust-test
docker compose run --rm go-test

# EN: The memory-limit demo: each container has 32 MiB of memory and no swap, and sorts a file
#     of 320 MiB. The program fails if its peak resident memory reaches the limit.
# PT: A demonstração do limite de memória: cada contêiner tem 32 MiB de memória e nenhum swap, e
#     ordena um arquivo de 320 MiB. O programa falha se o pico de memória residente chegar ao limite.
# ES: La demostración del límite de memoria: cada contenedor tiene 32 MiB de memoria y ningún
#     swap, y ordena un archivo de 320 MiB. El programa falla si su pico de memoria residente
#     llega al límite.
docker compose run --rm rust-limit
docker compose run --rm go-limit

# EN: The proof that the limit is real: under the same limit, loading the whole file to sort it
#     in memory must NOT finish. The kernel kills the process (exit code 137).
# PT: A prova de que o limite é real: sob o mesmo limite, carregar o arquivo inteiro para ordenar
#     na memória NÃO pode terminar. O núcleo mata o processo (código de saída 137).
# ES: La prueba de que el límite es real: bajo el mismo límite, cargar el archivo entero para
#     ordenarlo en memoria NO puede terminar. El kernel mata el proceso (código de salida 137).
for service in rust-limit go-limit; do
	if docker compose run --rm "$service" extsort in-memory-check 32; then
		echo "$service: the in-memory sort finished, so the memory limit is not being enforced" >&2
		exit 1
	fi
	echo "$service: the in-memory sort was killed under the 32 MiB limit, as expected"
done

echo "external-sorting: all tests passed"
