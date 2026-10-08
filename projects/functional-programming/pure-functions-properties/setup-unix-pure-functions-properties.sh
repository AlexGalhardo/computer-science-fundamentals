#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the pure-functions-properties mini-project. The only
#     requirement is Docker.
# PT: Constrói, testa e demonstra o mini-projeto pure-functions-properties. O único requisito
#     é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm elixir-test
echo "pure-functions-properties: all tests passed"

# EN: The demo prints the impure and the pure checkout, the property that finds the seeded
#     bug with its shrunk counterexample, and the sales pipeline, in both languages.
# PT: A demo imprime o checkout impuro e o puro, a propriedade que encontra o erro plantado
#     com o contraexemplo reduzido, e o pipeline de vendas, nas duas linguagens.
docker compose run --rm ts-demo
docker compose run --rm elixir-demo
docker compose down -v
