#!/usr/bin/env sh
# EN: Builds and tests the cache-strategies mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the k6 load test and the results tables, run ./load-test-unix.sh.
# PT: Constrói e testa o mini-projeto cache-strategies. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o teste de carga com k6 e as tabelas de resultados, rode ./load-test-unix.sh.
# ES: Construye y prueba el miniproyecto cache-strategies. El único requisito es Docker.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para la prueba de carga con k6 y las tablas de resultados, ejecuta ./load-test-unix.sh.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ver docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "cache-strategies: all tests passed"
