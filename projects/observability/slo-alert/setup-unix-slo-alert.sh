#!/usr/bin/env sh
# EN: Builds and tests the slo-alert mini-project. The only requirement is Docker.
#     Order: unit tests (no network), the Prometheus rule tester, the proof that k6 refuses a
#     target that is not local, and then the end-to-end incident, which takes about three
#     minutes: k6 overloads the local shop, the alert fires and resolves. Containers and
#     volumes are removed at the end, even when a test fails.
# PT: Constrói e testa o mini-projeto slo-alert. O único requisito é o Docker.
#     Ordem: testes unitários (sem rede), o testador de regras do Prometheus, a prova de que o
#     k6 recusa um alvo que não é local, e depois o incidente de ponta a ponta, que leva cerca
#     de três minutos: o k6 sobrecarrega a loja local, o alerta dispara e se resolve.
#     Contêineres e volumes são removidos no fim, mesmo quando um teste falha.
# ES: Construye y prueba el miniproyecto slo-alert. El único requisito es Docker.
#     Orden: pruebas unitarias (sin red), el probador de reglas de Prometheus, la prueba de que
#     k6 rechaza un objetivo que no es local, y luego el incidente de extremo a extremo, que dura
#     unos tres minutos: k6 sobrecarga la tienda local, la alerta se dispara y se resuelve.
#     Los contenedores y los volúmenes se eliminan al final, incluso cuando una prueba falla.
set -eu

cd "$(dirname "$0")"

# EN: Containers that write into this folder run as the current user (see docker-compose.yml).
# PT: Os contêineres que gravam nesta pasta rodam como o usuário atual (veja docker-compose.yml).
# ES: Los contenedores que escriben en esta carpeta se ejecutan como el usuario actual (ve docker-compose.yml).
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build
docker compose run --rm ts-test
docker compose run --rm rules-test
docker compose run --rm load-refusal-test
docker compose run --rm e2e-test

echo "slo-alert: all tests passed"
