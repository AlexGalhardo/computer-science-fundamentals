#!/usr/bin/env sh
# EN: Builds and tests the diffusion-toy mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto diffusion-toy. O único requisito é o Docker.
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
echo "diffusion-toy: all tests passed"

# EN: The demo trains the network, runs the forward and the reverse process and rewrites the
#     figures and the tables in ./results.
# PT: A demo treina a rede, roda o processo direto e o reverso e regrava as figuras e as tabelas
#     em ./results.
docker compose run --rm python-demo
echo "diffusion-toy: figures and tables written to results/"
