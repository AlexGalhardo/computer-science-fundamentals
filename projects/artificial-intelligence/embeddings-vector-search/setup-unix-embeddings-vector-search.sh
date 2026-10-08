#!/usr/bin/env sh
# EN: Builds and tests the embeddings-vector-search mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto embeddings-vector-search. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The demo containers write ./results, so they run with the uid and gid of this user.
# PT: Os containers das demos gravam ./results, então rodam com o uid e o gid deste usuário.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

docker compose build
docker compose run --rm ts-test
docker compose run --rm python-test
echo "embeddings-vector-search: all tests passed"

# EN: The demos print the neighbours, the trade-off of the index and the retrieved passages, and
#     rewrite ./results.
# PT: As demos imprimem os vizinhos, a troca do índice e as passagens recuperadas, e regravam
#     ./results.
docker compose run --rm ts-demo
docker compose run --rm python-demo
echo "embeddings-vector-search: tables written to results/"

# EN: The search command prints the passages retrieved for any question.
# PT: O comando de busca imprime as passagens recuperadas para qualquer pergunta.
docker compose run --rm ts-search "How do I bake a loaf of bread?"
