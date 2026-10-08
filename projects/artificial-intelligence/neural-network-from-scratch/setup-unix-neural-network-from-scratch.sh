#!/usr/bin/env sh
# EN: Builds and tests the neural-network-from-scratch mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto neural-network-from-scratch. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The demo container writes ./results, so it runs with the uid and gid of this user.
# PT: O container da demo grava ./results, então roda com o uid e o gid deste usuário.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

docker compose build
docker compose run --rm python-test
echo "neural-network-from-scratch: all tests passed"

# EN: The demo trains both networks and rewrites the loss tables and the figures in ./results.
# PT: A demo treina as duas redes e regrava as tabelas de perda e as figuras em ./results.
docker compose run --rm python-demo
echo "neural-network-from-scratch: results written to results/"
