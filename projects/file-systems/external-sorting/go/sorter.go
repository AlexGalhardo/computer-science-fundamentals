package main

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime/debug"
	"slices"
	"time"
)

type config struct {
	// runBytes is the number of bytes of lines sorted in memory at a time: the size of one run.
	runBytes int
	// fanIn is how many runs one merge reads at the same time.
	fanIn int
}

type stats struct {
	lines       uint64
	initialRuns int
	mergePasses int
	runMs       float64
	mergeMs     float64
}

// EN: Phase 1, run generation. One buffer of `runBytes` is the only large piece of memory: it
// is filled from the file, the lines inside it are sorted, and they are written as one sorted
// run. The lines are not copied to be sorted: an index of (start, length) pairs is sorted
// instead, at a cost of 8 bytes per line. A line cut by the end of the buffer is carried to the
// start of the next one. The input is read once, from start to end.
//
// PT: Fase 1, geração de runs. Um buffer de `runBytes` é o único pedaço grande de memória: ele
// é preenchido a partir do arquivo, as linhas dentro dele são ordenadas e gravadas como uma run
// ordenada. As linhas não são copiadas para ordenar: ordena-se um índice de pares (início,
// tamanho), ao custo de 8 bytes por linha. Uma linha cortada pelo fim do buffer é levada para o
// começo do próximo. A entrada é lida uma única vez, do início ao fim.
func generateRuns(input, tmp string, runBytes int) (runs []string, lines uint64, err error) {
	if runBytes < 64 || runBytes > 1<<31 {
		return nil, 0, errors.New("run size must be between 64 bytes and 2 GiB")
	}
	file, err := os.Open(input)
	if err != nil {
		return nil, 0, err
	}
	defer func() { err = errors.Join(err, file.Close()) }()
	buffer := make([]byte, runBytes)
	var index []uint64
	lineOf := func(entry uint64) []byte {
		start, length := int(entry>>32), int(entry&0xFFFFFFFF)
		return buffer[start : start+length]
	}
	filled := 0
	endOfFile := false
	for !endOfFile {
		for filled < len(buffer) {
			read, readErr := file.Read(buffer[filled:])
			filled += read
			if errors.Is(readErr, io.EOF) {
				endOfFile = true
				break
			}
			if readErr != nil {
				return nil, 0, readErr
			}
		}
		if filled == 0 {
			break
		}
		end := filled
		if !endOfFile {
			end = bytes.LastIndexByte(buffer[:filled], '\n') + 1
			if end == 0 {
				return nil, 0, errors.New("a line is longer than the run size")
			}
		}
		index = index[:0]
		for start := 0; start < end; {
			length := bytes.IndexByte(buffer[start:end], '\n')
			if length < 0 {
				length = end - start
			}
			index = append(index, uint64(start)<<32|uint64(length))
			start += length + 1
		}
		slices.SortFunc(index, func(a, b uint64) int { return bytes.Compare(lineOf(a), lineOf(b)) })

		path := filepath.Join(tmp, fmt.Sprintf("run-%d.txt", len(runs)))
		if err := writeRun(path, index, lineOf); err != nil {
			return nil, 0, err
		}
		runs = append(runs, path)
		lines += uint64(len(index))
		copy(buffer, buffer[end:filled])
		filled -= end
	}
	return runs, lines, nil
}

func writeRun(path string, index []uint64, lineOf func(uint64) []byte) error {
	writer, err := createLineWriter(path, 1<<16)
	if err != nil {
		return err
	}
	for _, entry := range index {
		if err := writer.writeLine(lineOf(entry)); err != nil {
			return errors.Join(err, writer.finish())
		}
	}
	return writer.finish()
}

// EN: A binary min-heap of run numbers. The heap does not hold the lines, only which run each
// candidate comes from, and it compares the current line of those runs. The smallest current
// line is always at position 0. When two lines are equal the lower run number wins, which
// keeps the merge stable: equal lines leave in the order of the runs.
//
// PT: Um heap binário de mínimo com números de runs. O heap não guarda as linhas, só de qual
// run vem cada candidato, e compara a linha atual dessas runs. A menor linha atual está sempre
// na posição 0. Quando duas linhas são iguais, ganha a run de menor número, o que mantém a
// intercalação estável: linhas iguais saem na ordem das runs.
type runHeap struct {
	items []int
}

func newRunHeap(runs []int, lines [][]byte) *runHeap {
	heap := &runHeap{items: runs}
	for at := len(runs)/2 - 1; at >= 0; at-- {
		heap.siftDown(at, lines)
	}
	return heap
}

func (h *runHeap) peek() (int, bool) {
	if len(h.items) == 0 {
		return 0, false
	}
	return h.items[0], true
}

// EN: The line of the run at the top changed (the next line of that run was read), so it sinks
// until both children are larger. This costs about log2(k) comparisons, against the k - 1 of
// looking at every run.
//
// PT: A linha da run do topo mudou (a próxima linha dessa run foi lida), então ela desce até
// que os dois filhos sejam maiores. Isso custa cerca de log2(k) comparações, contra as k - 1 de
// olhar todas as runs.
func (h *runHeap) topChanged(lines [][]byte) {
	h.siftDown(0, lines)
}

// EN: The run at the top ended: the last item takes its place and sinks.
//
// PT: A run do topo acabou: o último item toma o lugar dela e desce.
func (h *runHeap) removeTop(lines [][]byte) {
	last := len(h.items) - 1
	h.items[0] = h.items[last]
	h.items = h.items[:last]
	h.siftDown(0, lines)
}

func (h *runHeap) less(a, b int, lines [][]byte) bool {
	left, right := h.items[a], h.items[b]
	order := bytes.Compare(lines[left], lines[right])
	return order < 0 || (order == 0 && left < right)
}

func (h *runHeap) siftDown(at int, lines [][]byte) {
	for {
		smallest := at
		for _, child := range [2]int{2*at + 1, 2*at + 2} {
			if child < len(h.items) && h.less(child, smallest, lines) {
				smallest = child
			}
		}
		if smallest == at {
			return
		}
		h.items[at], h.items[smallest] = h.items[smallest], h.items[at]
		at = smallest
	}
}

// EN: Phase 2, the k-way merge. Each run is read sequentially through its own buffer, and only
// one line of each run is in memory. The heap says which run has the smallest line: that line
// is written, the next line of the same run is read, and the heap is repaired.
//
// PT: Fase 2, a intercalação de k caminhos. Cada run é lida em sequência pelo seu próprio
// buffer, e só uma linha de cada run fica na memória. O heap diz qual run tem a menor linha:
// essa linha é gravada, a próxima linha da mesma run é lida, e o heap é consertado.
func mergeRuns(inputs []string, output string, bufferBytes int) (written uint64, err error) {
	readers := make([]*bufio.Reader, len(inputs))
	lines := make([][]byte, len(inputs))
	var alive []int
	for run, path := range inputs {
		file, openErr := os.Open(path)
		if openErr != nil {
			return 0, openErr
		}
		defer func() { err = errors.Join(err, file.Close()) }()
		readers[run] = bufio.NewReaderSize(file, bufferBytes)
		line, more, readErr := readLine(readers[run], nil)
		if readErr != nil {
			return 0, readErr
		}
		lines[run] = line
		if more {
			alive = append(alive, run)
		}
	}
	writer, err := createLineWriter(output, bufferBytes)
	if err != nil {
		return 0, err
	}
	defer func() { err = errors.Join(err, writer.finish()) }()
	heap := newRunHeap(alive, lines)
	for {
		run, found := heap.peek()
		if !found {
			break
		}
		if err := writer.writeLine(lines[run]); err != nil {
			return 0, err
		}
		written++
		line, more, readErr := readLine(readers[run], lines[run])
		if readErr != nil {
			return 0, readErr
		}
		lines[run] = line
		if more {
			heap.topChanged(lines)
		} else {
			heap.removeTop(lines)
		}
	}
	return written, nil
}

// EN: The whole memory of the merge is its buffers: one per input run plus one for the output.
// With a fixed budget, a larger fan-in means smaller buffers, so each refill brings less data.
// On a magnetic disk every refill is also a seek.
//
// PT: Toda a memória da intercalação são os seus buffers: um por run de entrada mais um para a
// saída. Com um orçamento fixo, um fan-in maior significa buffers menores, então cada recarga
// traz menos dados. Em um disco magnético cada recarga é também um seek.
func mergeBufferBytes(cfg config) int {
	return max(cfg.runBytes/(cfg.fanIn+1), 4096)
}

func moveFile(from, to string) error {
	if os.Rename(from, to) == nil {
		return nil
	}
	data, err := os.ReadFile(from)
	if err != nil {
		return err
	}
	if err := os.WriteFile(to, data, 0o644); err != nil {
		return err
	}
	return os.Remove(from)
}

// EN: External merge sort. After run generation, each merge pass joins groups of up to `fanIn`
// runs into longer runs, until one is left. A pass reads and writes every line once, so the
// number of passes, ceil(log base fanIn of the number of runs), is what the configuration
// really changes. Merged runs are deleted as soon as they are consumed.
//
// PT: Ordenação externa por intercalação. Depois da geração de runs, cada passada junta grupos
// de até `fanIn` runs em runs maiores, até sobrar uma. Uma passada lê e grava cada linha uma
// vez, então o número de passadas, teto(log na base fanIn do número de runs), é o que a
// configuração realmente muda. As runs intercaladas são apagadas assim que consumidas.
func externalSort(input, output, tmp string, cfg config) (stats, error) {
	if cfg.fanIn < 2 {
		return stats{}, errors.New("fan-in must be at least 2")
	}
	if err := os.MkdirAll(tmp, 0o755); err != nil {
		return stats{}, err
	}
	started := time.Now()
	runs, lines, err := generateRuns(input, tmp, cfg.runBytes)
	if err != nil {
		return stats{}, err
	}
	result := stats{lines: lines, initialRuns: len(runs), runMs: milliseconds(started)}
	// EN: Go has a garbage collector: the run buffer is no longer referenced, and this call
	// collects it and gives its pages back to the system before the merge buffers are created.
	//
	// PT: Go tem coletor de lixo: o buffer das runs não é mais referenciado, e esta chamada o
	// coleta e devolve as suas páginas ao sistema antes de os buffers da intercalação serem criados.
	debug.FreeOSMemory()

	started = time.Now()
	bufferBytes := mergeBufferBytes(cfg)
	for len(runs) > 1 {
		result.mergePasses++
		lastPass := len(runs) <= cfg.fanIn
		var merged []string
		for group := range slices.Chunk(runs, cfg.fanIn) {
			if len(group) == 1 {
				merged = append(merged, group[0])
				continue
			}
			target := output
			if !lastPass {
				target = filepath.Join(tmp, fmt.Sprintf("pass-%d-%d.txt", result.mergePasses, len(merged)))
			}
			if _, err := mergeRuns(group, target, bufferBytes); err != nil {
				return stats{}, err
			}
			for _, path := range group {
				if err := os.Remove(path); err != nil {
					return stats{}, err
				}
			}
			merged = append(merged, target)
		}
		runs = merged
	}
	switch {
	case len(runs) == 0:
		if err := os.WriteFile(output, nil, 0o644); err != nil {
			return stats{}, err
		}
	case runs[0] != output:
		// A single run was generated: it is already the sorted file.
		if err := moveFile(runs[0], output); err != nil {
			return stats{}, err
		}
	}
	result.mergeMs = milliseconds(started)
	return result, nil
}

func milliseconds(since time.Time) float64 {
	return float64(time.Since(since).Microseconds()) / 1000
}

// EN: The wrong tool, kept for comparison: load the whole file and sort it in memory. It needs
// memory proportional to the file, and under the memory limit of the demo it is killed.
//
// PT: A ferramenta errada, mantida para comparação: carregar o arquivo inteiro e ordenar na
// memória. Ela precisa de memória proporcional ao arquivo e, sob o limite de memória da
// demonstração, é morta pelo sistema.
func inMemorySort(input, output string) (uint64, error) {
	data, err := os.ReadFile(input)
	if err != nil {
		return 0, err
	}
	lines := bytes.Split(data, []byte{'\n'})
	if len(lines) > 0 && len(lines[len(lines)-1]) == 0 {
		lines = lines[:len(lines)-1]
	}
	slices.SortFunc(lines, bytes.Compare)
	var sorted bytes.Buffer
	for _, line := range lines {
		sorted.Write(line)
		sorted.WriteByte('\n')
	}
	return uint64(len(lines)), os.WriteFile(output, sorted.Bytes(), 0o644)
}
