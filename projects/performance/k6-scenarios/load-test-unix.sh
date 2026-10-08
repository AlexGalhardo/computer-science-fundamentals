#!/usr/bin/env sh
# EN: The demo: the four k6 scenarios (load, stress, spike, soak) against the API with a pool of
#     2 connections, then the same four with a pool of 20. Then the report step writes one
#     Markdown summary per scenario and fails unless every scenario crossed a threshold before
#     the fix and none after. Takes about six minutes.
#     Usage: ./load-test-unix.sh [pool before] [pool after]
# PT: A demonstração: os quatro cenários de k6 (load, stress, spike, soak) contra a API com um pool
#     de 2 conexões, depois os mesmos quatro com um pool de 20. Depois a etapa de relatório grava
#     um resumo Markdown por cenário e falha a menos que todo cenário tenha ultrapassado um
#     threshold antes da correção e nenhum depois. Leva cerca de seis minutos.
#     Uso: ./load-test-unix.sh [pool antes] [pool depois]
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
POOL_BEFORE="${1:-2}"
POOL_AFTER="${2:-20}"

trap 'docker compose down -v --remove-orphans' EXIT

# EN: The k6 image runs as an unprivileged user, so the folder must be writable by anyone.
# PT: A imagem do k6 roda como usuário sem privilégios, então a pasta precisa ser gravável por todos.
mkdir -p k6-results
rm -f k6-results/*.json
chmod a+rwx k6-results

docker compose build

run_variant() {
	variant="$1"
	# EN: Exported, so every docker compose command below sees the same configuration of `api`.
	#     With a different value, `docker compose run k6` would recreate the API with the default pool.
	# PT: Exportado, para que todo comando docker compose abaixo veja a mesma configuração de `api`.
	#     Com um valor diferente, o `docker compose run k6` recriaria a API com o pool padrão.
	POOL_SIZE="$2"
	export POOL_SIZE
	for scenario in load stress spike soak; do
		# EN: A fresh API process for every scenario, so the queue left by one never leaks into the next.
		# PT: Um processo novo da API para cada cenário, então a fila deixada por um nunca vaza para o seguinte.
		docker compose up -d --wait --force-recreate api
		# EN: Exit code 99 means "a threshold was crossed", which is the expected outcome before the
		#     fix. Any other failure stops the script. The report step is the judge of both.
		# PT: Código de saída 99 significa "um threshold foi ultrapassado", que é o resultado
		#     esperado antes da correção. Qualquer outra falha para o script. A etapa de relatório
		#     é quem julga os dois casos.
		code=0
		docker compose run --rm -e SCENARIO="$scenario" -e VARIANT="$variant" k6 || code=$?
		if [ "$code" -ne 0 ] && [ "$code" -ne 99 ]; then
			echo "k6 failed with exit code $code" >&2
			exit "$code"
		fi
		echo "$variant $scenario: k6 exit code $code"
	done
}

run_variant before "$POOL_BEFORE"
run_variant after "$POOL_AFTER"

LOAD_TEST_COMMAND="./load-test-unix.sh $POOL_BEFORE $POOL_AFTER" docker compose run --rm report
