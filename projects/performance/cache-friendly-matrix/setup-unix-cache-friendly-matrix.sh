#!/usr/bin/env sh
# EN: Builds and tests the cache-friendly-matrix mini-project. The only requirement is Docker.
#     For the demo, run `docker compose run --rm cpp-speedup` (see the README).
# PT: Constrói e testa o mini-projeto cache-friendly-matrix. O único requisito é o Docker.
#     Para a demonstração, rode `docker compose run --rm cpp-speedup` (veja o README).
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm cpp-test
docker compose run --rm rust-test

echo "cache-friendly-matrix: all tests passed"
