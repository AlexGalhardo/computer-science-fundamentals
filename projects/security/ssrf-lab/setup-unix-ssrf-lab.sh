#!/usr/bin/env sh
# EN: Builds and tests the ssrf-lab mini-project. The only requirement is Docker.
#     Containers and volumes are removed at the end, even when a test fails.
#     For the narrated demo, run: docker compose run --rm demo
# PT: Constrói e testa o mini-projeto ssrf-lab. O único requisito é o Docker.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para a demo narrada, rode: docker compose run --rm demo
# ES: Construye y prueba el miniproyecto ssrf-lab. El único requisito es Docker.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para la demo narrada, ejecuta: docker compose run --rm demo
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "ssrf-lab: all tests passed"
