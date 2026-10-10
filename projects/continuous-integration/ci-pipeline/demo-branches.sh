#!/usr/bin/env sh
# EN: Creates the demonstration branches of this lesson: one branch per quality gate, each with
#     the prepared change of demo/<gate>/change/ on top of `main`, so that the CI run of that
#     branch fails exactly that gate.
#       ./demo-branches.sh [<gate> ...]          dry run (the default): nothing leaves the machine
#       ./demo-branches.sh --push [<gate> ...]   pushes demo/ci-fails-<gate> and starts CI on it
#     Safety rules of this script:
#       1. It works in a temporary clone. The working tree it is launched from is only read.
#       2. It refuses to run when `origin` is not the repository of this project.
#       3. Without --push it never talks to the network.
#       4. With --push it first checks that the local `main` is the `main` already on GitHub.
#     A push to a demo/ branch does not start the workflow (it listens to pushes to `main`, pull
#     requests and manual runs), so the script starts a manual run with the GitHub CLI (`gh`)
#     and prints its URL.
# PT: Cria os branches de demonstração desta lição: um branch por portão de qualidade, cada um
#     com a mudança preparada de demo/<gate>/change/ em cima da `main`, para que a execução do CI
#     naquele branch falhe exatamente naquele portão.
#       ./demo-branches.sh [<gate> ...]          simulação (o padrão): nada sai da máquina
#       ./demo-branches.sh --push [<gate> ...]   envia demo/ci-fails-<gate> e dispara o CI nele
#     Regras de segurança deste script:
#       1. Ele trabalha em um clone temporário. A árvore de trabalho de onde é chamado é só lida.
#       2. Ele se recusa a rodar quando `origin` não é o repositório deste projeto.
#       3. Sem --push ele nunca usa a rede.
#       4. Com --push ele antes confere se a `main` local é a `main` que já está no GitHub.
#     Um push para um branch demo/ não dispara o workflow (ele escuta pushes na `main`, pull
#     requests e execuções manuais), então o script dispara uma execução manual com a CLI do
#     GitHub (`gh`) e imprime a URL dela.
# ES: Crea las ramas de demostración de esta lección: una rama por puerta de calidad, cada una
#     con el cambio preparado de demo/<gate>/change/ encima de `main`, para que la ejecución de CI
#     en esa rama falle exactamente en esa puerta.
#       ./demo-branches.sh [<gate> ...]          simulación (por defecto): nada sale de la máquina
#       ./demo-branches.sh --push [<gate> ...]   envía demo/ci-fails-<gate> y lanza CI en ella
#     Reglas de seguridad de este script:
#       1. Trabaja en un clon temporal. El árbol de trabajo desde donde se lanza solo se lee.
#       2. Se niega a correr cuando `origin` no es el repositorio de este proyecto.
#       3. Sin --push nunca usa la red.
#       4. Con --push primero comprueba que la `main` local sea la `main` que ya está en GitHub.
#     Un push a una rama demo/ no lanza el workflow (escucha pushes a `main`, pull requests y
#     ejecuciones manuales), así que el script lanza una ejecución manual con la CLI de GitHub
#     (`gh`) e imprime su URL.
set -eu

REPOSITORY="AlexGalhardo/computer-science-fundamentals"
GATES="biome markdownlint typecheck unit-tests quiz-validate docs-index format-python format-go format-rust format-cpp format-elixir quiz-e2e dashboards mini-project"

usage() {
	echo "usage: $0 [--push] [<gate> ...]"
	echo "gates: $GATES"
}

fail() {
	echo "demo-branches: $1" >&2
	exit 1
}

push=0
selected=""
for arg in "$@"; do
	case "$arg" in
	--push) push=1 ;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		case " $GATES " in
		*" $arg "*) selected="$selected $arg" ;;
		*)
			usage >&2
			fail "unknown gate or option: $arg"
			;;
		esac
		;;
	esac
done
if [ -z "$selected" ]; then selected="$GATES"; fi

command -v git >/dev/null 2>&1 || fail "git is required"
here="$(cd "$(dirname "$0")" && pwd)"
root="$(git -C "$here" rev-parse --show-toplevel)"

# EN: Rule 2. The address of `origin` must end in the name of this repository, whether it is
#     written as HTTPS or as SSH. A fork or any other remote stops the script here.
# PT: Regra 2. O endereço do `origin` precisa terminar no nome deste repositório, escrito como
#     HTTPS ou como SSH. Um fork ou qualquer outro remoto para o script aqui.
# ES: Regla 2. La dirección de `origin` debe terminar en el nombre de este repositorio, escrita
#     como HTTPS o como SSH. Un fork o cualquier otro remoto detiene el script aquí.
origin="$(git -C "$root" remote get-url origin 2>/dev/null)" || fail "this repository has no remote called origin"
case "$origin" in
*github.com[:/]"$REPOSITORY" | *github.com[:/]"$REPOSITORY".git) ;;
*) fail "origin is $origin, not github.com/$REPOSITORY: refusing to run" ;;
esac

base="$(git -C "$root" rev-parse --verify --quiet refs/heads/main)" || fail "there is no local branch called main"

if [ "$push" -eq 1 ]; then
	command -v gh >/dev/null 2>&1 || fail "the GitHub CLI (gh) is required with --push: https://cli.github.com/"
	# EN: Rule 4. A demonstration branch must differ from the published `main` by one change only.
	# PT: Regra 4. Um branch de demonstração precisa diferir da `main` publicada por uma mudança só.
	# ES: Regla 4. Una rama de demostración debe diferir de la `main` publicada por un solo cambio.
	remote_main="$(git ls-remote "$origin" refs/heads/main | cut -f1)"
	if [ "$remote_main" != "$base" ]; then
		fail "local main ($base) is not the main on GitHub ($remote_main): push or pull main first"
	fi
fi

# EN: Rule 1. Everything from here on happens in a clone inside a temporary folder, removed at
#     the end. Cloning reads the repository and writes nothing into it.
# PT: Regra 1. Tudo daqui em diante acontece em um clone dentro de uma pasta temporária, removida
#     no fim. Clonar lê o repositório e não escreve nada nele.
# ES: Regla 1. Todo de aquí en adelante ocurre en un clon dentro de una carpeta temporal,
#     eliminada al final. Clonar lee el repositorio y no escribe nada en él.
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
clone="$temp/repository"
git clone --quiet --no-checkout "$root" "$clone"
git -C "$clone" remote set-url origin "$origin"
for key in user.name user.email; do
	value="$(git -C "$root" config "$key" || true)"
	if [ -n "$value" ]; then git -C "$clone" config "$key" "$value"; fi
done

table=""
for gate in $selected; do
	branch="demo/ci-fails-$gate"
	change="$here/demo/$gate/change"
	[ -d "$change" ] || fail "there is no prepared change in demo/$gate/change"
	git -C "$clone" checkout --quiet --force -B "$branch" "$base"
	# EN: The stored files end in `.fixture` so the real linters do not see them. Here each one is
	#     copied to its real place, without the suffix.
	# PT: Os arquivos guardados terminam em `.fixture` para os linters reais não os enxergarem.
	#     Aqui cada um é copiado para o seu lugar de verdade, sem o sufixo.
	# ES: Los archivos guardados terminan en `.fixture` para que los linters reales no los vean.
	#     Aquí cada uno se copia a su lugar real, sin el sufijo.
	for file in $(cd "$change" && find . -type f -name '*.fixture' | sed 's#^\./##'); do
		target="${file%.fixture}"
		mkdir -p "$clone/$(dirname "$target")"
		cp "$change/$file" "$clone/$target"
		git -C "$clone" add -- "$target"
	done
	git -C "$clone" commit --quiet -m "test(ci): fail the $gate gate on purpose" \
		-m "Demonstration branch of projects/continuous-integration/ci-pipeline. Never merge it."
	sha="$(git -C "$clone" rev-parse HEAD)"
	echo
	echo "=== $branch"
	git -C "$clone" show --stat --format='%h %s' HEAD

	if [ "$push" -eq 0 ]; then
		echo "dry run: would push $branch to $origin and start the CI workflow on it"
		continue
	fi

	git -C "$clone" push --quiet --force origin "$branch"
	gh workflow run CI --repo "$REPOSITORY" --ref "$branch"
	# EN: GitHub takes a few seconds to create the run, so the script asks until it appears.
	# PT: O GitHub leva alguns segundos para criar a execução, então o script pergunta até ela aparecer.
	# ES: GitHub tarda unos segundos en crear la ejecución, así que el script pregunta hasta que aparece.
	url=""
	tries=0
	while [ -z "$url" ] && [ "$tries" -lt 30 ]; do
		sleep 2
		tries=$((tries + 1))
		url="$(gh run list --repo "$REPOSITORY" --workflow CI --branch "$branch" --event workflow_dispatch \
			--limit 5 --json url,headSha --jq ".[] | select(.headSha == \"$sha\") | .url" | head -n 1)"
	done
	if [ -z "$url" ]; then url="(run not found yet: gh run list --repo $REPOSITORY --branch $branch)"; fi
	echo "run: $url"
	table="$table| \`$gate\` | \`$branch\` | $url |
"
done

if [ "$push" -eq 1 ]; then
	echo
	echo "Rows for the \"failed run\" column of the READMEs:"
	printf '%s' "$table"
else
	echo
	echo "dry run finished: nothing was pushed. Run again with --push to publish the branches."
fi
