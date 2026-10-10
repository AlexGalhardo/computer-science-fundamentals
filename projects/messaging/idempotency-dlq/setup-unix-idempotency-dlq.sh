#!/usr/bin/env sh
# EN: Builds and tests the idempotency-dlq mini-project. The only requirement is Docker.
#     The TypeScript end-to-end tests use a real RabbitMQ and a real PostgreSQL; the Go tests are
#     in-memory. Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto idempotency-dlq. O único requisito é o Docker.
#     Os testes de ponta a ponta em TypeScript usam um RabbitMQ e um PostgreSQL reais; os testes
#     em Go são em memória. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto idempotency-dlq. El único requisito es Docker.
#     Las pruebas de extremo a extremo en TypeScript usan un RabbitMQ y un PostgreSQL reales; las
#     pruebas en Go son en memoria. Los contenedores y volúmenes se eliminan al final, incluso
#     cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ver
#     docker-compose.yml).
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
docker compose run --rm go-test
docker compose run --rm ts-e2e

echo "idempotency-dlq: all tests passed"
