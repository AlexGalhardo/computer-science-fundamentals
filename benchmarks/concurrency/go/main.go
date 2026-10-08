// EN: Concurrency workload in Go: n goroutines wait at a gate, the gate opens, each one sends
// its number through a channel, and the sum is the checksum.
// Go model: goroutines. A goroutine is a function with its own small stack (it starts at a
// few kibibytes and grows when needed), scheduled by the Go runtime on a few OS threads
// (M:N scheduling). A goroutine blocked on a channel costs no OS thread: the runtime parks it
// and runs another one.
// PT: Carga de concorrência em Go: n goroutines esperam em um portão, o portão abre, cada uma
// envia seu número por um canal, e a soma é o checksum.
// Modelo do Go: goroutines. Uma goroutine é uma função com sua própria pilha pequena (começa
// com poucos kibibytes e cresce quando precisa), escalonada pelo runtime do Go sobre poucas
// threads do SO (escalonamento M:N). Uma goroutine bloqueada em um canal não custa uma thread
// do SO: o runtime a estaciona e roda outra.
package main

import (
	"fmt"
	"os"
	"strconv"
	"syscall"
	"time"
)

func run(n int) int {
	gate := make(chan struct{})
	mailbox := make(chan int)

	for id := 0; id < n; id++ {
		go func(id int) {
			// EN: Receiving from a channel blocks until it is closed, so closing it wakes everyone.
			// PT: Receber de um canal bloqueia até ele ser fechado, então fechá-lo acorda todos.
			<-gate
			mailbox <- id
		}(id)
	}
	close(gate)

	sum := 0
	for i := 0; i < n; i++ {
		sum += <-mailbox
	}
	return sum
}

func peakMemoryKb() int64 {
	var usage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &usage); err != nil {
		return 0
	}
	return usage.Maxrss
}

func main() {
	implementation, n := "goroutines", 1000
	if len(os.Args) > 1 {
		implementation = os.Args[1]
	}
	if len(os.Args) > 2 {
		n, _ = strconv.Atoi(os.Args[2])
	}

	start := time.Now()
	sum := run(n)
	elapsedMs := float64(time.Since(start).Nanoseconds()) / 1e6

	fmt.Printf("{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"go\",\"implementation\":%q,\"checksum\":\"%d\"}\n",
		n, elapsedMs, peakMemoryKb(), implementation, sum)
}
