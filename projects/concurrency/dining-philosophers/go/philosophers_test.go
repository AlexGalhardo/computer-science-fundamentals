package philosophers

import (
	"os"
	"strconv"
	"testing"
	"time"
)

const seats = 5

func envInt(name string, fallback int) int {
	if value, err := strconv.Atoi(os.Getenv(name)); err == nil && value > 0 {
		return value
	}
	return fallback
}

// EN: A deadlock is a matter of timing, so the test repeats the dinner 10 times and requires
// the naive table to freeze in at least 9 of them. "Frozen" means: nobody ate for 500 ms,
// while a healthy table serves hundreds of meals in that time.
// PT: Deadlock é questão de tempo, então o teste repete o jantar 10 vezes e exige que a mesa
// ingênua congele em pelo menos 9 delas. "Congelar" significa: ninguém comeu por 500 ms,
// enquanto uma mesa saudável serve centenas de refeições nesse tempo.
func TestNaiveTableDeadlocks(t *testing.T) {
	const runs = 10
	deadlocks := 0
	for run := range runs {
		result := Run(Naive, seats, 5*time.Second, 500*time.Millisecond)
		t.Logf("run %d: deadlocked=%v meals=%v", run+1, result.Deadlocked, result.Meals)
		if result.Deadlocked {
			deadlocks++
		}
	}
	t.Logf("naive table deadlocked in %d of %d runs", deadlocks, runs)
	if deadlocks < 9 {
		t.Fatalf("deadlock detected in only %d of %d runs, want at least 9", deadlocks, runs)
	}
}

// EN: The fixes must survive a long dinner (60 seconds by default) with no freeze, and every
// philosopher must have eaten. The counters are the proof.
// PT: As correções precisam sobreviver a um jantar longo (60 segundos por padrão) sem
// congelar, e todo filósofo precisa ter comido. Os contadores são a prova.
func TestFixesRunWithEveryPhilosopherEating(t *testing.T) {
	soak := time.Duration(envInt("SOAK_SECONDS", 60)) * time.Second
	for _, strategy := range []Strategy{Ordered, Waiter} {
		t.Run(string(strategy), func(t *testing.T) {
			t.Parallel()
			result := Run(strategy, seats, soak, 2*time.Second)
			t.Logf("%s: ran %s, deadlocked=%v meals=%v", strategy, soak, result.Deadlocked, result.Meals)
			if result.Deadlocked {
				t.Fatalf("%s froze", strategy)
			}
			if !result.EveryoneAte() {
				t.Fatalf("%s: a philosopher starved: %v", strategy, result.Meals)
			}
		})
	}
}

func TestOrderedReversesOnlyTheLastPhilosopher(t *testing.T) {
	for i := range seats {
		first, second := forks(Ordered, i, seats)
		if first >= second {
			t.Fatalf("philosopher %d takes fork %d before fork %d", i, first, second)
		}
	}
	if first, second := forks(Naive, seats-1, seats); first != seats-1 || second != 0 {
		t.Fatalf("naive last philosopher takes %d then %d, want %d then 0", first, second, seats-1)
	}
}
