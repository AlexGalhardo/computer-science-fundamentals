#!/usr/bin/env sh
# EN: Builds and tests the paging-tlb mini-project, then runs the demo, which prints the
#     page-fault tables and the TLB experiment and writes results/. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto paging-tlb e depois roda a demo, que imprime as tabelas de
#     faltas de página e o experimento da TLB e grava results/. O único requisito é o Docker.
# ES: Construye y prueba el mini-proyecto paging-tlb y luego ejecuta la demo, que imprime las
#     tablas de fallos de página y el experimento de la TLB y escribe results/. El único
#     requisito es Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm rust-test
docker compose run --rm ts-test
docker compose run --rm demo

echo "paging-tlb: all tests passed"
