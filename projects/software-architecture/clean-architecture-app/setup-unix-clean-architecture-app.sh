#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the clean-architecture-app mini-project. The only
#     requirement is Docker. Containers and volumes are removed at the end, even when a step fails.
#     No container writes into this folder, so no host user id needs to be passed.
# PT: Constrói, testa e demonstra o mini-projeto clean-architecture-app. O único requisito é o
#     Docker. Contêineres e volumes são removidos no fim, mesmo quando um passo falha.
#     Nenhum contêiner grava nesta pasta, então nenhum id de usuário do host precisa ser passado.
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
docker compose run --rm ts-test
# EN: The PostgreSQL adapter against a real PostgreSQL.
# PT: O adaptador PostgreSQL contra um PostgreSQL de verdade.
docker compose run --rm ts-integration
# EN: The demo: terminal and HTTP over the same use cases.
# PT: A demonstração: terminal e HTTP sobre os mesmos casos de uso.
docker compose run --rm demo

echo "clean-architecture-app: all tests passed"
