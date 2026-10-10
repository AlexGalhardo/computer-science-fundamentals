#!/usr/bin/env sh
# EN: End-to-end check inside docker-compose: 30 requests through each proxy must be answered
#     with 200, and each of the three back ends must get exactly 10. One request at a time,
#     so least connections always sees a tie and rotates like round robin.
# PT: Verificação de ponta a ponta dentro do docker-compose: 30 requisições por cada proxy
#     precisam ser respondidas com 200, e cada um dos três back ends precisa receber
#     exatamente 10. Uma requisição por vez, então o least connections sempre vê um empate e
#     faz rodízio como o round robin.
# ES: Verificación de punta a punta dentro de docker-compose: 30 solicitudes por cada proxy deben
#     responderse con 200, y cada uno de los tres back ends debe recibir exactamente 10. Una
#     solicitud a la vez, así que el least connections siempre ve un empate y rota como el round
#     robin.
set -eu

failed=0
for proxy in lb-rr lb-lc nginx; do
	answered=""
	i=0
	while [ "$i" -lt 30 ]; do
		# -f makes curl fail on any status other than 2xx, and `set -e` stops the script.
		instance=$(curl -fsS -o /dev/null -D - "http://$proxy:8080/work" | tr -d '\r' | awk 'tolower($1) == "x-instance:" { print $2 }')
		answered="$answered $instance"
		i=$((i + 1))
	done
	line="$proxy:"
	for instance in api-1 api-2 api-3; do
		# shellcheck disable=SC2086 # word splitting is wanted: one name per line
		count=$(printf '%s\n' $answered | grep -c "^$instance\$" || true)
		line="$line $instance=$count"
		if [ "$count" -ne 10 ]; then
			failed=1
		fi
	done
	echo "$line"
done

if [ "$failed" -ne 0 ]; then
	echo "FAIL: expected 10 requests per back end through every proxy"
	exit 1
fi
echo "PASS: every proxy answered 30 requests, 10 per back end"
