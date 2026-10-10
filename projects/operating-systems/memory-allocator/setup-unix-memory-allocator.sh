#!/usr/bin/env sh
# EN: Builds and tests the memory-allocator mini-project, then runs the demo, which prints the
#     fragmentation benchmark and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto memory-allocator e depois roda a demo, que imprime o
#     benchmark de fragmentação e grava results/. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto memory-allocator y luego ejecuta la demo, que imprime el
#     benchmark de fragmentación y escribe results/. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm cpp-test
docker compose run --rm rust-test
docker compose run --rm demo

echo "memory-allocator: all tests passed"
