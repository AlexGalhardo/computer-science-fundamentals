#!/usr/bin/env sh
# EN: Builds and tests the overselling-checkout mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the k6 load test and the results table, run ./load-test-unix.sh.
# PT: Constrói e testa o mini-projeto overselling-checkout. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o teste de carga com k6 e a tabela de resultados, rode ./load-test-unix.sh.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "overselling-checkout: all tests passed"
