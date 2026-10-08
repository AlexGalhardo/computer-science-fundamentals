#!/usr/bin/env bash
# EN: Reproduces the whole language benchmark suite: builds every image, checks that the
#     implementations agree, runs the eight workloads, regenerates the results and the
#     dashboard data, and tests the dashboard. Requirements: Docker and Bun. It takes about
#     an hour, and the numbers only mean something on an otherwise idle machine.
#     Usage: ./setup-unix-benchmarks.sh            everything
#            ./setup-unix-benchmarks.sh --quick    skip the measurements, only build and test
# PT: Reproduz a suíte inteira de benchmark das linguagens: constrói todas as imagens, confere
#     que as implementações concordam, roda as oito cargas, regenera os resultados e os dados
#     do dashboard, e testa o dashboard. Requisitos: Docker e Bun. Leva cerca de uma hora, e os
#     números só significam algo em uma máquina sem outras cargas.
#     Uso: ./setup-unix-benchmarks.sh            tudo
#          ./setup-unix-benchmarks.sh --quick    pula as medições, só constrói e testa
set -euo pipefail

cd "$(dirname "$0")"

for tool in docker bun; do
	if ! command -v "$tool" >/dev/null 2>&1; then
		echo "$tool is required. Docker: https://docs.docker.com/get-docker/  Bun: https://bun.sh" >&2
		exit 1
	fi
done

# EN: Repository convention: a container that writes into a mounted folder runs as the host
#     user. Every container here mounts the repository read-only, so these are only exported
#     for consistency with the other setup scripts.
# PT: Convenção do repositório: um contêiner que escreve em uma pasta montada roda como o
#     usuário do host. Todo contêiner aqui monta o repositório como somente leitura, então
#     estas variáveis são exportadas só por consistência com os outros scripts de setup.
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
export HOST_UID HOST_GID

# EN: Whatever happens, leave no container, network or volume of the two compose stacks behind.
# PT: Aconteça o que acontecer, não deixa contêiner, rede ou volume das duas pilhas compose para trás.
cleanup() {
	(cd http && docker compose --profile tools down -v --remove-orphans >/dev/null 2>&1) || true
	(cd database && docker compose --profile clients down -v --remove-orphans >/dev/null 2>&1) || true
}
trap cleanup EXIT

(cd .. && bun install --frozen-lockfile)

echo "== images and agreement tests"
bun run images
bun run test
bun run test:http
bun run test:database

if [ "${1:-}" != "--quick" ]; then
	echo "== measurements"
	bun run all cpu-single parallelism sections concurrency memory http build-time binary-size database
fi

echo "== dashboard"
bun run data
bun run build:css
bun run test:dashboard

echo "benchmarks: done. Open dashboard/index.html in a browser."
