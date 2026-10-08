#!/usr/bin/env sh
# EN: Builds and tests the flame-graph mini-project. The only requirement is Docker.
#     Three gates: the unit tests of each language (which also check the committed profiles),
#     and a live run that loads both services, profiles them and checks that the fresh flame
#     graphs point at the hot function. The live run writes to out/, which git ignores, so the
#     committed results/ never change here. Containers are removed at the end, even on failure.
# PT: Constrói e testa o mini-projeto flame-graph. O único requisito é o Docker.
#     Três portões: os testes unitários de cada linguagem (que também conferem os perfis
#     versionados), e uma execução ao vivo que carrega os dois serviços, tira os perfis e
#     confere que os flame graphs novos apontam para a função quente. A execução ao vivo grava
#     em out/, que o git ignora, então a pasta results/ versionada nunca muda aqui. Os
#     contêineres são removidos no fim, mesmo em caso de falha.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm go-test
docker compose run --rm ts-test

mkdir -p out profiles
OUT_DIR=out docker compose run --rm flame

echo "flame-graph: all tests passed"
