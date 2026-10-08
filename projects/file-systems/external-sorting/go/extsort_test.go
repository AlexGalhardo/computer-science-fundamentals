package main

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func sortedLines(t *testing.T, path string) [][]byte {
	t.Helper()
	lines := linesOf(t, path)
	slices.SortFunc(lines, bytes.Compare)
	return lines
}

func linesOf(t *testing.T, path string) [][]byte {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	lines := bytes.Split(data, []byte{'\n'})
	if len(lines) > 0 && len(lines[len(lines)-1]) == 0 {
		lines = lines[:len(lines)-1]
	}
	return lines
}

func mustGenerate(t *testing.T, path string, stop target, seed, distinct uint64) digest {
	t.Helper()
	result, err := generate(path, stop, seed, distinct)
	if err != nil {
		t.Fatal(err)
	}
	return result
}

func mustInspect(t *testing.T, path string) (digest, bool) {
	t.Helper()
	result, sorted, err := inspect(path)
	if err != nil {
		t.Fatal(err)
	}
	return result, sorted
}

// EN: The generator is the contract between the two languages: the same seed must give the
// same file. The expected checksum is the same one the Rust tests assert.
//
// PT: O gerador é o contrato entre as duas linguagens: a mesma semente precisa dar o mesmo
// arquivo. O checksum esperado é o mesmo que os testes em Rust verificam.
func TestGeneratorIsDeterministic(t *testing.T) {
	directory := t.TempDir()
	first := mustGenerate(t, filepath.Join(directory, "a.txt"), target{amount: 1000}, defaultSeed, 0)
	again := mustGenerate(t, filepath.Join(directory, "b.txt"), target{amount: 1000}, defaultSeed, 0)
	if first != again || first.lines != 1000 {
		t.Fatalf("two generations differ: %+v and %+v", first, again)
	}
	expected, err := os.ReadFile("../fixtures/checksum-1000.txt")
	if err != nil {
		t.Fatal(err)
	}
	if first.checksum() != strings.TrimSpace(string(expected)) {
		t.Errorf("checksum %s differs from the fixture shared with Rust", first.checksum())
	}
	info, err := os.Stat(filepath.Join(directory, "a.txt"))
	if err != nil || uint64(info.Size()) != first.bytes {
		t.Errorf("digest says %d bytes, file has another size (%v)", first.bytes, err)
	}
	inspected, sorted := mustInspect(t, filepath.Join(directory, "a.txt"))
	if inspected != first || sorted {
		t.Errorf("inspect gave %+v sorted=%v", inspected, sorted)
	}
	if fnv1a64(nil) != 0xCBF29CE484222325 || fnv1a64([]byte("a")) != 0xAF63DC4C8601EC8C {
		t.Error("FNV-1a does not match its reference values")
	}
	byBytes := mustGenerate(t, filepath.Join(directory, "c.txt"), target{byBytes: true, amount: 100_000}, defaultSeed, 0)
	if byBytes.bytes < 100_000 || byBytes.bytes >= 100_100 {
		t.Errorf("generation by bytes stopped at %d", byBytes.bytes)
	}
}

// EN: Acceptance of MP-FS-2.2: for many shapes of input, run sizes and fan-ins, the output of
// the external sort is exactly the list of input lines sorted in memory. Equality with that
// list means both "sorted" and "same multiset of lines".
//
// PT: Aceite de MP-FS-2.2: para vários formatos de entrada, tamanhos de run e fan-ins, a saída
// da ordenação externa é exatamente a lista de linhas da entrada ordenada na memória. Ser igual
// a essa lista significa "ordenada" e também "mesmo multiconjunto de linhas".
func TestOutputEqualsInMemorySort(t *testing.T) {
	directory := t.TempDir()
	input, output := filepath.Join(directory, "input.txt"), filepath.Join(directory, "output.txt")
	work := filepath.Join(directory, "work")
	// Few distinct keys force many repeated keys.
	cases := []struct{ lines, distinct uint64 }{{0, 0}, {1, 0}, {2, 0}, {500, 0}, {5000, 0}, {5000, 7}, {3000, 1}}
	for number, item := range cases {
		expectedDigest := mustGenerate(t, input, target{amount: item.lines}, defaultSeed+uint64(number), item.distinct)
		expected := sortedLines(t, input)
		for _, runBytes := range []int{128, 4096, 65_536, 1 << 20} {
			for _, fanIn := range []int{2, 3, 8, 64} {
				what := fmt.Sprintf("%d lines, %d keys, run %d, fan-in %d", item.lines, item.distinct, runBytes, fanIn)
				result, err := externalSort(input, output, work, config{runBytes: runBytes, fanIn: fanIn})
				if err != nil {
					t.Fatalf("%s: %v", what, err)
				}
				if !slices.EqualFunc(linesOf(t, output), expected, bytes.Equal) {
					t.Fatalf("%s: output differs from the in-memory sort", what)
				}
				outDigest, sorted := mustInspect(t, output)
				if !sorted || !outDigest.sameLines(expectedDigest) || result.lines != item.lines {
					t.Fatalf("%s: digest or order is wrong", what)
				}
				// Passes: each one divides the number of runs by the fan-in, rounding up.
				passes := 0
				for runs := result.initialRuns; runs > 1; runs = (runs + fanIn - 1) / fanIn {
					passes++
				}
				if result.mergePasses != passes {
					t.Fatalf("%s: %d merge passes, expected %d", what, result.mergePasses, passes)
				}
				if left, err := os.ReadDir(work); err != nil || len(left) != 0 {
					t.Fatalf("%s: %d run files were left behind (%v)", what, len(left), err)
				}
			}
		}
	}
}

func TestRunsAreSortedAndBoundedByTheRunSize(t *testing.T) {
	directory := t.TempDir()
	input := filepath.Join(directory, "input.txt")
	expected := mustGenerate(t, input, target{amount: 20_000}, defaultSeed, 0)
	const runBytes = 64 * 1024
	runs, lines, err := generateRuns(input, directory, runBytes)
	if err != nil || lines != 20_000 {
		t.Fatalf("generateRuns: %d lines, %v", lines, err)
	}
	// Every run but the last is almost full: at most one line (73 bytes) is carried over.
	atLeast := int((expected.bytes + runBytes - 1) / runBytes)
	if len(runs) < atLeast || len(runs) > atLeast+1 {
		t.Errorf("%d runs, expected %d or %d", len(runs), atLeast, atLeast+1)
	}
	var total digest
	for _, run := range runs {
		info, err := os.Stat(run)
		if err != nil || info.Size() > runBytes {
			t.Fatalf("run %s does not fit in the buffer (%v)", run, err)
		}
		runDigest, sorted := mustInspect(t, run)
		if !sorted {
			t.Fatalf("run %s is not sorted", run)
		}
		total.lines += runDigest.lines
		total.sum += runDigest.sum
		total.xor ^= runDigest.xor
	}
	if !total.sameLines(expected) {
		t.Error("the runs together do not hold the lines of the input")
	}
	merged := filepath.Join(directory, "merged.txt")
	if written, err := mergeRuns(runs, merged, 4096); err != nil || written != 20_000 {
		t.Fatalf("mergeRuns wrote %d lines, %v", written, err)
	}
	if mergedDigest, sorted := mustInspect(t, merged); !sorted || !mergedDigest.sameLines(expected) {
		t.Error("one k-way merge of all the runs is not the sorted input")
	}
	if mergeBufferBytes(config{runBytes: 1 << 20, fanIn: 15}) != 65_536 || mergeBufferBytes(config{runBytes: 8192, fanIn: 64}) != 4096 {
		t.Error("merge buffers do not split the run size among the fan-in plus the output")
	}
}

func TestInputWithoutFinalLineBreakAndLongLines(t *testing.T) {
	directory := t.TempDir()
	input, output := filepath.Join(directory, "input.txt"), filepath.Join(directory, "output.txt")
	work := filepath.Join(directory, "work")
	if err := os.WriteFile(input, []byte("pear\napple\n\nfig\napple\nbanana"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg := config{runBytes: 64, fanIn: 2}
	if _, err := externalSort(input, output, work, cfg); err != nil {
		t.Fatal(err)
	}
	sorted, err := os.ReadFile(output)
	if err != nil || string(sorted) != "\napple\napple\nbanana\nfig\npear\n" {
		t.Errorf("output %q, %v", sorted, err)
	}
	memory := filepath.Join(directory, "memory.txt")
	if lines, err := inMemorySort(input, memory); err != nil || lines != 6 {
		t.Errorf("inMemorySort: %d lines, %v", lines, err)
	}
	if inMemory, err := os.ReadFile(memory); err != nil || !bytes.Equal(inMemory, sorted) {
		t.Errorf("the in-memory sort differs from the external sort (%v)", err)
	}

	if err := os.WriteFile(input, []byte(strings.Repeat("x", 200)+"\nshort\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := externalSort(input, output, work, cfg); err == nil {
		t.Error("a line longer than the run size must be an error")
	}
	if _, err := externalSort(input, output, work, config{runBytes: 4096, fanIn: 1}); err == nil {
		t.Error("a fan-in of 1 must be an error")
	}
}

// EN: The checks themselves are tested: a file out of order, a missing line and a changed line
// are all detected.
//
// PT: As próprias verificações são testadas: um arquivo fora de ordem, uma linha faltando e uma
// linha alterada são todos detectados.
func TestInspectionDetectsWrongOutputs(t *testing.T) {
	directory := t.TempDir()
	write := func(name, text string) (digest, bool) {
		path := filepath.Join(directory, name)
		if err := os.WriteFile(path, []byte(text), 0o644); err != nil {
			t.Fatal(err)
		}
		return mustInspect(t, path)
	}
	good, sorted := write("good.txt", "a\nb\nb\nc\n")
	if !sorted || good.lines != 4 {
		t.Error("a sorted file with a repeated line was not accepted")
	}
	if unsorted, sorted := write("unsorted.txt", "a\nc\nb\nb\n"); sorted || !unsorted.sameLines(good) {
		t.Error("same lines in the wrong order: order must fail and lines must match")
	}
	if missing, sorted := write("missing.txt", "a\nb\nc\n"); !sorted || missing.sameLines(good) {
		t.Error("a lost repeated line was not detected")
	}
	if changed, _ := write("changed.txt", "a\nb\nb\nd\n"); changed.sameLines(good) {
		t.Error("a changed line was not detected")
	}
}

func TestHeapAlwaysGivesTheSmallestCurrentLine(t *testing.T) {
	var lines [][]byte
	for _, text := range []string{"m", "c", "x", "c", "a", "t", "k"} {
		lines = append(lines, []byte(text))
	}
	heap := newRunHeap([]int{0, 1, 2, 3, 4, 5, 6}, lines)
	if top, _ := heap.peek(); top != 4 {
		t.Fatalf("top is run %d, expected 4", top)
	}
	// Run 4 gives its next line, which is larger than everything else.
	lines[4] = []byte("z")
	heap.topChanged(lines)
	if top, _ := heap.peek(); top != 1 {
		t.Fatalf("equal lines: the lower run number comes first, got %d", top)
	}
	var order []int
	for {
		run, found := heap.peek()
		if !found {
			break
		}
		order = append(order, run)
		heap.removeTop(lines)
	}
	if !slices.Equal(order, []int{1, 3, 6, 0, 5, 2, 4}) {
		t.Errorf("runs left the heap in the order %v", order)
	}
}
