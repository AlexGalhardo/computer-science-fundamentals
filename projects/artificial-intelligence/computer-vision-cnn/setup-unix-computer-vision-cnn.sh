#!/usr/bin/env sh
# EN: Builds and tests the computer-vision-cnn mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto computer-vision-cnn. O único requisito é o Docker.
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
echo "computer-vision-cnn: all tests passed"

# EN: The demo trains the three networks, prints the accuracy tables and rewrites ./results
#     (results.md, the loss curve and the pictures of the filters and activation maps).
# PT: A demo treina as três redes, imprime as tabelas de acurácia e regrava ./results
#     (results.md, a curva de perda e as figuras dos filtros e dos mapas de ativação).
docker compose run --rm python-demo
echo "computer-vision-cnn: tables and pictures written to results/"
