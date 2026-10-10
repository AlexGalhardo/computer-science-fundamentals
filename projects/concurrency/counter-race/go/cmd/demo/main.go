// Command demo runs one counter variant and prints one JSON line (the benchmark contract of
// the repository). With no arguments it runs every variant and prints a small table.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	counterrace "counter-race"
)

// EN: 8 workers by default. The benchmark sets WORKERS to 1, 2, 4 and 8 to show how each fix scales.
// PT: 8 workers por padrão. O benchmark define WORKERS como 1, 2, 4 e 8 para mostrar como cada correção escala.
// ES: 8 workers por defecto. El benchmark define WORKERS como 1, 2, 4 y 8 para mostrar cómo escala cada corrección.
var workers = envWorkers()

func envWorkers() int {
	if value, err := strconv.Atoi(os.Getenv("WORKERS")); err == nil && value > 0 {
		return value
	}
	return 8
}

type result struct {
	N              int     `json:"n"`
	ElapsedMs      float64 `json:"elapsedMs"`
	MemoryKb       int     `json:"memoryKb"`
	Language       string  `json:"language"`
	Implementation string  `json:"implementation"`
	Checksum       string  `json:"checksum"`
}

// peakMemoryKb reads the peak resident memory of this process from Linux.
func peakMemoryKb() int {
	data, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for line := range strings.SplitSeq(string(data), "\n") {
		if rest, ok := strings.CutPrefix(line, "VmHWM:"); ok {
			kb, _ := strconv.Atoi(strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(rest), "kB")))
			return kb
		}
	}
	return 0
}

func measure(variant string, n int) (result, error) {
	counter, stop, ok := counterrace.New(variant)
	if !ok {
		return result{}, fmt.Errorf("unknown variant %q (use one of %v)", variant, counterrace.Variants)
	}
	defer stop()
	start := time.Now()
	final := counterrace.Run(counter, workers, n/workers)
	elapsed := time.Since(start)
	return result{
		N:              n,
		ElapsedMs:      float64(elapsed.Microseconds()) / 1000,
		MemoryKb:       peakMemoryKb(),
		Language:       "go",
		Implementation: variant,
		// EN: The checksum is the final value. For a correct counter it equals n.
		// PT: O checksum é o valor final. Em um contador correto ele é igual a n.
		// ES: El checksum es el valor final. En un contador correcto es igual a n.
		Checksum: strconv.FormatInt(final, 10),
	}, nil
}

func main() {
	if len(os.Args) < 2 {
		const n = 1_000_000
		fmt.Printf("%-8s %10s %10s %10s\n", "variant", "final", "lost", "ms")
		for _, variant := range counterrace.Variants {
			r, err := measure(variant, n)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(2)
			}
			final, _ := strconv.Atoi(r.Checksum)
			fmt.Printf("%-8s %10d %10d %10.1f\n", variant, final, n-final, r.ElapsedMs)
		}
		return
	}
	n := 1_000_000
	if len(os.Args) > 2 {
		parsed, err := strconv.Atoi(os.Args[2])
		if err != nil || parsed < workers {
			fmt.Fprintf(os.Stderr, "n must be an integer of at least %d\n", workers)
			os.Exit(2)
		}
		n = parsed
	}
	r, err := measure(os.Args[1], n)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	line, _ := json.Marshal(r)
	fmt.Println(string(line))
}
