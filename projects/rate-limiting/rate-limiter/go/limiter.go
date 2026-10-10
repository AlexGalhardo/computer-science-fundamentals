// Package ratelimiter implements five rate limiting algorithms in memory.
//
// EN: The same algorithms as the TypeScript version, with one thing that changes the lesson.
// JavaScript runs one callback at a time, so `count += 1` can never be interrupted. In Go
// many goroutines call Allow at the same instant on several cores, and "read the counter,
// compare, write it back" is a race: two goroutines read 9, both see "below 10", both
// write 10, and 11 requests pass. Each limiter therefore holds a sync.Mutex around its
// decision. It is the same check-then-act bug that the Redis script fixes between two
// machines, here between two threads of one process.
//
// PT: Os mesmos algoritmos da versão em TypeScript, com uma coisa que muda a lição. O
// JavaScript executa um callback por vez, então `count += 1` nunca é interrompido. Em Go
// muitas goroutines chamam Allow no mesmo instante em vários núcleos, e "ler o contador,
// comparar, gravar de volta" é uma corrida: duas goroutines leem 9, as duas veem "abaixo
// de 10", as duas gravam 10, e 11 requisições passam. Por isso cada limitador segura um
// sync.Mutex em volta da sua decisão. É o mesmo bug de "verificar e depois agir" que o
// script do Redis corrige entre duas máquinas, aqui entre duas threads de um processo.
//
// ES: Los mismos algoritmos que la versión en TypeScript, con una cosa que cambia la lección.
// JavaScript ejecuta un callback a la vez, así que `count += 1` nunca se interrumpe. En Go
// muchas goroutines llaman a Allow en el mismo instante en varios núcleos, y "leer el
// contador, comparar, escribirlo de vuelta" es una carrera: dos goroutines leen 9, las dos
// ven "por debajo de 10", las dos escriben 10, y pasan 11 solicitudes. Por eso cada limitador
// sostiene un sync.Mutex alrededor de su decisión. Es el mismo bug de "verificar y luego
// actuar" que el script de Redis corrige entre dos máquinas, aquí entre dos hilos de un proceso.
package ratelimiter

import "fmt"

// Limiter decides one request that arrives at nowMs.
//
// EN: The clock is an argument, in whole milliseconds, so tests are deterministic. Calls
// must come with non-decreasing times.
//
// PT: O relógio é um argumento, em milissegundos inteiros, então os testes são
// determinísticos. As chamadas devem vir com tempos não decrescentes.
//
// ES: El reloj es un argumento, en milisegundos enteros, así que las pruebas son
// determinísticas. Las llamadas deben venir con tiempos no decrecientes.
type Limiter interface {
	Allow(nowMs int64) bool
}

// Config means "at most Limit requests per WindowMs". For the two buckets: capacity is
// Limit, and the refill (or leak) rate is Limit per WindowMs.
type Config struct {
	Limit    int64
	WindowMs int64
}

// Algorithms lists the names accepted by New, in the order used by the experiment.
var Algorithms = []string{"fixed-window", "sliding-log", "sliding-counter", "token-bucket", "leaky-bucket"}

// New builds the limiter of one client.
func New(algorithm string, config Config) (Limiter, error) {
	if config.Limit < 1 || config.WindowMs < 1 {
		return nil, fmt.Errorf("limit and windowMs must be positive, got %d and %d", config.Limit, config.WindowMs)
	}
	switch algorithm {
	case "fixed-window":
		return &FixedWindow{config: config, windowID: -1}, nil
	case "sliding-log":
		return &SlidingLog{config: config}, nil
	case "sliding-counter":
		return &SlidingCounter{config: config, windowID: -1}, nil
	case "token-bucket":
		return &TokenBucket{config: config, credit: config.Limit * config.WindowMs}, nil
	case "leaky-bucket":
		return &LeakyBucket{config: config}, nil
	default:
		return nil, fmt.Errorf("unknown algorithm %q", algorithm)
	}
}
