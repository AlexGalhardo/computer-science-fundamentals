#!/usr/bin/env sh
# EN: Builds and tests the mini-xunit mini-project. The only requirement is Docker.
#     For each language it runs the framework on its own tests, and then the demo with a test
#     that fails on purpose. The demo MUST exit with a non-zero code: a red run that exits with
#     0 would be the worst bug a test framework can have.
# PT: Constrói e testa o mini-projeto mini-xunit. O único requisito é o Docker.
#     Para cada linguagem ele roda o framework nos próprios testes, e depois a demo com um teste
#     que falha de propósito. A demo PRECISA sair com um código diferente de zero: uma execução
#     vermelha que sai com 0 seria o pior bug que um framework de testes pode ter.
# ES: Construye y prueba el mini-proyecto mini-xunit. El único requisito es Docker.
#     Para cada lenguaje ejecuta el framework sobre sus propias pruebas, y luego la demo con una prueba
#     que falla a propósito. La demo DEBE salir con un código distinto de cero: una ejecución
#     roja que sale con 0 sería el peor bug que puede tener un framework de pruebas.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

expect_red() {
	if docker compose run --rm "$1"; then
		echo "mini-xunit: $1 exited with 0, but its failing test must make it exit non-zero" >&2
		exit 1
	fi
	echo "mini-xunit: $1 exited non-zero, as expected"
}

docker compose build
docker compose run --rm python-test
docker compose run --rm ts-test
expect_red python-demo
expect_red ts-demo

echo "mini-xunit: all tests passed"
