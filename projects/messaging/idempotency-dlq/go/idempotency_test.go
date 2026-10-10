package idempotency

import (
	"reflect"
	"sync"
	"testing"
	"time"
)

const (
	messages = 1000
	workers  = 8
	seed     = 42
)

func TestBackoffDoubles(t *testing.T) {
	want := []time.Duration{100 * time.Millisecond, 200 * time.Millisecond, 400 * time.Millisecond}
	for index, expected := range want {
		if got := Backoff(index+1, 100*time.Millisecond); got != expected {
			t.Errorf("Backoff(%d) = %v, want %v", index+1, got, expected)
		}
	}
}

// Without protection, the side effect is applied more than once.
func TestNoStoreAppliesEveryDelivery(t *testing.T) {
	result := RunDuplicates(NoStore{}, messages, workers, seed)
	if result.MinDeliveries < 2 {
		t.Fatalf("every message must be delivered at least twice, lowest was %d", result.MinDeliveries)
	}
	if result.Effects != result.Deliveries || result.Effects < 2*messages {
		t.Fatalf("effects = %d, deliveries = %d, want one effect per delivery", result.Effects, result.Deliveries)
	}
	if result.Balance <= int64(messages)*100 {
		t.Fatalf("balance = %d, want more than %d", result.Balance, messages*100)
	}
}

// With the atomic store, 1,000 messages delivered at least twice produce exactly 1,000 effects.
func TestAtomicStoreAppliesExactlyOnce(t *testing.T) {
	result := RunDuplicates(NewAtomicStore(), messages, workers, seed)
	if result.MinDeliveries < 2 {
		t.Fatalf("every message must be delivered at least twice, lowest was %d", result.MinDeliveries)
	}
	if result.Deliveries <= 2*messages {
		t.Fatalf("deliveries = %d, want redeliveries on top of the %d published", result.Deliveries, 2*messages)
	}
	if result.Effects != messages {
		t.Fatalf("effects = %d, want exactly %d", result.Effects, messages)
	}
	if result.Balance != int64(messages)*100 {
		t.Fatalf("balance = %d, want %d", result.Balance, messages*100)
	}
}

// applyTwiceAtOnce delivers the same id to two goroutines at the same instant.
func applyTwiceAtOnce(store Store, ledger *Ledger) {
	var done sync.WaitGroup
	for range 2 {
		done.Add(1)
		go func() {
			defer done.Done()
			store.Apply("pay-1", func() { ledger.Credit(100) })
		}()
	}
	done.Wait()
}

// EN: The hook holds each goroutine right after its check until BOTH have checked. That is the
// unlucky interleaving of check-then-act, forced on purpose so the test fails the same way
// every time instead of once in a thousand runs.
// PT: O gancho segura cada goroutine logo depois da checagem até AS DUAS terem checado. Esse é
// o entrelaçamento azarado de checar e depois agir, forçado de propósito para o teste falhar do
// mesmo jeito toda vez, e não uma vez a cada mil execuções.
// ES: El hook retiene a cada goroutine justo después de su verificación hasta que AMBAS hayan
// verificado. Ese es el entrelazado desafortunado de verificar y luego actuar, forzado a propósito
// para que la prueba falle del mismo modo siempre y no una vez cada mil ejecuciones.
func TestRacyStoreAppliesTwice(t *testing.T) {
	store := NewRacyStore()
	var checked sync.WaitGroup
	checked.Add(2)
	store.AfterCheck = func() {
		checked.Done()
		checked.Wait()
	}
	ledger := &Ledger{}
	applyTwiceAtOnce(store, ledger)
	if _, effects := ledger.Totals(); effects != 2 {
		t.Fatalf("effects = %d, want 2: both goroutines passed the check", effects)
	}
}

func TestAtomicStoreSurvivesTheSameInterleaving(t *testing.T) {
	for range 200 {
		ledger := &Ledger{}
		applyTwiceAtOnce(NewAtomicStore(), ledger)
		if _, effects := ledger.Totals(); effects != 1 {
			t.Fatalf("effects = %d, want 1", effects)
		}
	}
}

// A poisoned message lands in the dead-letter queue after the configured attempts.
func TestPoisonLandsInTheDeadLetterQueue(t *testing.T) {
	policy := Policy{MaxAttempts: 4, BaseDelay: 100 * time.Millisecond}
	broker := NewBroker(policy)
	// The waits are recorded by the broker; the test does not need to really sleep.
	broker.Sleep = func(time.Duration) {}
	ledger := &Ledger{}

	const healthy = 20
	broker.Publish(Message{ID: "poison", Amount: 100, Poison: true})
	for index := range healthy {
		broker.Publish(Message{ID: messageID(index), Amount: 100})
	}
	broker.Run(4, Handler(NewAtomicStore(), ledger))

	dead := broker.DeadLetters()
	if len(dead) != 1 || dead[0].Message.ID != "poison" || dead[0].Attempt != policy.MaxAttempts {
		t.Fatalf("dead letters = %+v, want only the poisoned message on attempt %d", dead, policy.MaxAttempts)
	}
	if got := broker.Deliveries("poison"); got != policy.MaxAttempts {
		t.Fatalf("the poisoned message was delivered %d times, want %d", got, policy.MaxAttempts)
	}
	wantWaits := []time.Duration{100 * time.Millisecond, 200 * time.Millisecond, 400 * time.Millisecond}
	if got := broker.Waits("poison"); !reflect.DeepEqual(got, wantWaits) {
		t.Fatalf("waits = %v, want %v", got, wantWaits)
	}
	if _, effects := ledger.Totals(); effects != healthy {
		t.Fatalf("effects = %d, want the %d healthy messages", effects, healthy)
	}
}

func TestBackoffIsRealTimeByDefault(t *testing.T) {
	broker := NewBroker(Policy{MaxAttempts: 3, BaseDelay: 20 * time.Millisecond})
	broker.Publish(Message{ID: "poison", Poison: true})
	start := time.Now()
	broker.Run(1, Handler(NoStore{}, &Ledger{}))
	// 20 ms after the first failure and 40 ms after the second.
	if elapsed := time.Since(start); elapsed < 60*time.Millisecond {
		t.Fatalf("three attempts took %v, want at least 60ms of backoff", elapsed)
	}
}
