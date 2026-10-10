// Package counterrace is the Go implementation of the counter-race mini-project: one shared
// counter, one buggy way to increment it from several goroutines and three ways to fix it.
package counterrace

import (
	"sync"
	"sync/atomic"
)

// Counter is something that can be incremented by many goroutines and read at the end.
type Counter interface {
	Inc()
	Value() int64
}

// BuggyCounter is DELIBERATELY WRONG: it has a data race.
//
// EN: `c.n++` looks like one step, but the processor does three: read n, add 1, write n back.
// Two goroutines can both read 41, both add 1 and both write 42. One increment is lost.
// This is called a lost update, and it only shows up when the timing is unlucky.
//
// PT: `c.n++` parece um passo só, mas o processador faz três: lê n, soma 1, grava n de volta.
// Duas goroutines podem ler 41, somar 1 e gravar 42. Um incremento se perde.
// Isso se chama atualização perdida, e só aparece quando o tempo dá azar.
//
// ES: `c.n++` parece un solo paso, pero el procesador hace tres: lee n, suma 1, escribe n de
// vuelta. Dos goroutines pueden leer 41, sumar 1 y escribir 42. Un incremento se pierde.
// Esto se llama actualización perdida, y solo aparece cuando el tiempo da mala suerte.
type BuggyCounter struct {
	n int64
}

// Inc increments without any synchronisation (the bug).
func (c *BuggyCounter) Inc() { c.n++ }

// Value returns the current count.
func (c *BuggyCounter) Value() int64 { return c.n }

// MutexCounter fixes the race with mutual exclusion.
//
// EN: The three steps of the increment form a critical section. The mutex lets only one
// goroutine at a time inside it, so nobody can read a value that is about to be overwritten.
// The price: goroutines queue up, and each lock and unlock costs time.
//
// PT: Os três passos do incremento formam uma seção crítica. O mutex deixa só uma goroutine
// por vez lá dentro, então ninguém lê um valor que está a ponto de ser sobrescrito.
// O preço: as goroutines fazem fila, e cada lock e unlock custa tempo.
//
// ES: Los tres pasos del incremento forman una sección crítica. El mutex deja solo una goroutine
// a la vez adentro, así nadie lee un valor que está a punto de ser sobrescrito.
// El precio: las goroutines hacen fila, y cada lock y unlock cuesta tiempo.
type MutexCounter struct {
	mu sync.Mutex
	n  int64
}

// Inc increments inside the critical section.
func (c *MutexCounter) Inc() {
	c.mu.Lock()
	c.n++
	c.mu.Unlock()
}

// Value returns the current count.
func (c *MutexCounter) Value() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

// AtomicCounter fixes the race with an atomic operation.
//
// EN: The processor has an instruction that reads, adds and writes as one indivisible step.
// No other core can slip in between, so no lock is needed. Atomics work for one variable.
// When two variables must change together, a mutex is still the right tool.
//
// PT: O processador tem uma instrução que lê, soma e grava como um passo indivisível.
// Nenhum outro núcleo consegue entrar no meio, então não é preciso trava. Atômicos servem
// para uma variável. Quando duas variáveis precisam mudar juntas, o mutex continua sendo
// a ferramenta certa.
//
// ES: El procesador tiene una instrucción que lee, suma y escribe como un paso indivisible.
// Ningún otro núcleo puede meterse en el medio, así que no hace falta un lock. Los atómicos sirven
// para una variable. Cuando dos variables deben cambiar juntas, el mutex sigue siendo
// la herramienta correcta.
type AtomicCounter struct {
	n atomic.Int64
}

// Inc increments in a single atomic step.
func (c *AtomicCounter) Inc() { c.n.Add(1) }

// Value returns the current count.
func (c *AtomicCounter) Value() int64 { return c.n.Load() }

// ChannelCounter fixes the race by not sharing the variable at all.
//
// EN: One goroutine owns the number. Everybody else sends it a message through a channel.
// The owner handles one message at a time, so the increments are naturally in a queue.
// This is the Go motto: do not communicate by sharing memory, share memory by communicating.
//
// PT: Uma goroutine é dona do número. Todas as outras mandam mensagens a ela por um canal.
// A dona trata uma mensagem por vez, então as somas ficam naturalmente em fila.
// É o lema do Go: não se comunique compartilhando memória, compartilhe memória se comunicando.
//
// ES: Una goroutine es dueña del número. Todas las demás le envían mensajes por un canal.
// La dueña atiende un mensaje a la vez, así que las sumas quedan naturalmente en fila.
// Es el lema de Go: no te comuniques compartiendo memoria, comparte memoria comunicándote.
type ChannelCounter struct {
	incs  chan struct{}
	reads chan chan int64
	done  chan struct{}
}

// NewChannelCounter starts the goroutine that owns the count.
func NewChannelCounter() *ChannelCounter {
	c := &ChannelCounter{
		incs:  make(chan struct{}),
		reads: make(chan chan int64),
		done:  make(chan struct{}),
	}
	go c.own()
	return c
}

func (c *ChannelCounter) own() {
	// EN: `n` is a local variable of this goroutine: no other goroutine can even name it.
	// PT: `n` é uma variável local desta goroutine: nenhuma outra consegue sequer citá-la.
	// ES: `n` es una variable local de esta goroutine: ninguna otra puede siquiera nombrarla.
	var n int64
	for {
		select {
		case <-c.incs:
			n++
		case reply := <-c.reads:
			reply <- n
		case <-c.done:
			return
		}
	}
}

// Inc asks the owner to add one. It returns once the owner received the request.
func (c *ChannelCounter) Inc() { c.incs <- struct{}{} }

// Value asks the owner for the current count.
func (c *ChannelCounter) Value() int64 {
	reply := make(chan int64)
	c.reads <- reply
	return <-reply
}

// Close stops the owner goroutine.
func (c *ChannelCounter) Close() { close(c.done) }

// Run increments the counter `perWorker` times from each of `workers` goroutines and
// returns the final value. The expected result is workers * perWorker.
//
// EN: All goroutines wait at a starting gate and leave together. Without the gate the first
// one could finish before the last one starts, and the bug would hide.
//
// PT: Todas as goroutines esperam em um portão de largada e saem juntas. Sem o portão, a
// primeira poderia terminar antes de a última começar, e o bug ficaria escondido.
//
// ES: Todas las goroutines esperan en una puerta de salida y salen juntas. Sin la puerta, la
// primera podría terminar antes de que la última empiece, y el bug quedaría escondido.
func Run(c Counter, workers, perWorker int) int64 {
	var wg sync.WaitGroup
	gate := make(chan struct{})
	for range workers {
		wg.Go(func() {
			<-gate
			for range perWorker {
				c.Inc()
			}
		})
	}
	close(gate)
	wg.Wait()
	return c.Value()
}

// Variants lists the implementations by name, in teaching order.
var Variants = []string{"buggy", "mutex", "atomic", "channel"}

// New builds a counter by name. The second value stops any goroutine the counter started.
func New(variant string) (Counter, func(), bool) {
	noop := func() {}
	switch variant {
	case "buggy":
		return &BuggyCounter{}, noop, true
	case "mutex":
		return &MutexCounter{}, noop, true
	case "atomic":
		return &AtomicCounter{}, noop, true
	case "channel":
		c := NewChannelCounter()
		return c, c.Close, true
	default:
		return nil, noop, false
	}
}
