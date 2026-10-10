// Command demo classifies the documented graphs and states.
//
// EN: `demo` prints the report as text. `demo -markdown` prints it as the Markdown file that is
// committed in results/results.md.
//
// PT: `demo` imprime o relatório em texto. `demo -markdown` o imprime como o arquivo Markdown
// que é versionado em results/results.md.
//
// ES: `demo` imprime el informe como texto. `demo -markdown` lo imprime como el archivo Markdown
// que está versionado en results/results.md.
package main

import (
	"flag"
	"fmt"
	"strings"

	deadlock "deadlock-mini-shell"
)

func names(list []string) string {
	if len(list) == 0 {
		return "none"
	}
	return strings.Join(list, ", ")
}

func processes(indexes []int) string {
	if len(indexes) == 0 {
		return "none"
	}
	labels := make([]string, len(indexes))
	for i, index := range indexes {
		labels[i] = fmt.Sprintf("P%d", index)
	}
	return strings.Join(labels, ", ")
}

func graphLine(name string, graph *deadlock.Graph) string {
	deadlocked := graph.Deadlocked()
	verdict := "no deadlock"
	if len(deadlocked) > 0 {
		verdict = "DEADLOCK"
	}
	return fmt.Sprintf("%-22s %-12s deadlocked: %-10s blocked behind the cycle: %s",
		name, verdict, names(deadlocked), names(graph.Blocked()))
}

func stateLine(name string, state deadlock.State) string {
	order, safe := state.SafeSequence()
	if !safe {
		return fmt.Sprintf("%-22s UNSAFE", name)
	}
	return fmt.Sprintf("%-22s safe         one safe sequence: %s", name, processes(order))
}

func requestLine(what string, decision deadlock.Decision) string {
	return fmt.Sprintf("  %-36s %s", what, decision)
}

func report() []string {
	lines := []string{"Resource allocation graphs (one instance per resource)"}
	lines = append(lines,
		graphLine("textbook, 7 processes", deadlock.TextbookGraph()),
		graphLine("quiz, 5 processes", deadlock.QuizGraph()),
		graphLine("chain, 3 processes", deadlock.ChainGraph()),
		"",
		"Deadlock detection (several instances per resource)",
	)
	for _, variant := range []bool{false, true} {
		available, allocation, request := deadlock.DetectionExample(variant)
		name := "original requests"
		if variant {
			name = "with an extra request"
		}
		lines = append(lines, fmt.Sprintf("%-22s deadlocked: %s", name,
			processes(deadlock.Detect(available, allocation, request))))
	}

	lines = append(lines, "", "Banker's algorithm")
	single := deadlock.SingleResourceState()
	lines = append(lines, stateLine("single resource", single))
	_, decision := single.Request(0, []int{1})
	lines = append(lines, requestLine("P0 asks for 1 unit", decision))
	_, decision = single.Request(1, []int{1})
	lines = append(lines, requestLine("P1 asks for 1 unit", decision))

	four := deadlock.FourResourceState()
	lines = append(lines, stateLine("four resources", four))
	afterB, decision := four.Request(1, []int{0, 0, 1, 0})
	lines = append(lines, requestLine("P1 asks for (0,0,1,0)", decision))
	_, decision = afterB.Request(4, []int{0, 0, 1, 0})
	lines = append(lines, requestLine("then P4 asks for (0,0,1,0)", decision))

	three := deadlock.ThreeResourceState()
	lines = append(lines, stateLine("three resources", three))
	afterP1, decision := three.Request(1, []int{1, 0, 2})
	lines = append(lines, requestLine("P1 asks for (1,0,2)", decision))
	_, decision = afterP1.Request(4, []int{3, 3, 0})
	lines = append(lines, requestLine("then P4 asks for (3,3,0)", decision))
	_, decision = afterP1.Request(0, []int{0, 2, 0})
	lines = append(lines, requestLine("then P0 asks for (0,2,0)", decision))

	lines = append(lines, stateLine("quiz", deadlock.QuizState()))
	return lines
}

func main() {
	markdown := flag.Bool("markdown", false, "print the report as a Markdown document")
	flag.Parse()
	text := strings.Join(report(), "\n")
	if !*markdown {
		fmt.Println(text)
		return
	}
	fmt.Println("# deadlock-mini-shell: results")
	fmt.Println()
	fmt.Println("Command: `docker compose run --rm demo`")
	fmt.Println()
	fmt.Println("The classification of every documented graph and state. The program is " +
		"deterministic, so the output is the same on any machine. Each case is worked out by " +
		"hand in `docs/en/operating-systems/deadlock-mini-shell.md`.")
	fmt.Println()
	fmt.Println("```")
	fmt.Println(text)
	fmt.Println("```")
}
