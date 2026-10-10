#!/usr/bin/env sh
# EN: The load test: k6 against each setup, one at a time, several rounds each. Every round starts
#     from a fresh server container, so the memory peak of one round does not leak into the next.
#     Then the report step rewrites results/ and the table of both READMEs.
#     Usage: ./load-test-unix.sh [rounds]
# PT: O teste de carga: k6 contra cada configuração, uma de cada vez, várias rodadas cada. Toda
#     rodada começa de um contêiner de servidor novo, então o pico de memória de uma rodada não
#     vaza para a seguinte. Depois a etapa de relatório reescreve results/ e a tabela dos dois READMEs.
#     Uso: ./load-test-unix.sh [rodadas]
# ES: La prueba de carga: k6 contra cada configuración, una a la vez, varias rondas cada una. Toda
#     ronda parte de un contenedor de servidor nuevo, así que el pico de memoria de una ronda no
#     se filtra a la siguiente. Después la etapa de reporte reescribe results/ y la tabla de los README.
#     Uso: ./load-test-unix.sh [rondas]
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta corren como el usuario actual (ver docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
ROUNDS="${1:-3}"

trap 'docker compose down -v --remove-orphans' EXIT

# EN: The k6 image runs as an unprivileged user, so the folder must be writable by anyone.
# PT: A imagem do k6 roda como usuário sem privilégios, então a pasta precisa ser gravável por todos.
# ES: La imagen de k6 corre como usuario sin privilegios, así que la carpeta debe ser escribible por todos.
mkdir -p k6-results
rm -f k6-results/*.json
chmod a+rwx k6-results

docker compose build

for setup in bun node node-pm2; do
	round=1
	while [ "$round" -le "$ROUNDS" ]; do
		docker compose up -d --wait --force-recreate "$setup-server"
		docker compose run --rm -e BASE_URL="http://$setup-server:3000" -e SETUP="$setup" -e ROUND="$round" k6
		docker compose stop "$setup-server"
		round=$((round + 1))
	done
done

LOAD_TEST_COMMAND="./load-test-unix.sh $ROUNDS" docker compose run --rm report
