#!/usr/bin/env sh
# EN: Builds and tests the isolation-levels mini-project. The only requirement is Docker.
#     The tests regenerate results/ and the matrix of both READMEs. Containers and volumes are
#     removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto isolation-levels. O único requisito é o Docker.
#     Os testes regeneram results/ e a matriz dos dois READMEs. Contêineres e volumes são
#     removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el mini-proyecto isolation-levels. El único requisito es Docker.
#     Las pruebas regeneran results/ y la matriz de los READMEs. Los contenedores y volúmenes se
#     eliminan al final, incluso cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ver docker-compose.yml).
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

echo "isolation-levels: all tests passed"
