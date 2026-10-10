#!/usr/bin/env sh
# EN: Builds and tests the structured-logs mini-project. The only requirement is Docker.
#     Unit tests run first, with no network. Then the end-to-end test starts both variants of
#     the three services, the broker and Loki. Containers and volumes are removed at the end,
#     even when a test fails.
# PT: Constrói e testa o mini-projeto structured-logs. O único requisito é o Docker.
#     Os testes unitários rodam primeiro, sem rede. Depois o teste de ponta a ponta sobe as duas
#     variantes dos três serviços, o broker e o Loki. Contêineres e volumes são removidos no
#     fim, mesmo quando um teste falha.
# ES: Construye y prueba el miniproyecto structured-logs. El único requisito es Docker.
#     Las pruebas unitarias corren primero, sin red. Después la prueba de extremo a extremo levanta las dos
#     variantes de los tres servicios, el broker y Loki. Los contenedores y los volúmenes se eliminan al
#     final, incluso cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ve docker-compose.yml).
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
docker compose run --rm e2e-test

echo "structured-logs: all tests passed"
