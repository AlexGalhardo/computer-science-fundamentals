#!/usr/bin/env sh
# EN: Builds and tests the didactic-blockchain mini-project, then runs the demo with three nodes.
#     The only requirement is Docker. With the argument `bench` it measures the mining time by
#     difficulty instead and rewrites results/mining.md. Containers and the network are removed
#     at the end, even when a step fails.
# PT: Constrói e testa o mini-projeto didactic-blockchain e depois roda a demo com três nós. O
#     único requisito é o Docker. Com o argumento `bench` ele mede o tempo de mineração por
#     dificuldade e reescreve results/mining.md. Contêineres e a rede são removidos no fim,
#     mesmo quando uma etapa falha.
set -eu

cd "$(dirname "$0")"

# EN: The benchmark containers write results/ into this folder and run as the current user
#     (see docker-compose.yml).
# PT: Os contêineres do benchmark gravam results/ nesta pasta e rodam como o usuário atual
#     (veja docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build

if [ "${1:-}" = "bench" ]; then
	mkdir -p results
	docker compose run --rm bench-ts
	docker compose run --rm bench-rust
	docker compose run --rm report
	echo "didactic-blockchain: results/mining.md written"
	exit 0
fi

docker compose run --rm ts-test
docker compose run --rm rust-test
docker compose run --rm rust-demo
docker compose run --rm demo

echo "didactic-blockchain: all tests passed"
