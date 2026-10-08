// Command demo runs the duplicates scenario with each store and the poisoned message
// scenario, and prints the results as plain text.
package main

import (
	"fmt"
	"time"

	idempotency "idempotency-dlq"
)

func main() {
	const messages, workers, seed = 1000, 8, 42

	fmt.Println("== 1,000 messages, each published twice, 20% of the acknowledgements lost ==")
	fmt.Printf("%-14s %10s %10s %10s\n", "store", "deliveries", "effects", "balance")
	stores := []struct {
		name  string
		store idempotency.Store
	}{
		{"none", idempotency.NoStore{}},
		{"racy", idempotency.NewRacyStore()},
		{"atomic", idempotency.NewAtomicStore()},
	}
	for _, entry := range stores {
		result := idempotency.RunDuplicates(entry.store, messages, workers, seed)
		fmt.Printf("%-14s %10d %10d %10.2f\n", entry.name, result.Deliveries, result.Effects, float64(result.Balance)/100)
	}
	fmt.Println("expected: 1000 effects and a balance of 1000.00")
	fmt.Println("the racy store is wrong only when two workers hold the same id at once, so its number changes from run to run")

	fmt.Println()
	fmt.Println("== a poisoned message, 4 attempts, backoff starting at 100 ms ==")
	policy := idempotency.Policy{MaxAttempts: 4, BaseDelay: 100 * time.Millisecond}
	broker := idempotency.NewBroker(policy)
	ledger := &idempotency.Ledger{}
	broker.Publish(idempotency.Message{ID: "poison", Amount: 100, Poison: true})
	for index := range 20 {
		broker.Publish(idempotency.Message{ID: fmt.Sprintf("ok-%d", index), Amount: 100})
	}
	start := time.Now()
	broker.Run(4, idempotency.Handler(idempotency.NewAtomicStore(), ledger))
	_, effects := ledger.Totals()
	fmt.Printf("waits before the retries: %v\n", broker.Waits("poison"))
	for _, dead := range broker.DeadLetters() {
		fmt.Printf("dead-letter queue: %q, given up on attempt %d\n", dead.Message.ID, dead.Attempt)
	}
	fmt.Printf("healthy messages applied: %d, total time %v\n", effects, time.Since(start).Round(time.Millisecond))
}
