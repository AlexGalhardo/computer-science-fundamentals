// Command bench runs one sorting algorithm on a shared input file.
//
// EN: `bench <algorithm> <variant> <n>` reads `data/<variant>-<n>.txt`, sorts it and prints
// one JSON line in the benchmark contract. Only the sort is timed.
//
// PT: `bench <algoritmo> <variante> <n>` lê `data/<variante>-<n>.txt`, ordena e imprime uma
// linha JSON no contrato de benchmark. Só a ordenação é cronometrada.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"slices"
	"strconv"
	"syscall"
	"time"
)

var variants = []string{"random", "sorted", "reversed"}

type result struct {
	N              int     `json:"n"`
	ElapsedMs      float64 `json:"elapsedMs"`
	MemoryKb       int64   `json:"memoryKb"`
	Language       string  `json:"language"`
	Implementation string  `json:"implementation"`
	Checksum       string  `json:"checksum"`
}

// EN: The file is external input: a line that is not an integer from 0 to 2^31 - 1 is an error.
// PT: O arquivo é entrada externa: uma linha que não é um inteiro de 0 a 2^31 - 1 é um erro.
func readValues(path string, expected int) ([]int32, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() { _ = file.Close() }()
	values := make([]int32, 0, expected)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		value, err := strconv.ParseInt(scanner.Text(), 10, 32)
		if err != nil || value < 0 {
			return nil, fmt.Errorf("%s:%d: not an integer from 0 to 2^31 - 1", path, len(values)+1)
		}
		values = append(values, int32(value))
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	if len(values) != expected {
		return nil, fmt.Errorf("%s: expected %d values, found %d", path, expected, len(values))
	}
	return values, nil
}

// EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
// PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
func checksum(values []int32) string {
	var digest int64
	for _, value := range values {
		digest = (digest*31 + int64(value)) % 1_000_000_007
	}
	return strconv.FormatInt(digest, 10)
}

func run(args []string) error {
	if len(args) != 3 {
		return fmt.Errorf("usage: bench <algorithm> <random|sorted|reversed> <n>")
	}
	sort, known := Sorts[args[0]]
	n, err := strconv.Atoi(args[2])
	if !known || !slices.Contains(variants, args[1]) || err != nil || n < 0 {
		return fmt.Errorf("usage: bench <algorithm> <random|sorted|reversed> <n>")
	}
	values, err := readValues(fmt.Sprintf("data/%s-%d.txt", args[1], n), n)
	if err != nil {
		return err
	}

	// EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is reported: the
	// minimum is the measurement least disturbed by other programs on the machine.
	//
	// PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é informada: o
	// mínimo é a medida menos perturbada por outros programas na máquina.
	var sorted []int32
	var elapsed, spent time.Duration
	for repetition := 0; repetition < 5 && (repetition == 0 || spent < 300*time.Millisecond); repetition++ {
		start := time.Now()
		sorted = sort(values)
		took := time.Since(start)
		if repetition == 0 || took < elapsed {
			elapsed = took
		}
		spent += took
	}

	// EN: On Linux, Maxrss is the peak resident memory of the process in kibibytes.
	// PT: No Linux, Maxrss é o pico de memória residente do processo em kibibytes.
	var usage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &usage); err != nil {
		return err
	}
	return json.NewEncoder(os.Stdout).Encode(result{
		N:              n,
		ElapsedMs:      float64(elapsed.Nanoseconds()) / 1e6,
		MemoryKb:       usage.Maxrss,
		Language:       "go",
		Implementation: args[0],
		Checksum:       checksum(sorted),
	})
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
