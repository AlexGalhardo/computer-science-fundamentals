#!/usr/bin/env sh
# EN: Builds and tests the rest-graphql-jsonrpc mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto rest-graphql-jsonrpc. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto rest-graphql-jsonrpc. El único requisito es Docker.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

# EN: The benchmark container writes results/ into this folder and runs as the current user
#     (see docker-compose.yml).
# PT: O contêiner do benchmark grava results/ nesta pasta e roda como o usuário atual
#     (veja docker-compose.yml).
# ES: El contenedor del benchmark escribe results/ en esta carpeta y corre como el usuario actual
#     (ver docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "rest-graphql-jsonrpc: all tests passed"
