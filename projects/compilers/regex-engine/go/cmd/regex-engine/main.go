// Command regex-engine matches, exports and times the regular expression engine.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"regex-engine/regex"
)

const usage = `usage:
  regex-engine match <pattern> <input>          match with the three engines and count steps
  regex-engine dot nfa|dfa <pattern>            print the automaton in Graphviz DOT
  regex-engine bench nfa|dfa|backtracking <n>   time the pathological case on n letters`

// PathologicalPattern never matches PathologicalInput(n), and a backtracking matcher only finds
// that out after trying every way of splitting the letters between the two stars.
const PathologicalPattern = "(a*)*b"

// PathologicalInput is n letters a, with no b at the end.
func PathologicalInput(n int) string { return strings.Repeat("a", n) }

type engine func(input string) (matched bool, steps int)

func engines(compiled *regex.Regex) map[string]engine {
	return map[string]engine{
		"nfa": compiled.NFA.Match,
		"dfa": compiled.DFA.Match,
		"backtracking": func(input string) (bool, int) {
			return regex.BacktrackMatch(compiled.Tree, input)
		},
	}
}

func match(pattern, input string) error {
	compiled, err := regex.New(pattern)
	if err != nil {
		return err
	}
	fmt.Printf("pattern %q, input %q\n", pattern, input)
	fmt.Printf("tree: %s\n", compiled.Tree)
	fmt.Printf("NFA: %d states, DFA: %d states\n", len(compiled.NFA.States), len(compiled.DFA.Sets))
	all := engines(compiled)
	for _, name := range []string{"nfa", "dfa", "backtracking"} {
		matched, steps := all[name](input)
		fmt.Printf("%-13s match=%-5t steps=%d\n", name, matched, steps)
	}
	return nil
}

func dot(kind, pattern string) error {
	compiled, err := regex.New(pattern)
	if err != nil {
		return err
	}
	switch kind {
	case "nfa":
		fmt.Print(compiled.NFA.Dot())
	case "dfa":
		fmt.Print(compiled.DFA.Dot())
	default:
		return fmt.Errorf("unknown automaton %q, expected nfa or dfa", kind)
	}
	return nil
}

// peakMemoryKb reads the peak resident memory of this process, in KiB, from the `VmHWM` line
// ("high water mark") that Linux publishes in /proc/self/status.
func peakMemoryKb() int {
	status, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(status), "\n") {
		if fields := strings.Fields(line); len(fields) >= 2 && fields[0] == "VmHWM:" {
			kb, _ := strconv.Atoi(fields[1])
			return kb
		}
	}
	return 0
}

// EN: Benchmark entry point. Compiling the pattern stays outside the timed section: only the
// match is measured. The last line printed is the JSON object of the repository's benchmark
// contract; the checksum carries the answer and the number of steps, which is the machine-
// independent way of seeing linear against exponential growth.
// PT: Ponto de entrada do benchmark. A compilação do padrão fica fora do trecho cronometrado: só
// o casamento é medido. A última linha impressa é o objeto JSON do contrato de benchmark do
// repositório; o checksum carrega a resposta e o número de passos, que é a forma independente de
// máquina de ver o crescimento linear contra o exponencial.
func bench(name, size string) error {
	n, err := strconv.Atoi(size)
	if err != nil || n < 0 {
		return fmt.Errorf("<n> must be a non-negative integer, got %q", size)
	}
	compiled, err := regex.New(PathologicalPattern)
	if err != nil {
		return err
	}
	run, found := engines(compiled)[name]
	if !found {
		return fmt.Errorf("unknown engine %q, expected nfa, dfa or backtracking", name)
	}
	input := PathologicalInput(n)

	started := time.Now()
	matched, steps := run(input)
	elapsed := time.Since(started)

	return json.NewEncoder(os.Stdout).Encode(map[string]any{
		"n":              n,
		"elapsedMs":      float64(elapsed.Nanoseconds()) / 1e6,
		"memoryKb":       peakMemoryKb(),
		"language":       "go",
		"implementation": name,
		"checksum":       fmt.Sprintf("match=%t steps=%d", matched, steps),
	})
}

func main() {
	args := os.Args[1:]
	var err error
	switch {
	case len(args) == 3 && args[0] == "match":
		err = match(args[1], args[2])
	case len(args) == 3 && args[0] == "dot":
		err = dot(args[1], args[2])
	case len(args) == 3 && args[0] == "bench":
		err = bench(args[1], args[2])
	default:
		err = fmt.Errorf("%s", usage)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
