#!/usr/bin/env sh
# EN: The load test: 200 concurrent buyers of 10 units, three rounds per strategy, with k6
#     against the local API. Then the report step checks the acceptance criteria and rewrites
#     results/ and the table of both READMEs. Usage: ./load-test-unix.sh [rounds]
# PT: O teste de carga: 200 compradores concorrentes de 10 unidades, três rodadas por estratégia,
#     com k6 contra a API local. Depois a etapa de relatório confere os critérios de aceite e
#     reescreve results/ e a tabela dos dois READMEs. Uso: ./load-test-unix.sh [rodadas]
# ES: La prueba de carga: 200 compradores concurrentes de 10 unidades, tres rondas por estrategia,
#     con k6 contra la API local. Después la etapa de informe verifica los criterios de aceptación y
#     reescribe results/ y la tabla de los READMEs. Uso: ./load-test-unix.sh [rondas]
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ver docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
ROUNDS="${1:-3}"

trap 'docker compose down -v --remove-orphans' EXIT

# EN: The k6 image runs as an unprivileged user, so the folder must be writable by anyone.
# PT: A imagem do k6 roda como usuário sem privilégios, então a pasta precisa ser gravável por todos.
# ES: La imagen de k6 se ejecuta como usuario sin privilegios, así que la carpeta debe ser escribible por todos.
mkdir -p k6-results
rm -f k6-results/*.json
chmod a+rwx k6-results

docker compose build
docker compose up -d --wait api

for strategy in naive optimistic pessimistic serializable; do
	round=1
	while [ "$round" -le "$ROUNDS" ]; do
		docker compose run --rm -e STRATEGY="$strategy" -e ROUND="$round" k6
		round=$((round + 1))
	done
done

docker compose run --rm -e LOAD_TEST_COMMAND="./load-test-unix.sh $ROUNDS" report
