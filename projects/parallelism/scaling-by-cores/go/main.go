// Command scaling-by-cores runs one workload of the benchmark:
//
//	scaling-by-cores <primes|mandelbrot>-<seq|static|dynamic> <n> <workers>
package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
	"time"
)

const usage = "usage: scaling-by-cores <primes|mandelbrot>-<seq|static|dynamic> <n> <workers>"

// EN: Peak resident memory of this process, as the Linux kernel reports it in
// /proc/self/status (the VmHWM line, in kB). The benchmark always runs in a Linux
// container, and outside Linux the field is reported as 0 instead of failing.
// PT: Pico de memória residente deste processo, como o kernel do Linux informa em
// /proc/self/status (a linha VmHWM, em kB). O benchmark sempre roda em um contêiner
// Linux, e fora do Linux o campo é informado como 0 em vez de falhar.
// ES: Pico de memoria residente de este proceso, como lo informa el kernel de Linux en
// /proc/self/status (la línea VmHWM, en kB). El benchmark siempre corre en un contenedor
// Linux, y fuera de Linux el campo se informa como 0 en lugar de fallar.
func peakMemoryKb() uint64 {
	status, err := os.ReadFile("/proc/self/status")
	if err != nil {
		return 0
	}
	for line := range strings.SplitSeq(string(status), "\n") {
		rest, found := strings.CutPrefix(line, "VmHWM:")
		if !found {
			continue
		}
		fields := strings.Fields(rest)
		if len(fields) == 0 {
			return 0
		}
		value, err := strconv.ParseUint(fields[0], 10, 64)
		if err != nil {
			return 0
		}
		return value
	}
	return 0
}

// run executes one implementation and returns its checksum.
func run(implementation string, n uint64, workers int) (string, bool) {
	workload, mode, found := strings.Cut(implementation, "-")
	if !found {
		return "", false
	}
	sequential := mode == "seq"
	var chosen schedule
	switch mode {
	case "seq", "static":
		chosen = scheduleStatic
	case "dynamic":
		chosen = scheduleDynamic
	default:
		return "", false
	}
	switch workload {
	// EN: n is the number of items in both workloads, so one size compares them: the
	// integers 1..n tested for primality, or the pixels of a square image whose side is
	// the integer square root of n.
	// PT: n é o número de itens nas duas cargas, então um único tamanho compara as duas: os
	// inteiros 1..n testados quanto à primalidade, ou os pixels de uma imagem quadrada
	// cujo lado é a raiz quadrada inteira de n.
	// ES: n es el número de ítems en las dos cargas, así que un solo tamaño compara las dos: los
	// enteros 1..n probados por primalidad, o los píxeles de una imagen cuadrada
	// cuyo lado es la raíz cuadrada entera de n.
	case "primes":
		var stats primeStats
		if sequential {
			stats = countSequential(n)
		} else {
			stats = countParallel(n, workers, chosen)
		}
		return fmt.Sprintf("%d:%d", stats.count, stats.sum), true
	case "mandelbrot":
		side := integerSqrt(n)
		var img image
		if sequential {
			img = renderSequential(side, maxIter)
		} else {
			img = renderParallel(side, maxIter, workers, chosen)
		}
		return fmt.Sprintf("%d:%016x", img.totalIterations, img.checksum()), true
	default:
		return "", false
	}
}

// integerSqrt returns the largest integer whose square is not above n.
func integerSqrt(n uint64) int {
	root := uint64(math.Sqrt(float64(n)))
	for root*root > n {
		root--
	}
	for (root+1)*(root+1) <= n {
		root++
	}
	return int(root)
}

func fail() {
	fmt.Fprintln(os.Stderr, usage)
	os.Exit(2)
}

func main() {
	if len(os.Args) != 4 {
		fail()
	}
	implementation := os.Args[1]
	n, errN := strconv.ParseUint(os.Args[2], 10, 64)
	workers, errWorkers := strconv.Atoi(os.Args[3])
	if errN != nil || errWorkers != nil {
		fail()
	}

	// EN: Only the work is timed, not the start-up of the process. The checksum is part of
	// the work: it is the serial tail every run pays.
	// PT: Só o trabalho é cronometrado, não a inicialização do processo. O checksum faz parte
	// do trabalho: é a cauda serial que toda execução paga.
	// ES: Solo se cronometra el trabajo, no el arranque del proceso. El checksum forma parte
	// del trabajo: es la cola serial que paga toda ejecución.
	start := time.Now()
	checksum, ok := run(implementation, n, workers)
	if !ok {
		fail()
	}
	elapsedMs := float64(time.Since(start).Nanoseconds()) / 1e6

	// EN: The benchmark contract: one JSON object on the last line of output.
	// PT: O contrato de benchmark: um objeto JSON na última linha da saída.
	// ES: El contrato de benchmark: un objeto JSON en la última línea de la salida.
	fmt.Printf(
		"{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":%q}\n",
		n, elapsedMs, peakMemoryKb(), implementation, checksum,
	)
}
