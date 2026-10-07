#!/usr/bin/env sh
# EN: Builds and tests the sorting-lower-bound mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto sorting-lower-bound. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm python-test
echo "sorting-lower-bound: all tests passed"

# EN: The demos print the decision tree and the comparison tables, and rewrite ./results.
# PT: As demos imprimem a árvore de decisão e as tabelas de comparações, e regravam ./results.
docker compose run --rm ts-demo
docker compose run --rm python-demo
echo "sorting-lower-bound: tables written to results/"
