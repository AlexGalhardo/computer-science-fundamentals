#!/usr/bin/env sh
# EN: Builds and tests the deadlock-mini-shell mini-project, then runs the two demos: the
#     deadlock report (which writes results/) and a script in the mini shell. The only
#     requirement is Docker.
# PT: Constrói e testa o mini-projeto deadlock-mini-shell e depois roda as duas demos: o
#     relatório de impasses (que grava results/) e um script no mini shell. O único requisito
#     é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm go-test
docker compose run --rm cpp-test
docker compose run --rm demo
docker compose run --rm shell-demo

echo "deadlock-mini-shell: all tests passed"
