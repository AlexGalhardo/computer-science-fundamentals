#!/usr/bin/env sh
# EN: Builds and tests the gates-karnaugh-adders mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto gates-karnaugh-adders. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto gates-karnaugh-adders. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm python-test
echo "gates-karnaugh-adders: all tests passed"

# EN: The demos print truth tables, minimal expressions and an addition, and rewrite ./results.
# PT: As demos imprimem tabelas-verdade, expressões mínimas e uma soma, e regravam ./results.
# ES: Las demos imprimen tablas de verdad, expresiones mínimas y una suma, y reescriben ./results.
docker compose run --rm ts-demo
docker compose run --rm python-demo
echo "gates-karnaugh-adders: reports written to results/"
