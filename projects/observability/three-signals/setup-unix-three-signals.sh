#!/usr/bin/env sh
# EN: Builds and tests the three-signals mini-project. The only requirement is Docker.
#     Unit tests run first, with no network. Then the whole stack starts (three services, the
#     collector, Tempo, Prometheus, Loki and Grafana) and the end-to-end test queries each back
#     end. Containers and volumes are removed at the end, even when a test fails.
#     To explore by hand instead: `docker compose up -d`, then open http://127.0.0.1:3000.
# PT: Constrói e testa o mini-projeto three-signals. O único requisito é o Docker.
#     Os testes unitários rodam primeiro, sem rede. Depois a pilha inteira sobe (três serviços,
#     o collector, Tempo, Prometheus, Loki e Grafana) e o teste de ponta a ponta consulta cada
#     back end. Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
#     Para explorar à mão: `docker compose up -d`, e abra http://127.0.0.1:3000.
# ES: Construye y prueba el miniproyecto three-signals. El único requisito es Docker.
#     Las pruebas unitarias corren primero, sin red. Después se levanta la pila entera (tres servicios,
#     el collector, Tempo, Prometheus, Loki y Grafana) y la prueba de extremo a extremo consulta cada
#     back end. Los contenedores y los volúmenes se eliminan al final, incluso cuando una prueba falla.
#     Para explorar a mano: `docker compose up -d`, y abre http://127.0.0.1:3000.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ve docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
# EN: Port 0 lets Docker pick a free host port for Grafana, so a test run never collides with
#     something already listening on 3000.
# PT: A porta 0 deixa o Docker escolher uma porta livre do host para o Grafana, então uma
#     rodada de testes nunca colide com algo que já escuta na 3000.
# ES: El puerto 0 deja que Docker elija un puerto libre del host para Grafana, así que una
#     ronda de pruebas nunca choca con algo que ya escucha en el 3000.
GRAFANA_PORT="${GRAFANA_PORT:-0}"
export HOST_UID HOST_GID GRAFANA_PORT

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose --profile screenshot down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test
docker compose run --rm go-test
docker compose run --rm e2e-test

echo "three-signals: all tests passed"
