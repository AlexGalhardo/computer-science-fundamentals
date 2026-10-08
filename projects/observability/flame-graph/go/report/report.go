// Package report summarises log lines: how many per level and per service. It exists in two
// variants that return exactly the same result. The "before" variant hides a hot path, and
// nothing in its code looks slow at a glance: that is why a profiler is needed to find it.
//
// PT: O pacote report resume linhas de log: quantas por nível e por serviço. Ele existe em duas
// variantes que devolvem exatamente o mesmo resultado. A variante "before" esconde um caminho
// quente, e nada no código parece lento à primeira vista: por isso é preciso um profiler para
// encontrá-lo.
package report

import (
	"fmt"
	"regexp"
)

// Summary is the answer of the report endpoint.
type Summary struct {
	Lines     int            `json:"lines"`
	Unparsed  int            `json:"unparsed"`
	ByLevel   map[string]int `json:"byLevel"`
	ByService map[string]int `json:"byService"`
}

// linePattern captures the level and the service of a line such as
// "2026-10-07T12:00:03Z WARN billing: retrying charge".
const linePattern = `^\d{4}-\d{2}-\d{2}T\S+ (ERROR|WARN|INFO) ([a-z]+): `

// SampleLines returns n synthetic log lines. They are generated from a fixed formula, with no
// randomness, so every run and both variants see the same input.
//
// PT: SampleLines devolve n linhas de log sintéticas. Elas saem de uma fórmula fixa, sem
// aleatoriedade, então toda execução e as duas variantes veem a mesma entrada.
func SampleLines(n int) []string {
	levels := []string{"INFO", "INFO", "INFO", "WARN", "INFO", "ERROR", "INFO"}
	services := []string{"checkout", "billing", "inventory", "search", "auth"}
	lines := make([]string, 0, n)
	for i := range n {
		if i%50 == 49 {
			lines = append(lines, "panic: this line does not follow the format")
			continue
		}
		lines = append(lines, fmt.Sprintf("2026-10-07T12:%02d:%02dZ %s %s: request %d handled in %d ms",
			(i/60)%60, i%60, levels[i%len(levels)], services[i%len(services)], i, 5+(i*37)%400))
	}
	return lines
}

// summarize is shared by the two variants: only the function that parses one line changes.
func summarize(lines []string, parse func(string) (level, service string, ok bool)) Summary {
	summary := Summary{Lines: len(lines), ByLevel: map[string]int{}, ByService: map[string]int{}}
	for _, line := range lines {
		level, service, ok := parse(line)
		if !ok {
			summary.Unparsed++
			continue
		}
		summary.ByLevel[level]++
		summary.ByService[service]++
	}
	return summary
}

// ----------------------------------------------------------------------------- before

// SummarizeBefore is the variant with the hidden hot path.
func SummarizeBefore(lines []string) Summary {
	return summarize(lines, parseLineBefore)
}

func parseLineBefore(line string) (level, service string, ok bool) {
	match := compileRegex(linePattern).FindStringSubmatch(line)
	if match == nil {
		return "", "", false
	}
	return match[1], match[2], true
}

// compileRegex is the hot path. Compiling a regular expression means parsing the pattern and
// building a state machine: far more work than using it once. Called for every line of every
// request, it dominates the CPU profile, although the line that calls it reads like a lookup.
//
// PT: compileRegex é o caminho quente. Compilar uma expressão regular significa analisar o
// padrão e construir uma máquina de estados: muito mais trabalho do que usá-la uma vez. Chamada
// para cada linha de cada requisição, ela domina o perfil de CPU, embora a linha que a chama
// pareça uma simples consulta.
func compileRegex(pattern string) *regexp.Regexp {
	return regexp.MustCompile(pattern)
}

// ----------------------------------------------------------------------------- after

// lineRegex is compiled once, when the program starts. A compiled *regexp.Regexp is safe for
// concurrent use, so every request can share it.
//
// PT: lineRegex é compilada uma vez, quando o programa inicia. Uma *regexp.Regexp compilada é
// segura para uso concorrente, então todas as requisições podem compartilhá-la.
var lineRegex = regexp.MustCompile(linePattern)

// SummarizeAfter is the fixed variant: same result, the expensive step hoisted out of the loop.
func SummarizeAfter(lines []string) Summary {
	return summarize(lines, parseLineAfter)
}

func parseLineAfter(line string) (level, service string, ok bool) {
	match := lineRegex.FindStringSubmatch(line)
	if match == nil {
		return "", "", false
	}
	return match[1], match[2], true
}
