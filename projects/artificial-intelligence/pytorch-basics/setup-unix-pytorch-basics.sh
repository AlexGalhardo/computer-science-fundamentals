#!/usr/bin/env sh
# EN: Builds and tests the pytorch-basics mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto pytorch-basics. O único requisito é o Docker.
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
echo "pytorch-basics: all tests passed"

# EN: The demo checks the gradients, trains the network, times both versions and rewrites the
#     tables and the loss chart in ./results.
# PT: A demo confere os gradientes, treina a rede, mede o tempo das duas versões e regrava as
#     tabelas e o gráfico de perda em ./results.
docker compose run --rm python-demo
echo "pytorch-basics: results written to results/"
