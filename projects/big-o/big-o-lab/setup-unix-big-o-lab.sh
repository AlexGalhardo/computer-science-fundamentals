#!/usr/bin/env sh
# EN: Builds and tests the big-o-lab mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto big-o-lab. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto big-o-lab. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
echo "big-o-lab: all tests passed"

# EN: The demo prints the tables and rewrites ./results, which the dashboard reads.
# PT: A demo imprime as tabelas e regrava ./results, que o dashboard lê.
# ES: La demo imprime las tablas y reescribe ./results, que lee el dashboard.
docker compose run --rm ts-demo
echo "big-o-lab: open dashboard/index.html in a browser to see the charts"
