#!/usr/bin/env sh
# EN: Builds and tests the lru-bloom-trie mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto lru-bloom-trie. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm go-test

echo "lru-bloom-trie: all tests passed"
