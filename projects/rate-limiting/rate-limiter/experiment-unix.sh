#!/usr/bin/env sh
# EN: Runs the burst experiment and rewrites results/ (burst.json, burst.md and the two SVG
#     charts). The container has no network and nothing is sent anywhere: it is a simulation.
# PT: Roda o experimento de rajada e regrava results/ (burst.json, burst.md e os dois gráficos
#     SVG). O contêiner não tem rede e nada é enviado a lugar nenhum: é uma simulação.
set -eu

cd "$(dirname "$0")"

# EN: The container writes into this folder, so it runs as the current user.
# PT: O contêiner grava nesta pasta, então roda como o usuário atual.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

trap 'docker compose down -v --remove-orphans' EXIT

docker compose build ts-test
docker compose run --rm experiment
