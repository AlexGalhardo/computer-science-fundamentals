// Command demo seats five philosophers and prints who ate.
//
//	philosophers-go                  runs the three strategies for 3 seconds each
//	philosophers-go naive --dump     freezes the naive table and prints every goroutine stack
package main

import (
	"fmt"
	"os"
	"runtime/pprof"
	"slices"
	"time"

	philosophers "dining-philosophers"
)

const seats = 5

func main() {
	if len(os.Args) > 1 {
		strategy := philosophers.Strategy(os.Args[1])
		if !slices.Contains(philosophers.Strategies, strategy) {
			fmt.Fprintf(os.Stderr, "unknown strategy %q (use one of %v)\n", os.Args[1], philosophers.Strategies)
			os.Exit(2)
		}
		result := philosophers.Run(strategy, seats, 10*time.Second, 500*time.Millisecond)
		fmt.Printf("%s: deadlocked=%v meals=%v\n", strategy, result.Deadlocked, result.Meals)
		if result.Deadlocked && len(os.Args) > 2 && os.Args[2] == "--dump" {
			// EN: The goroutine profile is the Go thread dump: one block per goroutine, with
			// what it is waiting for and the stack that led there.
			// PT: O perfil de goroutines é o thread dump do Go: um bloco por goroutine, com o
			// que ela está esperando e a pilha que a levou até ali.
			// ES: El perfil de goroutines es el thread dump de Go: un bloque por goroutine, con
			// lo que está esperando y la pila que la llevó hasta ahí.
			if err := pprof.Lookup("goroutine").WriteTo(os.Stdout, 2); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
		}
		return
	}
	fmt.Printf("%-8s %-10s %s\n", "strategy", "deadlock", "meals per philosopher")
	for _, strategy := range philosophers.Strategies {
		result := philosophers.Run(strategy, seats, 3*time.Second, 500*time.Millisecond)
		fmt.Printf("%-8s %-10v %v\n", strategy, result.Deadlocked, result.Meals)
	}
}
