#!/usr/bin/env sh
# EN: Builds and tests the tdd-kata mini-project. The only requirement is Docker.
#     Step 1 runs the type check and the tests of the finished kata. Step 2 checks the rhythm of
#     the real git history (red, green, refactor), when the history is available: it needs git
#     and a full clone. In a shallow clone, such as the one a CI job makes, step 2 is skipped
#     and the rhythm is still checked by a test, on the committed snapshot ts/HISTORY.txt.
# PT: Constrói e testa o mini-projeto tdd-kata. O único requisito é o Docker.
#     O passo 1 roda a checagem de tipos e os testes do kata pronto. O passo 2 confere o ritmo do
#     histórico real do git (red, green, refactor), quando o histórico está disponível: precisa
#     de git e de um clone completo. Em um clone raso, como o que um job de CI faz, o passo 2 é
#     pulado e o ritmo ainda é conferido por um teste, no retrato versionado ts/HISTORY.txt.
# ES: Construye y prueba el mini-proyecto tdd-kata. El único requisito es Docker.
#     El paso 1 ejecuta la verificación de tipos y las pruebas del kata terminado. El paso 2 comprueba
#     el ritmo del historial real de git (red, green, refactor), cuando el historial está disponible:
#     necesita git y un clon completo. En un clon superficial, como el que hace un job de CI, el
#     paso 2 se omite y el ritmo aún se comprueba con una prueba, sobre la instantánea versionada
#     ts/HISTORY.txt.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test

if command -v git >/dev/null 2>&1 && [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "false" ]; then
	git log --reverse --format="%h %s" -- . | docker compose run --rm -T history
else
	echo "tdd-kata: no full git history here, so only the snapshot ts/HISTORY.txt was checked"
fi

echo "tdd-kata: all tests passed"
