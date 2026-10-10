#!/usr/bin/env sh
# EN: Builds and tests the pubsub-backpressure mini-project. The only requirement is Docker.
#     The TypeScript end-to-end tests use a real RabbitMQ; the memory experiment and the Elixir
#     GenStage tests need no service. Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto pubsub-backpressure. O único requisito é o Docker.
#     Os testes de ponta a ponta em TypeScript usam um RabbitMQ real; o experimento de memória e os
#     testes do GenStage em Elixir não precisam de serviço. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto pubsub-backpressure. El único requisito es Docker.
#     Las pruebas de extremo a extremo en TypeScript usan un RabbitMQ real; el experimento de
#     memoria y las pruebas de GenStage en Elixir no necesitan ningún servicio. Los contenedores y
#     volúmenes se eliminan al final, incluso cuando una prueba falla.
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
docker compose run --rm elixir-test
docker compose run --rm ts-e2e

echo "pubsub-backpressure: all tests passed"
