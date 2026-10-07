#!/usr/bin/env sh
# EN: Builds and tests the ten-thousand-connections mini-project. The only requirement is Docker.
#     The load test itself is a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto ten-thousand-connections. O único requisito é o Docker.
#     O teste de carga em si é um comando separado, documentado no README.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm go-test
docker compose run --rm elixir-test
# The same protocol suite against the three servers, started on the internal network.
docker compose run --rm protocol-test
# The load script must refuse a target that is not local.
docker compose run --rm k6-refusal-test
# Stops the three servers, so that a later load test starts from fresh processes.
docker compose --profile load down

echo "ten-thousand-connections: all tests passed"
