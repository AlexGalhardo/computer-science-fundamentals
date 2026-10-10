#!/usr/bin/env sh
# EN: Builds and tests the l7-load-balancer mini-project. The only requirement is Docker.
#     The benchmark against NGINX is a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto l7-load-balancer. O único requisito é o Docker.
#     O benchmark contra o NGINX é um comando separado, documentado no README.
# ES: Construye y prueba el mini-proyecto l7-load-balancer. El único requisito es Docker.
#     El benchmark contra NGINX es un comando aparte, documentado en el README.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The container that writes ./results runs as the user who owns that folder.
# PT: O contêiner que escreve em ./results roda como o usuário dono dessa pasta.
# ES: El contenedor que escribe en ./results corre como el usuario dueño de esa carpeta.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

# Stops and removes everything, whether the tests passed or not.
trap 'docker compose --profile bench down -v --remove-orphans' EXIT

docker compose build
# gofmt, go vet and every Go test with the race detector, with no network.
docker compose run --rm go-test
# Three back ends, the balancer twice (one per strategy) and NGINX: 10 requests per back end.
docker compose run --rm smoke-test
# The k6 script must refuse a target that is not local.
docker compose run --rm k6-refusal-test

echo "l7-load-balancer: all tests passed"
