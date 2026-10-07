#!/usr/bin/env sh
# EN: Builds and tests the outbox-saga mini-project. The only requirement is Docker.
#     The tests are end to end: two services, two databases and a broker. Containers and volumes are
#     removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto outbox-saga. O único requisito é o Docker.
#     Os testes são de ponta a ponta: dois serviços, dois bancos e um broker. Contêineres e volumes são
#     removidos no fim, mesmo quando um teste falha.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
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

echo "outbox-saga: all tests passed"
