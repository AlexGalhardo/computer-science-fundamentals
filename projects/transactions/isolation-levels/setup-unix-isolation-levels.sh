#!/usr/bin/env sh
# EN: Builds and tests the isolation-levels mini-project. The only requirement is Docker.
#     The tests regenerate results/ and the matrix of both READMEs. Containers and volumes are
#     removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto isolation-levels. O único requisito é o Docker.
#     Os testes regeneram results/ e a matriz dos dois READMEs. Contêineres e volumes são
#     removidos no fim, mesmo quando um teste falha.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "isolation-levels: all tests passed"
