#!/usr/bin/env sh
# EN: Builds and tests the bun-vs-node mini-project. The only requirement is Docker.
#     Containers are removed at the end, even when a test fails.
#     For the k6 load test and the results table, run ./load-test-unix.sh.
# PT: Constrói e testa o mini-projeto bun-vs-node. O único requisito é o Docker.
#     Os contêineres são removidos no fim, mesmo quando um teste falha.
#     Para o teste de carga com k6 e a tabela de resultados, rode ./load-test-unix.sh.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
# Type check and unit tests.
docker compose run --rm ts-test
# The same API suite against Bun, Node.js and Node.js under PM2 cluster mode.
docker compose run --rm api-test
# The load script must refuse a target that is not local.
docker compose run --rm k6-refusal-test

echo "bun-vs-node: all tests passed"
