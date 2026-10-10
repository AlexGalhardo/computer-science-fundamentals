#!/usr/bin/env sh
# EN: Builds and tests the backend-patterns mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto backend-patterns. O único requisito é o Docker.
# ES: Construye y prueba el miniproyecto backend-patterns. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
echo "backend-patterns: all tests passed"

# EN: The demo runs one scenario per pattern, on the failing design and on the pattern version.
# PT: A demo roda um cenário por padrão, no desenho com defeito e na versão com o padrão.
# ES: La demo ejecuta un escenario por patrón, en el diseño que falla y en la versión con el patrón.
docker compose run --rm ts-demo
