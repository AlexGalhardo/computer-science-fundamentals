#!/usr/bin/env sh
# EN: Runs the benchmark against the three proxies. One warm-up per proxy, then REPETITIONS
#     rounds. Inside a round the proxies are measured one after the other, so they never
#     compete with each other, and a busy moment of the machine does not fall on one of them
#     in every round.
# PT: Roda o benchmark contra os três proxies. Um aquecimento por proxy, depois REPETITIONS
#     rodadas. Dentro de uma rodada os proxies são medidos um depois do outro, então nunca
#     competem entre si, e um momento ocupado da máquina não cai em um deles em toda rodada.
set -eu

REPETITIONS="${REPETITIONS:-5}"
RAW_DIR="${RAW_DIR:-/raw}"
export RAW_DIR

# name=target pairs. The names are the rows of the report.
TARGETS="lb-round-robin=http://lb-rr:8080 lb-least-connections=http://lb-lc:8080 nginx=http://nginx:8080"

rm -f "$RAW_DIR"/*.json

for pair in $TARGETS; do
	NAME=warmup TARGET="${pair#*=}" DURATION_S=3 k6 run --quiet /load/bench.js
done

repetition=1
while [ "$repetition" -le "$REPETITIONS" ]; do
	for pair in $TARGETS; do
		NAME="${pair%%=*}" TARGET="${pair#*=}" REPETITION="$repetition" k6 run --quiet /load/bench.js
	done
	repetition=$((repetition + 1))
done
