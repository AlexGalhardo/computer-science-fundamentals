#!/usr/bin/env sh
# EN: Builds and tests the scaling-by-cores mini-project, then runs a short demo of the three
#     implementations. The only requirement is Docker.
# PT: Constrói e testa o mini-projeto scaling-by-cores e depois roda uma demonstração curta das
#     três implementações. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

docker compose build
docker compose run --rm rust-test
docker compose run --rm go-test
docker compose run --rm cpp-test
docker compose run --rm report-test

echo "scaling-by-cores: all tests passed"

# EN: Demo: the same Mandelbrot image with 1 and with 8 workers. The checksum must not change,
#     and elapsedMs should drop.
# PT: Demonstração: a mesma imagem de Mandelbrot com 1 e com 8 trabalhadores. O checksum não
#     pode mudar, e o elapsedMs deve cair.
for workers in 1 8; do
	echo "mandelbrot-dynamic, 1,000,000 pixels, $workers worker(s):"
	docker compose run --rm rust-test target/release/scaling-by-cores mandelbrot-dynamic 1000000 "$workers"
	docker compose run --rm go-test ./scaling mandelbrot-dynamic 1000000 "$workers"
	docker compose run --rm cpp-test ./scaling mandelbrot-dynamic 1000000 "$workers"
done
