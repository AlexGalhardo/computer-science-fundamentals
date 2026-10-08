#!/usr/bin/env sh
# EN: Builds and tests the tensorflow-keras-basics mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto tensorflow-keras-basics. O único requisito é o Docker.
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
echo "tensorflow-keras-basics: all tests passed"

# EN: The demo trains the network with fit and with a gradient tape and rewrites the tables and
#     the loss chart in ./results. TensorFlow prints a few lines about not finding a GPU: they
#     are harmless, everything here runs on the CPU.
# PT: A demo treina a rede com o fit e com uma fita de gradiente e regrava as tabelas e o
#     gráfico de perda em ./results. O TensorFlow imprime algumas linhas sobre não encontrar
#     GPU: são inofensivas, tudo aqui roda na CPU.
docker compose run --rm python-demo
echo "tensorflow-keras-basics: results written to results/"
