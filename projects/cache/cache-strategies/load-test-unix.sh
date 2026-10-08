#!/usr/bin/env sh
# EN: The load test, with k6 against the local API. First the stampede: 300 readers of one hot
#     key, with no protection, with a lock and with early refresh. Then hit rate and latency:
#     three strategies times three times to live. The report step checks the acceptance
#     criteria and rewrites results/ and the tables of both READMEs.
#     Usage: ./load-test-unix.sh [rounds]     (default 3, about 6 minutes)
# PT: O teste de carga, com k6 contra a API local. Primeiro o estouro da manada: 300 leitores de
#     uma chave quente, sem proteção, com trava e com renovação antecipada. Depois taxa de acerto
#     e latência: três estratégias vezes três tempos de vida. A etapa de relatório confere os
#     critérios de aceite e reescreve results/ e as tabelas dos dois READMEs.
#     Uso: ./load-test-unix.sh [rodadas]      (padrão 3, cerca de 6 minutos)
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
ROUNDS="${1:-3}"

trap 'docker compose down -v --remove-orphans' EXIT

# EN: The k6 image runs as an unprivileged user, so the folder must be writable by anyone.
# PT: A imagem do k6 roda como usuário sem privilégios, então a pasta precisa ser gravável por todos.
mkdir -p k6-results
rm -f k6-results/*.json
chmod a+rwx k6-results

docker compose build
docker compose up -d --wait api

round=1
while [ "$round" -le "$ROUNDS" ]; do
	for mode in none lock early; do
		docker compose run --rm -e MODE="$mode" -e ROUND="$round" k6-stampede
	done
	for strategy in cache-aside write-through write-behind; do
		for ttl in 250 1000 5000; do
			docker compose run --rm -e STRATEGY="$strategy" -e TTL_MS="$ttl" -e ROUND="$round" k6-hit-rate
		done
	done
	round=$((round + 1))
done

docker compose run --rm -e LOAD_TEST_COMMAND="./load-test-unix.sh $ROUNDS" report
