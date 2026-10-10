// Package fold turns the samples of a Go CPU profile into "folded stacks", the plain text
// format flame graphs are drawn from: one line per distinct call stack, the frames from the
// root to the leaf joined by ";", then a space and how many samples had exactly that stack.
//
//	net/http.(*conn).serve;main.handleReportBefore;flame-graph/report.compileRegex 412
//
// PT: O pacote fold transforma as amostras de um perfil de CPU do Go em "pilhas dobradas", o
// formato de texto a partir do qual os flame graphs são desenhados: uma linha por pilha de
// chamadas distinta, os quadros da raiz até a folha unidos por ";", depois um espaço e quantas
// amostras tinham exatamente aquela pilha.
// ES: El paquete fold convierte las muestras de un perfil de CPU de Go en "pilas plegadas", el
// formato de texto a partir del cual se dibujan los flame graphs: una línea por pila de
// llamadas distinta, los cuadros de la raíz a la hoja unidos por ";", luego un espacio y
// cuántas muestras tenían exactamente esa pila.
package fold

import (
	"bufio"
	"fmt"
	"io"
	"sort"
	"strconv"
	"strings"
)

// ParseTraces reads the text printed by `go tool pprof -traces -sample_index=samples` and
// returns the number of samples per folded stack.
//
// EN: The tool prints one block per sample group, separated by dashed lines. The first line
// of a block has the sample count and the leaf function (the one that was on the CPU); the
// following lines are its callers, up to the root. A flame graph wants the opposite order, so
// each block is reversed. Frames the compiler inlined are marked "(inline)" and still appear
// as frames, which is what keeps a small function such as compileRegex visible.
//
// PT: A ferramenta imprime um bloco por grupo de amostras, separados por linhas tracejadas. A
// primeira linha de um bloco tem a contagem de amostras e a função folha (a que estava na
// CPU); as linhas seguintes são quem a chamou, até a raiz. Um flame graph quer a ordem
// inversa, então cada bloco é invertido. Quadros que o compilador embutiu (inline) vêm
// marcados com "(inline)" e continuam aparecendo como quadros, e é isso que mantém visível uma
// função pequena como compileRegex.
// ES: La herramienta imprime un bloque por grupo de muestras, separados por líneas de guiones. La
// primera línea de un bloque tiene el conteo de muestras y la función hoja (la que estaba en la
// CPU); las líneas siguientes son quien la llamó, hasta la raíz. Un flame graph quiere el orden
// inverso, así que cada bloque se invierte. Los cuadros que el compilador incrustó (inline) vienen
// marcados con "(inline)" y siguen apareciendo como cuadros, y eso es lo que mantiene visible una
// función pequeña como compileRegex.
func ParseTraces(r io.Reader) (map[string]int64, error) {
	stacks := map[string]int64{}
	var frames []string
	var count int64
	inBlock := false

	flush := func() {
		if len(frames) == 0 {
			return
		}
		for i, j := 0, len(frames)-1; i < j; i, j = i+1, j-1 {
			frames[i], frames[j] = frames[j], frames[i]
		}
		stacks[strings.Join(frames, ";")] += count
		frames = nil
	}

	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "-----") {
			flush()
			inBlock = true
			continue
		}
		// EN: Everything before the first dashed line is the header (file, type, duration).
		// PT: Tudo antes da primeira linha tracejada é o cabeçalho (arquivo, tipo, duração).
		// ES: Todo lo anterior a la primera línea de guiones es el encabezado (archivo, tipo, duración).
		if !inBlock || strings.TrimSpace(line) == "" {
			continue
		}
		text := strings.TrimSpace(line)
		if len(frames) == 0 {
			value, name, found := strings.Cut(text, " ")
			if !found {
				return nil, fmt.Errorf("fold: expected \"<count> <function>\", got %q", line)
			}
			parsed, err := strconv.ParseInt(value, 10, 64)
			if err != nil {
				return nil, fmt.Errorf("fold: sample count in %q: %w", line, err)
			}
			count = parsed
			text = strings.TrimSpace(name)
		}
		frames = append(frames, cleanFrame(text))
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("fold: reading traces: %w", err)
	}
	flush()
	return stacks, nil
}

// cleanFrame removes the inline marker and the one character that would break the format.
func cleanFrame(name string) string {
	name = strings.TrimSuffix(name, " (inline)")
	return strings.ReplaceAll(name, ";", ":")
}

// Format writes the stacks as folded lines, sorted, so the same profile always gives the same
// file and a diff between two files is meaningful.
//
// PT: Format escreve as pilhas como linhas dobradas, ordenadas, para que o mesmo perfil gere
// sempre o mesmo arquivo e um diff entre dois arquivos faça sentido.
// ES: Format escribe las pilas como líneas plegadas, ordenadas, para que el mismo perfil genere
// siempre el mismo archivo y un diff entre dos archivos tenga sentido.
func Format(stacks map[string]int64) string {
	keys := make([]string, 0, len(stacks))
	for key := range stacks {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	var out strings.Builder
	for _, key := range keys {
		fmt.Fprintf(&out, "%s %d\n", key, stacks[key])
	}
	return out.String()
}
