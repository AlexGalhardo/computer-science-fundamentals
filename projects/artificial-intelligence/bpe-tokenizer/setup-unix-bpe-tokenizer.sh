#!/usr/bin/env sh
# EN: Builds and tests the bpe-tokenizer mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto bpe-tokenizer. O único requisito é o Docker.
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
echo "bpe-tokenizer: all tests passed"

# EN: The demos print the table "vocabulary size against number of tokens" and rewrite ./results.
# PT: As demos imprimem a tabela "tamanho do vocabulário contra número de tokens" e regravam ./results.
docker compose run --rm ts-demo
docker compose run --rm python-demo
echo "bpe-tokenizer: tables written to results/"

# EN: The CLI shows the tokens of any sentence.
# PT: A CLI mostra os tokens de qualquer frase.
docker compose run --rm ts-cli "Tokens are not words."
