// Command experiment prints the burst experiment table computed by the Go implementation.
//
// EN: `docker compose run --rm go-test go run ./cmd/experiment`. The numbers must be the
// same as in results/burst.md, which the TypeScript version writes.
// PT: `docker compose run --rm go-test go run ./cmd/experiment`. Os números devem ser os
// mesmos de results/burst.md, que a versão em TypeScript grava.
// ES: `docker compose run --rm go-test go run ./cmd/experiment`. Los números deben ser los
// mismos de results/burst.md, que escribe la versión en TypeScript.
package main

import (
	"fmt"
	"os"

	ratelimiter "rate-limiter"
)

func main() {
	series, err := ratelimiter.RunExperiment()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("%-22s", "series")
	for _, phase := range ratelimiter.Phases {
		fmt.Printf("%10s", phase.ID)
	}
	fmt.Printf("%8s%14s\n", "total", "worst 1 s")
	for _, item := range series {
		fmt.Printf("%-22s", item.ID)
		for _, count := range item.PerPhase {
			fmt.Printf("%10d", count)
		}
		fmt.Printf("%8d%14d\n", item.Total, item.PeakPerWindow)
	}
}
