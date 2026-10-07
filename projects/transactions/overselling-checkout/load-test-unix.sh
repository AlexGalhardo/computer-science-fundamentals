#!/usr/bin/env sh
# EN: The load test: 200 concurrent buyers of 10 units, three rounds per strategy, with k6
#     against the local API. Then the report step checks the acceptance criteria and rewrites
#     results/ and the table of both READMEs. Usage: ./load-test-unix.sh [rounds]
# PT: O teste de carga: 200 compradores concorrentes de 10 unidades, três rodadas por estratégia,
#     com k6 contra a API local. Depois a etapa de relatório confere os critérios de aceite e
#     reescreve results/ e a tabela dos dois READMEs. Uso: ./load-test-unix.sh [rodadas]
set -eu

cd "$(dirname "$0")"
ROUNDS="${1:-3}"

trap 'docker compose down -v --remove-orphans' EXIT

# EN: The k6 image runs as an unprivileged user, so the folder must be writable by anyone.
# PT: A imagem do k6 roda como usuário sem privilégios, então a pasta precisa ser gravável por todos.
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
