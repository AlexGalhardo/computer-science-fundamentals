#!/usr/bin/env sh
# EN: Builds and tests the flaky-tests mini-project. The only requirement is Docker.
#     It runs the deterministic tests, then each flaky test 50 times (each must fail at least
#     once) and each fixed test 500 times (none may fail). Containers are removed at the end.
# PT: Constrói e testa o mini-projeto flaky-tests. O único requisito é o Docker.
#     Roda os testes determinísticos, depois cada teste intermitente 50 vezes (cada um precisa
#     falhar ao menos uma vez) e cada teste corrigido 500 vezes (nenhum pode falhar). Os
#     contêineres são removidos no fim.
# ES: Construye y prueba el mini-proyecto flaky-tests. El único requisito es Docker.
#     Ejecuta las pruebas deterministas, luego cada prueba intermitente 50 veces (cada una debe
#     fallar al menos una vez) y cada prueba corregida 500 veces (ninguna puede fallar). Los
#     contenedores se eliminan al final.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: The repeat containers write into ./results, so they run with the uid of whoever owns it.
# PT: Os contêineres de repetição escrevem em ./results, então rodam com o uid de quem é dono da pasta.
# ES: Los contenedores de repetición escriben en ./results, así que se ejecutan con el uid de quien es dueño de la carpeta.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID
mkdir -p results

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test
docker compose run --rm flaky
docker compose run --rm fixed

echo "flaky-tests: all tests passed"
