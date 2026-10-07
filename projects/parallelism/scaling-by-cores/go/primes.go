package main

import (
	"sync"
	"sync/atomic"
)

// primesChunk is how many numbers the dynamic schedule hands to a worker at a time.
const primesChunk = 10_000

// EN: The result is a pair of integers. Integer addition is associative and commutative, so
// the partial results of the workers can be added in any order and grouping and the total
// is always the same. That is why the parallel answer equals the sequential one exactly.
// PT: O resultado é um par de inteiros. A soma de inteiros é associativa e comutativa, então
// os resultados parciais dos trabalhadores podem ser somados em qualquer ordem e
// agrupamento e o total é sempre o mesmo. Por isso a resposta paralela é exatamente igual
// à sequencial.
type primeStats struct {
	count, sum uint64
}

func (s primeStats) merge(other primeStats) primeStats {
	return primeStats{s.count + other.count, s.sum + other.sum}
}

// EN: Trial division by odd numbers up to the square root. It is deliberately simple and
// CPU-bound, and its cost depends on the value: proving that n is prime takes about
// sqrt(n) / 2 divisions, while most composites leave after a few. Larger numbers are
// therefore more expensive, which makes equal blocks of numbers unequal amounts of work.
// PT: Divisão por tentativa por ímpares até a raiz quadrada. É propositalmente simples e
// limitada por CPU, e o custo depende do valor: provar que n é primo leva cerca de
// sqrt(n) / 2 divisões, enquanto a maioria dos compostos sai depois de poucas. Números
// maiores são, portanto, mais caros, o que faz blocos iguais de números serem quantidades
// desiguais de trabalho.
func isPrime(n uint64) bool {
	if n < 2 {
		return false
	}
	if n < 4 {
		return true
	}
	if n%2 == 0 {
		return false
	}
	for divisor := uint64(3); divisor*divisor <= n; divisor += 2 {
		if n%divisor == 0 {
			return false
		}
	}
	return true
}

// EN: The unit of work shared by every version: scan one range and accumulate in a local
// variable. Nothing here is shared between goroutines, so this function is the same in
// the sequential and in the parallel code.
// PT: A unidade de trabalho comum a todas as versões: percorrer um intervalo e acumular em
// uma variável local. Nada aqui é compartilhado entre goroutines, então esta função é a
// mesma no código sequencial e no paralelo.
func countRange(start, end uint64) primeStats {
	var stats primeStats
	for n := start; n < end; n++ {
		if isPrime(n) {
			stats.count++
			stats.sum += n
		}
	}
	return stats
}

// countSequential counts the primes in [0, limit] on the calling goroutine.
func countSequential(limit uint64) primeStats {
	return countRange(0, limit+1)
}

// countParallel counts the primes in [0, limit] with `workers` goroutines.
func countParallel(limit uint64, workers int, mode schedule) primeStats {
	total := limit + 1
	workers = max(workers, 1)
	// EN: Fork-join. Each `wg.Go` forks a goroutine and `wg.Wait` joins all of them, so the
	// partial results are complete when they are read. Each worker accumulates in a local
	// variable and writes its slot of `partials` once, at the end: no shared counter is
	// written in the hot loop, which avoids both a data race and cache-line contention
	// (the slots are neighbours in memory, so writing them per number would be false
	// sharing).
	// PT: Fork-join. Cada `wg.Go` cria uma goroutine e o `wg.Wait` espera todas terminarem,
	// então os resultados parciais estão completos quando são lidos. Cada trabalhador
	// acumula em uma variável local e escreve a sua posição de `partials` uma única vez,
	// no fim: nenhum contador compartilhado é escrito no laço quente, o que evita tanto a
	// corrida de dados quanto a disputa de linha de cache (as posições são vizinhas na
	// memória, então escrevê-las a cada número seria falso compartilhamento).
	partials := make([]primeStats, workers)
	var wg sync.WaitGroup
	switch mode {
	case scheduleStatic:
		for index, block := range splitStatic(total, workers) {
			wg.Go(func() {
				partials[index] = countRange(block.start, block.end)
			})
		}
	case scheduleDynamic:
		// EN: The only shared state is this counter: "the next number nobody took yet".
		// `Add` is atomic, so two workers can never receive the same chunk. It is touched
		// once per 10 000 numbers, not once per number, so the cost of sharing it is
		// diluted.
		// PT: O único estado compartilhado é este contador: "o próximo número que ninguém
		// pegou ainda". O `Add` é atômico, então dois trabalhadores nunca recebem o mesmo
		// pedaço. Ele é tocado uma vez a cada 10 000 números, e não a cada número, então o
		// custo de compartilhá-lo fica diluído.
		var next atomic.Uint64
		for index := range workers {
			wg.Go(func() {
				var local primeStats
				for {
					start := next.Add(primesChunk) - primesChunk
					if start >= total {
						break
					}
					end := min(start+primesChunk, total)
					local = local.merge(countRange(start, end))
				}
				partials[index] = local
			})
		}
	}
	wg.Wait()
	// EN: The reduction: combine one partial result per worker into the final answer.
	// PT: A redução: combinar um resultado parcial por trabalhador na resposta final.
	var result primeStats
	for _, partial := range partials {
		result = result.merge(partial)
	}
	return result
}
