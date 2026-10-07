#!/usr/bin/env sh
# EN: Builds and tests the nand-alu-cpu mini-project. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto nand-alu-cpu. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm go-test
docker compose run --rm ts-test
echo "nand-alu-cpu: all tests passed"

# EN: Each demo runs programs/multiply.asm on the CPU, prints the trace and rewrites
#     results/trace.txt. The two implementations write the same bytes.
# PT: Cada demo executa programs/multiply.asm na CPU, imprime o trace e regrava
#     results/trace.txt. As duas implementações gravam os mesmos bytes.
docker compose run --rm ts-demo
docker compose run --rm go-demo
echo "nand-alu-cpu: trace written to results/trace.txt"
