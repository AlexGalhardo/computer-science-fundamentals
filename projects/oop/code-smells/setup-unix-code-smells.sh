#!/usr/bin/env sh
# EN: Builds, tests and demonstrates the code-smells mini-project. The only requirement is
#     Docker.
# PT: Constrói, testa e demonstra o mini-projeto code-smells. O único requisito é o Docker.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The build already checks types (tsc), format (Spotless) and the negative compile test.
# PT: O build já confere os tipos (tsc), o formato (Spotless) e o teste negativo de compilação.
docker compose build
docker compose run --rm ts-test
docker compose run --rm java-test
echo "code-smells: all tests passed"

docker compose run --rm ts-demo
