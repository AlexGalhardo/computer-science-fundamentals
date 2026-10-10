#!/usr/bin/env sh
# EN: Builds and tests the cpu-scheduling mini-project, then runs the demo, which prints the
#     Gantt charts and the comparison table and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto cpu-scheduling e depois roda a demo, que imprime os gráficos
#     de Gantt e a tabela de comparação e grava results/. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto cpu-scheduling y luego ejecuta la demo, que imprime los
#     diagramas de Gantt y la tabla de comparación y escribe results/. El único requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm ts-test
docker compose run --rm python-test
docker compose run --rm demo

echo "cpu-scheduling: all tests passed. Open dashboard/index.html to see the Gantt charts."
