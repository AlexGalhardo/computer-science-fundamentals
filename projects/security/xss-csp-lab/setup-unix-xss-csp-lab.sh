#!/usr/bin/env sh
# EN: Builds and tests the xss-csp-lab mini-project. The only requirement is Docker.
#     It runs the unit tests (ts-test) and the browser tests (e2e, Playwright with Chromium).
#     Containers and volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto xss-csp-lab. O único requisito é o Docker.
#     Roda os testes unitários (ts-test) e os testes de navegador (e2e, Playwright com Chromium).
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el miniproyecto xss-csp-lab. El único requisito es Docker.
#     Ejecuta las pruebas unitarias (ts-test) y las pruebas de navegador (e2e, Playwright con Chromium).
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test
docker compose run --rm e2e

echo "xss-csp-lab: all tests passed"
