#!/usr/bin/env sh
# EN: Builds and tests the tiny-language-model mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto tiny-language-model. O único requisito é o Docker.
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
echo "tiny-language-model: all tests passed"

# EN: The demo trains the bigram and the transformer, prints the loss and sampling tables and
#     rewrites ./results (results.md, loss-curve.svg, attention.svg).
# PT: A demo treina o bigrama e o transformer, imprime as tabelas de perda e de amostragem e
#     regrava ./results (results.md, loss-curve.svg, attention.svg).
docker compose run --rm python-demo
echo "tiny-language-model: tables and figures written to results/"
