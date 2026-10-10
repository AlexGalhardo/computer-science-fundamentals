#!/usr/bin/env sh
# EN: Builds and tests the ci-pipeline mini-project. The only requirement is Docker.
#     With no argument (or "test") it demonstrates every quality gate of
#     .github/workflows/ci.yml and checks, for each one, that it passes on a clean copy and
#     fails with the prepared change. With "demo <gate> [<gate> ...]" it shows only those gates.
#     The repository is mounted read-only, so no container writes into it and none needs to run
#     as the host user. Containers and networks are removed at the end.
# PT: Constrói e testa o mini-projeto ci-pipeline. O único requisito é o Docker.
#     Sem argumento (ou com "test") demonstra cada portão de qualidade do
#     .github/workflows/ci.yml e confere, para cada um, que ele passa em uma cópia limpa e falha
#     com a mudança preparada. Com "demo <gate> [<gate> ...]" mostra só esses portões.
#     O repositório é montado somente leitura, então nenhum contêiner escreve nele e nenhum
#     precisa rodar como o usuário do host. Contêineres e redes são removidos no fim.
# ES: Construye y prueba el mini-proyecto ci-pipeline. El único requisito es Docker.
#     Sin argumento (o con "test") demuestra cada puerta de calidad de
#     .github/workflows/ci.yml y comprueba, para cada una, que pasa en una copia limpia y falla
#     con el cambio preparado. Con "demo <gate> [<gate> ...]" muestra solo esas puertas.
#     El repositorio se monta de solo lectura, así que ningún contenedor escribe en él y ninguno
#     necesita correr como el usuario del host. Los contenedores y redes se eliminan al final.
set -eu

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
	echo "Docker is required: https://docs.docker.com/get-docker/" >&2
	exit 1
fi

# EN: Each gate runs in the image the workflow uses for it, so the gate name picks the service.
# PT: Cada portão roda na imagem que o workflow usa para ele, então o nome do portão escolhe o serviço.
# ES: Cada puerta corre en la imagen que el workflow usa para ella, así que el nombre de la puerta elige el servicio.
service_of() {
	case "$1" in
	format-*) echo "${1#format-}" ;;
	quiz-e2e) echo "e2e" ;;
	dashboards) echo "dashboards" ;;
	*) echo "ts" ;;
	esac
}

trap 'docker compose down -v --remove-orphans' EXIT

mode="${1:-test}"
case "$mode" in
demo)
	shift
	if [ $# -eq 0 ]; then
		echo "usage: $0 demo <gate> [<gate> ...]" >&2
		echo "gates: biome markdownlint typecheck unit-tests quiz-validate docs-index format-python format-go format-rust format-cpp format-elixir quiz-e2e dashboards mini-project" >&2
		exit 2
	fi
	for gate in "$@"; do
		service="$(service_of "$gate")"
		docker compose build "$service"
		docker compose run --rm "$service" "$gate"
	done
	;;
test)
	docker compose build
	for service in ts python go rust cpp elixir e2e dashboards; do
		docker compose run --rm "$service"
	done
	echo "ci-pipeline: all tests passed"
	;;
*)
	echo "usage: $0 [test | demo <gate> [<gate> ...]]" >&2
	exit 2
	;;
esac
