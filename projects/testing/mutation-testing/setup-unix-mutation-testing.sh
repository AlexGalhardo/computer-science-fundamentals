#!/usr/bin/env sh
# EN: Builds and tests the mutation-testing mini-project. The only requirement is Docker.
#     It runs the tests, the coverage report of both suites (each must be 100%) and the mutation
#     run, which fails unless the weak suite scores under 60% and the strong one over 90%.
# PT: Constrói e testa o mini-projeto mutation-testing. O único requisito é o Docker.
#     Roda os testes, o relatório de cobertura das duas suítes (cada uma precisa dar 100%) e a
#     execução de mutação, que falha a menos que a suíte fraca pontue abaixo de 60% e a forte
#     acima de 90%.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The mutation container writes into ./results, so it runs with the uid of whoever owns it.
# PT: O contêiner de mutação escreve em ./results, então roda com o uid de quem é dono da pasta.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
mkdir -p results

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test
docker compose run --rm coverage-weak
docker compose run --rm coverage-strong
docker compose run --rm mutation

echo "mutation-testing: all tests passed"
