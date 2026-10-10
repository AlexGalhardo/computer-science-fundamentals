#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the clean-architecture-app mini-project. The only
#     requirement is Docker. Containers and volumes are removed at the end, even when a step fails.
#     No container writes into this folder, so no host user id needs to be passed.
# PT: Constrói, testa e demonstra o mini-projeto clean-architecture-app. O único requisito é o
#     Docker. Contêineres e volumes são removidos no fim, mesmo quando um passo falha.
#     Nenhum contêiner grava nesta pasta, então nenhum id de usuário do host precisa ser passado.
# ES: Construye, prueba y demuestra el mini-proyecto clean-architecture-app. El único requisito es
#     Docker. Los contenedores y volúmenes se eliminan al final, incluso cuando un paso falla.
#     Ningún contenedor escribe en esta carpeta, así que no hace falta pasar ningún id de usuario
#     del host.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
# EN: Types, dependency rule and unit tests, in a container with no network.
# PT: Tipos, regra de dependência e testes de unidade, em um contêiner sem rede.
# ES: Tipos, regla de dependencia y pruebas unitarias, en un contenedor sin red.
docker compose run --rm ts-test
# EN: The PostgreSQL adapter against a real PostgreSQL.
# PT: O adaptador PostgreSQL contra um PostgreSQL de verdade.
# ES: El adaptador PostgreSQL contra un PostgreSQL de verdad.
docker compose run --rm ts-integration
# EN: The demo: terminal and HTTP over the same use cases.
# PT: A demonstração: terminal e HTTP sobre os mesmos casos de uso.
# ES: La demostración: terminal y HTTP sobre los mismos casos de uso.
docker compose run --rm demo

echo "clean-architecture-app: all tests passed"
