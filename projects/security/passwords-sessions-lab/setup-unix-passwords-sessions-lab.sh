#!/usr/bin/env sh
# EN: Builds and tests the passwords-sessions-lab security lab. The only requirement is Docker.
#     Containers, networks and volumes are removed at the end, even when a test fails.
#     For the narrated walk-through, run: docker compose run --rm demo
# PT: Constrói e testa o laboratório de segurança passwords-sessions-lab. O único requisito é o Docker.
#     Contêineres, redes e volumes são removidos no fim, mesmo quando um teste falha.
#     Para o passo a passo narrado, rode: docker compose run --rm demo
# ES: Construye y prueba el laboratorio de seguridad passwords-sessions-lab. El único requisito es Docker.
#     Los contenedores, redes y volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para el paso a paso narrado, ejecuta: docker compose run --rm demo
set -eu

cd "$(dirname "$0")"

# EN: The bench service writes into results/, so it runs as the user who started this script.
# PT: O serviço bench grava em results/, então roda como o usuário que iniciou este script.
# ES: El servicio bench escribe en results/, así que corre como el usuario que inició este script.
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

echo "passwords-sessions-lab: all tests passed"
