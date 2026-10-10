#!/usr/bin/env sh
# EN: Builds and tests the queue-comparison mini-project. The only requirement is Docker.
#     The brokers are tested one at a time and removed in between, so the machine never holds
#     Redis, RabbitMQ, Kafka and LocalStack at once. Everything is removed at the end, even when
#     a test fails.
# PT: Constrói e testa o mini-projeto queue-comparison. O único requisito é o Docker.
#     Os brokers são testados um por vez e removidos entre um e outro, então a máquina nunca
#     segura Redis, RabbitMQ, Kafka e LocalStack ao mesmo tempo. Tudo é removido no fim, mesmo
#     quando um teste falha.
# ES: Construye y prueba el mini-proyecto queue-comparison. El único requisito es Docker.
#     Los brokers se prueban uno a la vez y se eliminan entre uno y otro, así que la máquina nunca
#     sostiene Redis, RabbitMQ, Kafka y LocalStack a la vez. Todo se elimina al final, incluso
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
for broker in bullmq rabbitmq kafka sqs; do
	docker compose run --rm "test-$broker"
	docker compose down -v --remove-orphans
done

echo "queue-comparison: all tests passed"
