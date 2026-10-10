#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the oop-vs-functional mini-project. The only requirement
#     is Docker.
# PT: Constrói, testa e demonstra o mini-projeto oop-vs-functional. O único requisito é o
#     Docker.
# ES: Construye, prueba y demuestra el miniproyecto oop-vs-functional. El único requisito es
#     Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm java-test
docker compose run --rm elixir-test
docker compose run --rm ts-test
echo "oop-vs-functional: all tests passed"

# EN: The demo prints the receipt of every shared scenario, computed in TypeScript by the
#     version with objects and checked against the version with functions. Then the comparison
#     table. The Java and Elixir demos print the same receipts: java-demo and elixir-demo.
# PT: A demo imprime o recibo de cada cenário compartilhado, calculado em TypeScript pela versão
#     com objetos e conferido contra a versão com funções. Depois, a tabela de comparação. As
#     demos em Java e Elixir imprimem os mesmos recibos: java-demo e elixir-demo.
# ES: La demo imprime el recibo de cada escenario compartido, calculado en TypeScript por la
#     versión con objetos y verificado contra la versión con funciones. Después, la tabla de
#     comparación. Las demos en Java y Elixir imprimen los mismos recibos: java-demo y elixir-demo.
docker compose run --rm ts-demo
docker compose run --rm compare
