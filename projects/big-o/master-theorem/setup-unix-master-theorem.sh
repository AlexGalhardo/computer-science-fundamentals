#!/usr/bin/env sh
# EN: Builds and tests the master-theorem mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto master-theorem. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
echo "master-theorem: all tests passed"

# EN: The demo classifies the known recurrences, checks three of them empirically and rewrites
#     ./results, which the page reads.
# PT: A demo classifica as recorrências conhecidas, confere três delas empiricamente e regrava
#     ./results, que a página lê.
docker compose run --rm ts-demo
echo "master-theorem: open dashboard/index.html in a browser to draw recursion trees"
