#!/usr/bin/env sh
# EN: Builds and tests the http-server-raw-tcp mini-project. The only requirement is Docker.
#     Three steps: the Go tests, a check with curl, and a check with a real browser.
#     Containers are removed at the end, even when a step fails.
# PT: Constrói e testa o mini-projeto http-server-raw-tcp. O único requisito é o Docker.
#     Três etapas: os testes em Go, uma checagem com o curl, e uma checagem com um navegador de
#     verdade. Os contêineres são removidos no fim, mesmo quando uma etapa falha.
# ES: Construye y prueba el miniproyecto http-server-raw-tcp. El único requisito es Docker.
#     Tres etapas: las pruebas en Go, una comprobación con curl y una comprobación con un
#     navegador de verdad. Los contenedores se eliminan al final, incluso cuando una etapa falla.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm go-test
docker compose run --rm curl-check
docker compose run --rm browser-check

echo "http-server-raw-tcp: all tests passed"
