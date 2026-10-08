// EN: Parallelism workload in Go: count the primes below n, range cut into 256 chunks.
// Go model: goroutines on the M:N scheduler of the runtime. GOMAXPROCS says how many OS
// threads may run Go code at once, so it is set to the number of workers. The goroutines
// take chunk numbers from a channel, which is how Go shares work: by communicating.
// PT: Carga de paralelismo em Go: conta os primos abaixo de n, intervalo cortado em 256
// pedaços. Modelo do Go: goroutines no escalonador M:N do runtime. O GOMAXPROCS diz quantas
// threads do SO podem rodar código Go ao mesmo tempo, então recebe o número de workers. As
// goroutines pegam números de pedaço de um canal, que é como o Go divide trabalho: comunicando.
package main

import (
	"fmt"
	"os"
	"runtime"
	"strconv"
	"sync"
	"syscall"
	"time"
)

const chunks = 256

func isPrime(k int) bool {
	if k < 2 {
		return false
	}
	if k < 4 {
		return true
	}
	if k%2 == 0 {
		return false
	}
	for d := 3; d*d <= k; d += 2 {
		if k%d == 0 {
			return false
		}
	}
	return true
}

// EN: Chunk c covers [c*n/256, (c+1)*n/256).
// PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
func countChunk(chunk, n int) int {
	count := 0
	for k := chunk * n / chunks; k < (chunk+1)*n/chunks; k++ {
		if isPrime(k) {
			count++
		}
	}
	return count
}

func countPrimes(n, workers int) int {
	runtime.GOMAXPROCS(workers)
	jobs := make(chan int, chunks)
	for chunk := 0; chunk < chunks; chunk++ {
		jobs <- chunk
	}
	close(jobs)

	partial := make([]int, workers)
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			// EN: Each goroutine adds into its own slot, so no lock is needed for the sum.
			// PT: Cada goroutine soma na própria posição, então a soma não precisa de trava.
			for chunk := range jobs {
				partial[w] += countChunk(chunk, n)
			}
		}(w)
	}
	wg.Wait()

	total := 0
	for _, count := range partial {
		total += count
	}
	return total
}

func peakMemoryKb() int64 {
	var usage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &usage); err != nil {
		return 0
	}
	return usage.Maxrss
}

func main() {
	implementation, n, workers := "primes", 100000, 1
	if len(os.Args) > 1 {
		implementation = os.Args[1]
	}
	if len(os.Args) > 2 {
		n, _ = strconv.Atoi(os.Args[2])
	}
	if len(os.Args) > 3 {
		workers, _ = strconv.Atoi(os.Args[3])
	}

	start := time.Now()
	total := countPrimes(n, workers)
	elapsedMs := float64(time.Since(start).Nanoseconds()) / 1e6

	fmt.Printf("{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":\"%d\"}\n",
		n, elapsedMs, peakMemoryKb(), implementation, total)
}
