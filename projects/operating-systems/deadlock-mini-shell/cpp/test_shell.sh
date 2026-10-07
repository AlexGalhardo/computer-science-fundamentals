#!/usr/bin/env bash
# EN: Integration tests of msh. Each test writes a small script, runs it with msh and compares
#     what came out. The last test interrupts a running pipeline with SIGINT.
# PT: Testes de integração do msh. Cada teste escreve um pequeno script, executa-o com o msh e
#     compara o que saiu. O último teste interrompe um pipeline em execução com SIGINT.
set -u

MSH="${MSH:-./msh}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
failures=0
tests=0

check() {
	tests=$((tests + 1))
	if [ "$2" = "$3" ]; then
		echo "ok   $1"
	else
		failures=$((failures + 1))
		echo "FAIL $1"
		echo "     expected: $(printf '%s' "$2" | tr '\n' '|')"
		echo "     actual:   $(printf '%s' "$3" | tr '\n' '|')"
	fi
}

# Writes its arguments, one per line, to a script and runs it. A timeout turns a hang into a failure.
run() {
	printf '%s\n' "$@" > "$work/script.msh"
	timeout 20 "$MSH" "$work/script.msh"
}

# --- Pipelines of three commands ---------------------------------------------------------

out="$(run "printf 'banana\napple\ncherry\napple\n' | sort | uniq")"
check "pipeline of three commands: printf | sort | uniq" "$(printf 'apple\nbanana\ncherry')" "$out"

out="$(run "printf 'b\na\nb\nc\n' > $work/in.txt" \
	"sort < $work/in.txt | uniq | wc -l > $work/count.txt" \
	"echo extra >> $work/count.txt" \
	"cat $work/count.txt")"
check "pipeline of three commands with <, > and >>" "$(printf '3\nextra')" "$out"

# EN: head exits after three lines. seq must then die of SIGPIPE instead of blocking, which only
#     happens if the shell closed its own copies of the pipe ends.
# PT: O head termina depois de três linhas. O seq precisa então morrer de SIGPIPE em vez de
#     bloquear, o que só acontece se o shell fechou as suas cópias das pontas do pipe.
out="$(run "seq 1 100000 | head -n 3 | wc -l")"
check "a reader that exits early ends the pipeline" "3" "$out"

# --- Parsing, builtins and exit status ---------------------------------------------------

out="$(run "echo \"a  b\" 'c|d'")"
check "quotes keep spaces and operators" "a  b c|d" "$out"

out="$(run "cd /tmp" "pwd")"
check "cd is a builtin and changes the directory of the shell" "/tmp" "$out"

run "true" "false" > /dev/null
check "the status of the shell is the status of the last command" "1" "$?"

run "false" "exit 3" "echo not reached" > "$work/exit.out"
check "exit ends the shell with the given status" "3" "$?"
check "nothing runs after exit" "" "$(cat "$work/exit.out")"

run "no-such-command-xyz" 2> /dev/null
check "a command that does not exist gives status 127" "127" "$?"

err="$(run "sort |" 2>&1)"
check "a syntax error is reported and gives status 2" "2" "$?"
check "the syntax error message names the problem" "msh: syntax error: missing command" "$err"

run "cat < $work/does-not-exist" 2> /dev/null
check "a missing input file gives status 1" "1" "$?"

# --- Signals -----------------------------------------------------------------------------

# EN: With job control on (set -m) the background job gets its own process group, whose id is
#     the pid of msh. Sending SIGINT to the group is what a terminal does on Ctrl-C: the shell
#     and the three processes of the pipeline all receive it. The pipeline must die at once,
#     and the shell must survive and run the next line.
# PT: Com o controle de jobs ligado (set -m), o job em segundo plano ganha o seu próprio grupo
#     de processos, cujo id é o pid do msh. Enviar SIGINT ao grupo é o que um terminal faz no
#     Ctrl-C: o shell e os três processos do pipeline o recebem. O pipeline precisa morrer na
#     hora, e o shell precisa sobreviver e executar a linha seguinte.
printf '%s\n' "sleep 30 | cat | cat" "echo survived" > "$work/interrupt.msh"
set -m
"$MSH" "$work/interrupt.msh" > "$work/interrupt.out" 2> "$work/interrupt.err" &
pid=$!
set +m
sleep 1
started=$(date +%s)
kill -INT -- "-$pid"
wait "$pid"
status=$?
elapsed=$(($(date +%s) - started))

check "the shell survives the interrupt and runs the next command" "survived" "$(cat "$work/interrupt.out")"
check "the interrupted pipeline is reported" "msh: terminated by signal 2" "$(cat "$work/interrupt.err")"
check "the shell ends normally after the interrupt" "0" "$status"
if [ "$elapsed" -lt 10 ]; then quick=yes; else quick=no; fi
check "the 30-second pipeline stopped at once (${elapsed}s)" "yes" "$quick"

echo
if [ "$failures" -gt 0 ]; then
	echo "$failures of $tests shell checks failed"
	exit 1
fi
echo "$tests shell checks passed"
