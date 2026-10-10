#!/usr/bin/env sh
# EN: Builds and tests the jwt-lab security lab. The only requirement is Docker.
#     Containers, networks and volumes are removed at the end, even when a test fails.
#     For the narrated walk-through, run: docker compose run --rm demo
# PT: Constrói e testa o laboratório de segurança jwt-lab. O único requisito é o Docker.
#     Contêineres, redes e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o passo a passo narrado, rode: docker compose run --rm demo
# ES: Construye y prueba el laboratorio de seguridad jwt-lab. El único requisito es Docker.
#     Los contenedores, redes y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para el paso a paso narrado, ejecuta: docker compose run --rm demo
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

echo "jwt-lab: all tests passed"
