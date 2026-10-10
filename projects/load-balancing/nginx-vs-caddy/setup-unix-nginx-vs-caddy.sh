#!/usr/bin/env sh
# EN: Builds and tests the nginx-vs-caddy mini-project. The only requirement is Docker.
#     The experiments that write the tables are a separate command, documented in the README.
# PT: Constrói e testa o mini-projeto nginx-vs-caddy. O único requisito é o Docker.
#     Os experimentos que escrevem as tabelas são um comando separado, documentado no README.
# ES: Construye y prueba el mini-proyecto nginx-vs-caddy. El único requisito es Docker.
#     Los experimentos que escriben las tablas son un comando aparte, documentado en el README.
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
trap 'docker compose --profile lab down -v --remove-orphans' EXIT

docker compose build
# Type check and unit tests, with no network.
docker compose run --rm ts-test
# Syntax of the two proxy configurations, and formatting of the Caddyfile.
docker compose run --rm caddy-config-test
docker compose run --rm nginx-config-test
# Both stacks: three instances, NGINX on 127.0.0.1:18480 and Caddy on 127.0.0.1:18481.
docker compose up -d --wait nginx caddy
# Distribution of every algorithm and the failure of one instance, through both proxies.
docker compose run --rm lab-test
# The load generator must refuse a target that is not local.
docker compose run --rm refusal-test

echo "nginx-vs-caddy: all tests passed"
