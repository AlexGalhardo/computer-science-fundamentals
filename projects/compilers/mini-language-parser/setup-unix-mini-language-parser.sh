#!/usr/bin/env sh
# EN: Builds and tests the mini-language-parser mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto mini-language-parser. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto mini-language-parser. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test

echo "mini-language-parser: all tests passed"
