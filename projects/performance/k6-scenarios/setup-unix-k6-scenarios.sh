#!/usr/bin/env sh
# EN: Builds and tests the k6-scenarios mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the four k6 scenarios and the reports, run ./load-test-unix.sh.
# PT: Constrói e testa o mini-projeto k6-scenarios. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para os quatro cenários de k6 e os relatórios, rode ./load-test-unix.sh.
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
# Type check, unit tests and the tests against PostgreSQL.
docker compose run --rm ts-test
# The load script must refuse a target that is not local, in every scenario.
docker compose run --rm k6-refusal-test

echo "k6-scenarios: all tests passed"
