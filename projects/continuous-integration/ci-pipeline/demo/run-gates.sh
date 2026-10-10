#!/usr/bin/env sh
# EN: Demonstrates the quality gates of .github/workflows/ci.yml, one at a time. For each gate it
#     makes a clean copy of the files the gate needs, runs the gate command (it must pass),
#     applies the prepared change of demo/<gate>/change/ and runs the same command again (it must
#     fail, with the message a contributor would see). It runs inside a container: the
#     repository is mounted read-only at /src and the copy lives in /work, so nothing is ever
#     written to the repository.
#     usage: run-gates.sh <gate> [<gate> ...]
# PT: Demonstra os portões de qualidade do .github/workflows/ci.yml, um por vez. Para cada portão
#     faz uma cópia limpa dos arquivos que o portão precisa, roda o comando do portão (precisa
#     passar), aplica a mudança preparada em demo/<gate>/change/ e roda o mesmo comando de novo
#     (precisa falhar, com a mensagem que um contribuidor veria). Roda dentro de um contêiner: o
#     repositório é montado somente leitura em /src e a cópia fica em /work, então nada é escrito
#     no repositório.
#     uso: run-gates.sh <gate> [<gate> ...]
# ES: Demuestra las puertas de calidad de .github/workflows/ci.yml, una por vez. Para cada puerta
#     hace una copia limpia de los archivos que la puerta necesita, ejecuta el comando de la
#     puerta (debe pasar), aplica el cambio preparado en demo/<gate>/change/ y ejecuta el mismo
#     comando otra vez (debe fallar, con el mensaje que vería un contribuidor). Corre dentro de un
#     contenedor: el repositorio se monta de solo lectura en /src y la copia vive en /work, así
#     que nunca se escribe nada en el repositorio.
#     uso: run-gates.sh <gate> [<gate> ...]
set -eu

SRC="${CI_DEMO_SRC:-/src}"
WORK="${CI_DEMO_WORK:-/work}"
PROJECT="projects/continuous-integration/ci-pipeline"
FIXTURE="$PROJECT/fixture"
DEMO="$SRC/$PROJECT/demo"
WORKFLOW="$SRC/.github/workflows/ci.yml"
LOG="/tmp/ci-demo-output.log"
SUMMARY="/tmp/ci-demo-summary.txt"
PROBLEMS="/tmp/ci-demo-problems.txt"

ALL_GATES="biome markdownlint typecheck unit-tests quiz-validate docs-index format-python format-go format-rust format-cpp format-elixir quiz-e2e dashboards mini-project"
# EN: The steps of the `typescript` job, in the order the workflow runs them. A job stops at its
#     first failing step, so a change meant for step 3 must not break steps 1 and 2.
# PT: Os passos do job `typescript`, na ordem em que o workflow os executa. Um job para no
#     primeiro passo que falha, então uma mudança feita para o passo 3 não pode quebrar o 1 e o 2.
# ES: Los pasos del job `typescript`, en el orden en que el workflow los ejecuta. Un job se
#     detiene en el primer paso que falla, así que un cambio pensado para el paso 3 no puede
#     romper el 1 ni el 2.
TS_STEPS="Format and lint (Biome)|Markdown lint (markdownlint)|Type check|Unit tests|Quiz content validation|Documentation index is up to date"
# EN: Named steps that are not gates of their own, or that are demonstrated through another name.
# PT: Passos com nome que não são um portão próprio, ou que são demonstrados com outro nome.
# ES: Pasos con nombre que no son una puerta propia, o que se demuestran con otro nombre.
OTHER_STEPS='Build the pinned ${{ matrix.lang }} image|Format check|Unit and end-to-end tests|Static dashboards open from disk|Run the setup script of ${{ matrix.project }}'
JOBS="typescript formatters quiz list-projects mini-projects"

export NO_COLOR=1 FORCE_COLOR=0 CI=true
mkdir -p "$WORK"
: > "$SUMMARY"
failures=0

# EN: The commands are read from the workflow file itself, so the demo cannot drift away from
#     what CI really runs. If a step is renamed, the command comes back empty and the gate fails
#     with a clear message instead of silently testing something else.
# PT: Os comandos são lidos do próprio arquivo do workflow, então a demo não se afasta do que o
#     CI realmente roda. Se um passo for renomeado, o comando volta vazio e o portão falha com uma
#     mensagem clara em vez de testar outra coisa em silêncio.
# ES: Los comandos se leen del propio archivo del workflow, así que la demo no se aleja de lo que
#     CI realmente ejecuta. Si se renombra un paso, el comando vuelve vacío y la puerta falla con
#     un mensaje claro en vez de probar otra cosa en silencio.
step_command() {
	sed -n "/^ *- name: $1\$/{n;s/^ *run: //p;}" "$WORKFLOW"
}

format_command() {
	sed -n "/^ *- lang: $1\$/{n;s/^ *check: //p;}" "$WORKFLOW"
}

mini_project_command() {
	sed -n '/^  mini-projects:$/,$p' "$WORKFLOW" | sed -n '/^ *run: |$/,$p' | sed '1d;s/^ *//'
}

# EN: Copies paths from the repository into the clean copy. Build output and dependencies are
#     left out, and so is every file named `ci-demo*`: that is the name of every prepared change,
#     so on a demonstration branch this lesson still starts from a clean state.
# PT: Copia caminhos do repositório para a cópia limpa. Saída de build e dependências ficam de
#     fora, assim como todo arquivo chamado `ci-demo*`: esse é o nome de toda mudança preparada,
#     então em um branch de demonstração esta lição ainda parte de um estado limpo.
# ES: Copia rutas del repositorio a la copia limpia. La salida de build y las dependencias quedan
#     fuera, igual que todo archivo llamado `ci-demo*`: ese es el nombre de todo cambio preparado,
#     así que en una rama de demostración esta lección sigue partiendo de un estado limpio.
copy() {
	(cd "$SRC" && tar -cf - \
		--exclude=node_modules --exclude=.next --exclude=out --exclude=target --exclude=_build \
		--exclude=test-results --exclude='*.tsbuildinfo' --exclude='ci-demo*' "$@") |
		(cd "$WORK" && tar -xf -)
}

prepared=""
prepare() {
	case " $prepared " in *" $1 "*) return 0 ;; esac
	prepared="$prepared $1"
	echo "--- preparing the clean copy ($1)"
	case "$1" in
	project)
		copy "$PROJECT" .github
		;;
	typescript)
		prepare project
		copy --exclude=quiz/content package.json bun.lock biome.json .markdownlint-cli2.jsonc .gitignore .editorconfig quiz tools benchmarks
		# EN: Reduced fixture. The copy gets the small content of the quiz tests (one area) in
		#     place of the real questions. The commands and the validator are the real ones, the
		#     data is smaller, and a question someone else is editing right now cannot turn this
		#     lesson red.
		# PT: Fixture reduzido. A cópia recebe o conteúdo pequeno dos testes do quiz (uma área)
		#     no lugar das questões reais. Os comandos e o validador são os reais, os dados são
		#     menores, e uma questão que outra pessoa está editando agora não deixa esta lição
		#     vermelha.
		# ES: Fixture reducido. La copia recibe el contenido pequeño de las pruebas del quiz (un
		#     área) en lugar de las preguntas reales. Los comandos y el validador son los reales,
		#     los datos son más pequeños, y una pregunta que otra persona está editando ahora no
		#     puede poner esta lección en rojo.
		cp -R "$WORK/quiz/tests/fixtures/content" "$WORK/quiz/content"
		mkdir -p "$WORK/docs/en" "$WORK/docs/pt" "$WORK/docs/es"
		(cd "$WORK" && bun install --frozen-lockfile 2>&1 | tail -n 2)
		# EN: The index is regenerated in the copy, so the docs gate starts from a known good
		#     state even when the working tree is in the middle of a change.
		# PT: O índice é regenerado na cópia, então o portão de docs parte de um estado bom
		#     conhecido mesmo quando a árvore de trabalho está no meio de uma mudança.
		# ES: El índice se regenera en la copia, así que la puerta de docs parte de un estado
		#     bueno conocido aunque el árbol de trabajo esté en medio de un cambio.
		(cd "$WORK" && bun run docs:index >/dev/null)
		;;
	formatters)
		prepare project
		copy ruff.toml rustfmt.toml .clang-format .formatter.exs .editorconfig
		mkdir -p "$WORK/benchmarks"
		;;
	e2e)
		# EN: The image built from quiz/e2e.Dockerfile already holds Playwright and its browser
		#     in /repo. The copy gets the real Playwright configuration of the quiz and the small
		#     test suite of the fixture.
		# PT: A imagem construída de quiz/e2e.Dockerfile já traz o Playwright e o navegador em
		#     /repo. A cópia recebe a configuração real do Playwright do quiz e a pequena suíte
		#     de testes do fixture.
		# ES: La imagen construida desde quiz/e2e.Dockerfile ya trae Playwright y su navegador en
		#     /repo. La copia recibe la configuración real de Playwright del quiz y la pequeña
		#     suite de pruebas del fixture.
		mkdir -p "$WORK/quiz"
		cp "$SRC/quiz/playwright.config.ts" "$WORK/quiz/"
		cp -R "$SRC/$FIXTURE/quiz/tests" "$WORK/quiz/tests"
		ln -s /repo/node_modules "$WORK/node_modules"
		if [ -d /repo/quiz/node_modules ]; then ln -s /repo/quiz/node_modules "$WORK/quiz/node_modules"; fi
		;;
	dashboards)
		prepare project
		cp "$SRC/tools/scaffold/tests/open-from-disk.mjs" /repo/quiz/open-from-disk.mjs
		;;
	esac
}

# EN: A prepared change is a folder that mirrors the repository root. Its files end in
#     `.fixture`, so that the linters and formatters of the real pipeline do not see them where
#     they are stored. Applying a change copies each file to its place without the suffix.
# PT: Uma mudança preparada é uma pasta que espelha a raiz do repositório. Seus arquivos terminam
#     em `.fixture`, para que os linters e formatadores do pipeline real não os vejam onde estão
#     guardados. Aplicar uma mudança copia cada arquivo para o seu lugar sem o sufixo.
# ES: Un cambio preparado es una carpeta que refleja la raíz del repositorio. Sus archivos
#     terminan en `.fixture`, para que los linters y formateadores del pipeline real no los vean
#     donde están guardados. Aplicar un cambio copia cada archivo a su lugar sin el sufijo.
change_files() {
	(cd "$DEMO/$1/change" && find . -type f -name '*.fixture' | sed 's#^\./##')
}

apply_change() {
	for file in $(change_files "$1"); do
		target="$WORK/${file%.fixture}"
		mkdir -p "$(dirname "$target")"
		if [ -f "$target" ]; then cp "$target" "$target.ci-demo-backup"; fi
		cp "$DEMO/$1/change/$file" "$target"
	done
}

revert_change() {
	for file in $(change_files "$1"); do
		target="$WORK/${file%.fixture}"
		if [ -f "$target.ci-demo-backup" ]; then mv "$target.ci-demo-backup" "$target"; else rm -f "$target"; fi
	done
}

run() {
	(cd "$1" && sh -c "$2") >"$LOG" 2>&1
}

# EN: Colour codes are removed so the output reads the same in a terminal and in a file.
# PT: Os códigos de cor são removidos para a saída ser lida igual em um terminal e em um arquivo.
# ES: Los códigos de color se quitan para que la salida se lea igual en una terminal y en un archivo.
show() {
	sed "s/$(printf '\033')\[[0-9;]*m//g" "$LOG" | tail -n "${CI_DEMO_LINES:-25}" | sed 's/^/    | /'
}

record() {
	printf '%-6s %-16s %s\n' "$1" "$2" "$3" >>"$SUMMARY"
	if [ "$1" != "ok" ]; then failures=$((failures + 1)); fi
}

# usage: check_gate <gate> <directory> <command> <expected text> [<earlier steps>]
check_gate() {
	gate="$1" dir="$2" cmd="$3" expect="$4" earlier="${5:-}"
	printf '\n=== %s ===\n$ %s\n' "$gate" "$cmd"
	if [ -z "$cmd" ]; then
		echo "  no command found in the workflow: was the step renamed?"
		record "FAIL" "$gate" "the step was not found in ci.yml"
		return 0
	fi
	if ! run "$dir" "$cmd"; then
		echo "  clean copy: FAILED, and it should pass"
		show
		record "FAIL" "$gate" "fails on the clean copy"
		return 0
	fi
	echo "  clean copy: passed"
	apply_change "$gate"
	echo "  change applied: $(change_files "$gate" | sed 's/\.fixture$//' | tr '\n' ' ')"
	result="ok"
	note="passes clean, fails with the change"
	old_ifs="$IFS"
	IFS='|'
	for step in $earlier; do
		IFS="$old_ifs"
		if ! run "$WORK" "$(step_command "$step")"; then
			echo "  the change also breaks the earlier step \"$step\":"
			show
			result="FAIL"
			note="the change breaks an earlier step of the job"
		fi
		IFS='|'
	done
	IFS="$old_ifs"
	if run "$dir" "$cmd"; then
		echo "  with the change: PASSED, and it should fail"
		result="FAIL"
		note="still passes with the change"
	else
		echo "  with the change: failed (exit code $?), which is what a contributor would see:"
		show
		if [ -n "$expect" ] && ! grep -qF -- "$expect" "$LOG"; then
			echo "  the output does not contain the expected text: $expect"
			result="FAIL"
			note="fails without the expected message"
		fi
	fi
	revert_change "$gate"
	record "$result" "$gate" "$note"
}

typescript_gate() {
	prepare typescript
	earlier="${TS_STEPS%%"$2"*}"
	check_gate "$1" "$WORK" "$(step_command "$2")" "$3" "${earlier%|}"
}

format_gate() {
	prepare formatters
	check_gate "format-$1" "$WORK" "$(format_command "$1")" "$2"
}

# EN: Every change that belongs to another job is applied at once, and the six steps of the
#     `typescript` job must still pass. That is what makes each demonstration branch fail one
#     gate and not two.
# PT: Toda mudança que pertence a outro job é aplicada de uma vez, e os seis passos do job
#     `typescript` ainda precisam passar. É isso que faz cada branch de demonstração falhar em um
#     portão e não em dois.
# ES: Todos los cambios que pertenecen a otro job se aplican a la vez, y los seis pasos del job
#     `typescript` deben seguir pasando. Eso es lo que hace que cada rama de demostración falle en
#     una puerta y no en dos.
check_isolation() {
	prepare typescript
	printf '\n=== isolation ===\n'
	others="format-python format-go format-rust format-cpp format-elixir quiz-e2e dashboards mini-project"
	for gate in $others; do apply_change "$gate"; done
	result="ok"
	old_ifs="$IFS"
	IFS='|'
	for step in $TS_STEPS; do
		IFS="$old_ifs"
		if run "$WORK" "$(step_command "$step")"; then
			echo "  \"$step\" still passes with the changes of the other jobs"
		else
			echo "  \"$step\" fails with the changes of the other jobs:"
			show
			result="FAIL"
		fi
		IFS='|'
	done
	IFS="$old_ifs"
	for gate in $others; do revert_change "$gate"; done
	record "$result" "isolation" "changes of other jobs leave the typescript job green"
}

# EN: The lesson must follow the workflow. This check fails when a job, a named step or a
#     formatter language exists in ci.yml and has no demonstration here, and when a README does
#     not mention a job or a demonstration branch.
# PT: A lição precisa acompanhar o workflow. Esta checagem falha quando um job, um passo com nome
#     ou uma linguagem de formatador existe no ci.yml e não tem demonstração aqui, e quando um
#     README não menciona um job ou um branch de demonstração.
# ES: La lección debe seguir al workflow. Esta comprobación falla cuando un job, un paso con
#     nombre o un lenguaje de formateador existe en ci.yml y no tiene demostración aquí, y cuando
#     un README no menciona un job o una rama de demostración.
check_sync() {
	printf '\n=== workflow-sync ===\n'
	: >"$PROBLEMS"
	found="$(sed -n '/^jobs:$/,$p' "$WORKFLOW" | sed -n 's/^  \([a-z-]*\):$/\1/p' | tr '\n' ' ')"
	if [ "$found" != "$JOBS " ]; then
		echo "the jobs of ci.yml are \"$found\", the lesson explains \"$JOBS\"" >>"$PROBLEMS"
	fi
	sed -n 's/^ *- name: //p' "$WORKFLOW" | while IFS= read -r step; do
		case "|$TS_STEPS|$OTHER_STEPS|" in
		*"|$step|"*) ;;
		*) echo "the step \"$step\" of ci.yml has no demonstration" >>"$PROBLEMS" ;;
		esac
	done
	for lang in $(sed -n 's/^ *- lang: //p' "$WORKFLOW"); do
		if [ ! -d "$DEMO/format-$lang/change" ]; then
			echo "the formatter \"$lang\" of ci.yml has no demonstration" >>"$PROBLEMS"
		fi
	done
	for gate in $ALL_GATES; do
		if [ -z "$(change_files "$gate" 2>/dev/null)" ]; then
			echo "the gate \"$gate\" has no prepared change in demo/$gate/change/" >>"$PROBLEMS"
		fi
		for readme in README.md README.pt-BR.md README.es.md; do
			if ! grep -qF "demo/ci-fails-$gate" "$SRC/$PROJECT/$readme"; then
				echo "$readme does not list the branch demo/ci-fails-$gate" >>"$PROBLEMS"
			fi
		done
	done
	for dir in "$DEMO"/*/; do
		gate="$(basename "$dir")"
		case " $ALL_GATES " in
		*" $gate "*) ;;
		*) echo "demo/$gate/ is not a gate known to run-gates.sh" >>"$PROBLEMS" ;;
		esac
	done
	for job in $JOBS; do
		for readme in README.md README.pt-BR.md README.es.md; do
			if ! grep -qF "\`$job\`" "$SRC/$PROJECT/$readme"; then
				echo "$readme does not explain the job $job" >>"$PROBLEMS"
			fi
		done
	done
	if [ -s "$PROBLEMS" ]; then
		sed 's/^/  /' "$PROBLEMS"
		record "FAIL" "workflow-sync" "the lesson and ci.yml disagree"
	else
		echo "  every job, named step and formatter of ci.yml has a demonstration and is in the READMEs"
		record "ok" "workflow-sync" "the lesson matches ci.yml"
	fi
}

if [ $# -eq 0 ]; then
	echo "usage: run-gates.sh <gate> [<gate> ...]" >&2
	echo "gates: workflow-sync $ALL_GATES isolation" >&2
	exit 2
fi

for name in "$@"; do
	case "$name" in
	workflow-sync) check_sync ;;
	isolation) check_isolation ;;
	biome) typescript_gate biome "Format and lint (Biome)" "ci-demo-unformatted.ts" ;;
	markdownlint) typescript_gate markdownlint "Markdown lint (markdownlint)" "MD040" ;;
	typecheck) typescript_gate typecheck "Type check" "TS2322" ;;
	unit-tests) typescript_gate unit-tests "Unit tests" "1 fail" ;;
	quiz-validate) typescript_gate quiz-validate "Quiz content validation" "ci-demo-invalid.json" ;;
	docs-index) typescript_gate docs-index "Documentation index is up to date" "is out of date" ;;
	format-python) format_gate python "would be reformatted" ;;
	# EN: The Go check prints nothing when it fails: `test -z` only sets the exit code.
	# PT: A checagem de Go não imprime nada quando falha: `test -z` só define o código de saída.
	# ES: La comprobación de Go no imprime nada cuando falla: `test -z` solo fija el código de salida.
	format-go) format_gate go "" ;;
	format-rust) format_gate rust "Diff in" ;;
	format-cpp) format_gate cpp "clang-format-violations" ;;
	format-elixir) format_gate elixir "not formatted" ;;
	# EN: Reduced fixture. The real gate builds the quiz and runs its whole Playwright suite
	#     through docker-compose. Here the same Playwright image and the same configuration run a
	#     small suite against a static page served by the `site` container.
	# PT: Fixture reduzido. O portão real constrói o quiz e roda toda a suíte Playwright pelo
	#     docker-compose. Aqui a mesma imagem do Playwright e a mesma configuração rodam uma suíte
	#     pequena contra uma página estática servida pelo contêiner `site`.
	# ES: Fixture reducido. La puerta real construye el quiz y ejecuta toda su suite de Playwright
	#     con docker-compose. Aquí la misma imagen de Playwright y la misma configuración ejecutan
	#     una suite pequeña contra una página estática servida por el contenedor `site`.
	quiz-e2e)
		prepare e2e
		check_gate quiz-e2e "$WORK/quiz" "bun x playwright test" "1 failed"
		;;
	# EN: Reduced fixture. The real step opens every committed dashboard. Here the same script
	#     opens the sample page of the fixture, plus whatever the change adds under projects/.
	# PT: Fixture reduzido. O passo real abre todo dashboard versionado. Aqui o mesmo script abre
	#     a página de exemplo do fixture, mais o que a mudança adicionar em projects/.
	# ES: Fixture reducido. El paso real abre todos los dashboards versionados. Aquí el mismo
	#     script abre la página de ejemplo del fixture, más lo que el cambio agregue en projects/.
	dashboards)
		prepare dashboards
		pages="\$(ls -d $WORK/projects/*/*/dashboard/index.html $WORK/$FIXTURE/projects/*/*/dashboard/index.html 2>/dev/null)"
		check_gate dashboards /repo/quiz "node open-from-disk.mjs $pages" "network request"
		;;
	# EN: Reduced fixture. The real job runs the setup script of every mini-project, and those
	#     scripts start Docker. Here the same three lines of the workflow run the setup script of
	#     a sample mini-project that needs only a shell.
	# PT: Fixture reduzido. O job real roda o script de setup de todo mini-projeto, e esses
	#     scripts sobem Docker. Aqui as mesmas três linhas do workflow rodam o script de setup de
	#     um mini-projeto de exemplo que só precisa de um shell.
	# ES: Fixture reducido. El job real ejecuta el script de setup de cada mini-proyecto, y esos
	#     scripts levantan Docker. Aquí las mismas tres líneas del workflow ejecutan el script de
	#     setup de un mini-proyecto de ejemplo que solo necesita un shell.
	mini-project)
		prepare project
		export PROJECT_UNDER_TEST="projects/sample-area/sample-project"
		check_gate mini-project "$WORK/$FIXTURE" "PROJECT=\"$PROJECT_UNDER_TEST\"; $(mini_project_command)" "FAIL"
		;;
	*)
		echo "unknown gate: $name" >&2
		echo "gates: workflow-sync $ALL_GATES isolation" >&2
		exit 2
		;;
	esac
done

printf '\n--- summary\n'
cat "$SUMMARY"
if [ "$failures" -gt 0 ]; then
	echo "$failures check(s) failed"
	exit 1
fi
