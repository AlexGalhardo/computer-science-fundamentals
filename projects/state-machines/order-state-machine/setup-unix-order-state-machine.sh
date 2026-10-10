#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the order-state-machine mini-project. The only requirement
#     is Docker.
# PT: Constrói, testa e demonstra o mini-projeto order-state-machine. O único requisito é o
#     Docker.
# ES: Construye, prueba y demuestra el miniproyecto order-state-machine. El único requisito es
#     Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm elixir-test
echo "order-state-machine: all tests passed"

# EN: The demo walks a full order and then an order with a rejected transition, in both
#     languages.
# PT: A demo conduz um pedido completo e depois um pedido com uma transição rejeitada, nas duas
#     linguagens.
# ES: La demo recorre un pedido completo y luego un pedido con una transición rechazada, en los
#     dos lenguajes.
docker compose run --rm ts-demo
docker compose run --rm elixir-demo
