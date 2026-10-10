#!/usr/bin/env sh
# EN: Runs the formatter and the linter of every language of this mini-project, each inside the
#     base image of docs/en/environment.md. `./lint.sh` only checks, `./lint.sh --fix` rewrites
#     the files. Needs only Docker, plus the base images built once (see the README).
#     TypeScript is checked by Biome from the repository root: `bunx biome check <this folder>`.
# PT: Roda o formatador e o linter de cada linguagem deste mini-projeto, cada um dentro da imagem
#     base de docs/pt/environment.md. `./lint.sh` só confere, `./lint.sh --fix` reescreve os
#     arquivos. Precisa só do Docker e das imagens base construídas uma vez (veja o README).
#     O TypeScript é conferido pelo Biome a partir da raiz: `bunx biome check <esta pasta>`.
# ES: Ejecuta el formateador y el linter de cada lenguaje de este mini-proyecto, cada uno dentro de
#     la imagen base de docs/es/environment.md. `./lint.sh` solo comprueba, `./lint.sh --fix`
#     reescribe los archivos. Solo necesita Docker y las imágenes base construidas una vez (mira el README).
#     TypeScript lo comprueba Biome desde la raíz: `bunx biome check <esta carpeta>`.
set -eu

cd "$(dirname "$0")"
project="$(pwd -W 2>/dev/null || pwd)"
root="$(cd ../../.. && (pwd -W 2>/dev/null || pwd))"
relative="projects/algorithms/$(basename "$project")"
fix="${1:-}"

# EN: Git Bash on Windows rewrites arguments that look like Unix paths. This turns it off.
# PT: O Git Bash no Windows reescreve argumentos que parecem caminhos Unix. Isto desliga isso.
# ES: Git Bash en Windows reescribe los argumentos que parecen rutas Unix. Esto lo desactiva.
export MSYS_NO_PATHCONV=1

# EN: run <network> <image> <folder> <command>. Every step runs with no network, except
#     Spotless, a Gradle plugin that is downloaded on first use.
# PT: run <rede> <imagem> <pasta> <comando>. Toda etapa roda sem rede, exceto o Spotless, um
#     plugin do Gradle que é baixado no primeiro uso.
# ES: run <red> <imagen> <carpeta> <comando>. Cada paso corre sin red, excepto Spotless, un
#     plugin de Gradle que se descarga en el primer uso.
run() {
	network="$1"
	image="$2"
	dir="$3"
	shift 3
	if [ ! -d "$dir" ]; then
		return 0
	fi
	docker run --rm --network "$network" -v "$root:/repo" -w "/repo/$relative/$dir" "$image" sh -c "$*"
}

gradle="gradle --no-daemon -q --project-cache-dir /tmp/gradle"

if [ "$fix" = "--fix" ]; then
	run none sef-cpp:local cpp "clang-format -i *.cpp *.hpp"
	run none sef-python:local python "ruff check --fix . && ruff format ."
	run none sef-elixir:local elixir "mix format"
	run none sef-rust:local rust "cargo fmt"
	run none sef-go:local go "gofmt -w ."
	run bridge sef-java:local java "$gradle spotlessApply"
	echo "formatted"
	exit 0
fi

run none sef-cpp:local cpp "clang-format --dry-run -Werror *.cpp *.hpp"
run none sef-python:local python "ruff check . && ruff format --check ."
run none sef-elixir:local elixir "mix format --check-formatted"
run none sef-rust:local rust "cargo fmt --check && cargo clippy --offline --all-targets -- -D warnings"
run none sef-go:local go "test -z \"\$(gofmt -l .)\" && go vet ./... && golangci-lint run ./..."
run none sef-java:local java "javac -Xlint:all -Werror -d /tmp/out *.java"
run bridge sef-java:local java "$gradle spotlessCheck"
echo "lint: all checks passed"
