#!/usr/bin/env sh
# EN: Builds and tests the solid-before-after mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto solid-before-after. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The Java build also checks the formatting and treats every compiler warning as an error.
# PT: O build do Java também confere a formatação e trata todo aviso do compilador como erro.
docker compose build
docker compose run --rm ts-test
docker compose run --rm java-test
echo "solid-before-after: all tests passed"

# EN: The demo runs the same call on both versions of each principle and compares the answers.
# PT: A demo executa a mesma chamada nas duas versões de cada princípio e compara as respostas.
docker compose run --rm ts-demo
