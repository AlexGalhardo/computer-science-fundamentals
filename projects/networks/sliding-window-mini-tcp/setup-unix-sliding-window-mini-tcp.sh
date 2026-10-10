#!/usr/bin/env sh
# EN: Builds and tests the sliding-window-mini-tcp mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto sliding-window-mini-tcp. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto sliding-window-mini-tcp. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm go-test
docker compose run --rm elixir-test

echo "sliding-window-mini-tcp: all tests passed"
