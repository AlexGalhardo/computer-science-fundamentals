#!/usr/bin/env sh
# EN: Builds the quiz as a static site and serves it on localhost. The only requirement is Docker.
#     Pass "test" to run the unit and end-to-end tests instead.
# PT: Constrói o quiz como site estático e o serve em localhost. O único requisito é o Docker.
#     Passe "test" para rodar os testes unitários e de ponta a ponta.
# ES: Construye el quiz como sitio estático y lo sirve en localhost. El único requisito es Docker.
#     Pasa "test" para ejecutar las pruebas unitarias y de extremo a extremo.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

if [ "${1:-}" = "test" ]; then
	docker compose --profile test build quiz-fixture unit e2e
	docker compose --profile test run --rm unit
	docker compose --profile test up -d quiz-fixture
	status=0
	docker compose --profile test run --rm e2e || status=$?
	docker compose --profile test down
	exit "$status"
fi

docker compose up -d --build quiz
echo "Quiz running at http://localhost:${QUIZ_PORT:-3000}"
echo "Stop it with: docker compose down"
