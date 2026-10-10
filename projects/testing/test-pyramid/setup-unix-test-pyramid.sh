#!/usr/bin/env sh
# EN: Builds and tests the test-pyramid mini-project. The only requirement is Docker.
#     It runs the five suites, from the cheapest to the most expensive, and then the bug matrix,
#     which runs every suite against every seeded bug and writes results/bug-matrix.md.
#     Containers and volumes are removed at the end, even when a suite fails.
# PT: Constrói e testa o mini-projeto test-pyramid. O único requisito é o Docker.
#     Roda as cinco suítes, da mais barata para a mais cara, e depois a matriz de bugs, que roda
#     cada suíte contra cada bug semeado e escreve results/bug-matrix.md.
#     Contêineres e volumes são removidos no fim, mesmo quando uma suíte falha.
# ES: Construye y prueba el mini-proyecto test-pyramid. El único requisito es Docker.
#     Ejecuta las cinco suites, de la más barata a la más cara, y luego la matriz de bugs, que ejecuta
#     cada suite contra cada bug sembrado y escribe results/bug-matrix.md.
#     Los contenedores y volúmenes se eliminan al final, incluso cuando una suite falla.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The matrix container writes into ./results, so it runs with the uid of whoever owns it.
# PT: O contêiner da matriz escreve em ./results, então roda com o uid de quem é dono da pasta.
# ES: El contenedor de la matriz escribe en ./results, así que se ejecuta con el uid de quien es dueño de la carpeta.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
mkdir -p results

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm typecheck
docker compose run --rm unit
docker compose run --rm integration
docker compose run --rm regression
docker compose run --rm smoke
docker compose run --rm e2e
docker compose run --rm matrix

echo "test-pyramid: all tests passed"
