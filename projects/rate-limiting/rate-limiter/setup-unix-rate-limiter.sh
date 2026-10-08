#!/usr/bin/env sh
# EN: Builds and tests the rate-limiter mini-project. The only requirement is Docker.
#     Steps: in-memory algorithms in TypeScript and in Go, then two application instances
#     sharing one Redis under concurrent load. Containers, network and volumes are removed at
#     the end, even when a step fails. For the burst experiment and its chart, run
#     ./experiment-unix.sh.
# PT: Constrói e testa o mini-projeto rate-limiter. O único requisito é o Docker.
#     Etapas: algoritmos em memória em TypeScript e em Go, depois duas instâncias da aplicação
#     compartilhando um Redis sob carga concorrente. Contêineres, rede e volumes são removidos
#     no fim, mesmo quando uma etapa falha. Para o experimento de rajada e o seu gráfico, rode
#     ./experiment-unix.sh.
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
docker compose run --rm go-test
docker compose run --rm distributed-test

echo "rate-limiter: all tests passed"
