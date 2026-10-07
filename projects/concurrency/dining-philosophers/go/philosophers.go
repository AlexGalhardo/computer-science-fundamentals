// Package philosophers is the Go implementation of the dining-philosophers mini-project:
// one table that deadlocks and two ways to make the deadlock impossible.
package philosophers

import (
	"sync"
	"sync/atomic"
	"time"
)

// Strategy says how a philosopher picks up the two forks.
type Strategy string

const (
	// Naive is DELIBERATELY WRONG: every philosopher takes the left fork, then the right one.
	Naive Strategy = "naive"
	// Ordered always takes the fork with the lower number first.
	Ordered Strategy = "ordered"
	// Waiter lets at most n-1 philosophers try to eat at the same time.
	Waiter Strategy = "waiter"
)

// Strategies lists the strategies in teaching order.
var Strategies = []Strategy{Naive, Ordered, Waiter}

// Reach is the time a philosopher takes between the first and the second fork.
//
// EN: A deadlock needs unlucky timing: all five must hold one fork before anybody gets the
// second. This short pause makes that timing common, so the bug shows in milliseconds instead
// of once a month in production. The fixes use the same pause and still never deadlock.
//
// PT: Um deadlock precisa de azar no tempo: os cinco têm de segurar um garfo antes de alguém
// pegar o segundo. Esta pausa curta torna esse azar comum, então o bug aparece em
// milissegundos em vez de uma vez por mês em produção. As correções usam a mesma pausa e
// mesmo assim nunca travam.
const Reach = time.Millisecond

// Result is what happened at the table.
type Result struct {
	// Meals has how many times each philosopher ate.
	Meals []int64
	// Deadlocked is true when nobody ate for a whole stall window.
	Deadlocked bool
}

// EveryoneAte reports whether no philosopher starved.
func (r Result) EveryoneAte() bool {
	for _, meals := range r.Meals {
		if meals == 0 {
			return false
		}
	}
	return true
}

// forks returns the order in which philosopher i locks its two forks.
//
// EN: A deadlock needs four conditions at once (Coffman): mutual exclusion (a fork has one
// holder), hold and wait (hold one fork while waiting for the other), no preemption (nobody
// takes a fork from your hand) and circular wait (0 waits for 1, 1 for 2 ... 4 for 0).
// Remove any one of them and the deadlock is impossible.
//
// PT: Um deadlock precisa de quatro condições ao mesmo tempo (Coffman): exclusão mútua (um
// garfo tem um só dono), posse e espera (segurar um garfo enquanto espera o outro), não
// preempção (ninguém tira o garfo da sua mão) e espera circular (0 espera 1, 1 espera 2 ...
// 4 espera 0). Tire qualquer uma delas e o deadlock fica impossível.
func forks(strategy Strategy, i, n int) (first, second int) {
	left, right := i, (i+1)%n
	// EN: Lock ordering breaks the circular wait. Forks have a global order and everybody
	// takes the lower number first. The last philosopher sits between fork 4 and fork 0, so
	// he reaches for 0 first, like his neighbour: the circle of waiting cannot close.
	// PT: A ordenação de travas quebra a espera circular. Os garfos têm uma ordem global e
	// todos pegam primeiro o de menor número. O último filósofo fica entre o garfo 4 e o 0,
	// então ele tenta primeiro o 0, como o vizinho: o círculo de espera não consegue se fechar.
	if strategy == Ordered && right < left {
		return right, left
	}
	return left, right
}

// Run seats n philosophers for the given duration. It returns early, with Deadlocked set,
// when the total number of meals stops growing for a whole stall window.
//
// EN: This is how a deadlock is detected from the outside: by a timeout on progress. Nothing
// crashes and no error is raised. The program simply stops doing its job.
//
// PT: É assim que se detecta um deadlock por fora: com um tempo limite sobre o avanço.
// Nada quebra e nenhum erro aparece. O programa simplesmente para de fazer o trabalho.
func Run(strategy Strategy, n int, duration, stall time.Duration) Result {
	table := make([]sync.Mutex, n)
	meals := make([]atomic.Int64, n)
	var stop atomic.Bool
	var wg sync.WaitGroup

	// EN: The waiter is a counting semaphore with n-1 permits, built from a buffered channel.
	// With at most 4 of the 5 philosophers at the table, at least one of them can always get
	// both forks. This also breaks the circular wait: a circle needs all five.
	// PT: O garçom é um semáforo contador com n-1 permissões, feito com um canal com buffer.
	// Com no máximo 4 dos 5 filósofos à mesa, pelo menos um deles sempre consegue os dois
	// garfos. Isso também quebra a espera circular: um círculo precisa dos cinco.
	waiter := make(chan struct{}, n-1)

	for i := range n {
		wg.Go(func() {
			first, second := forks(strategy, i, n)
			for !stop.Load() {
				if strategy == Waiter {
					waiter <- struct{}{}
				}
				table[first].Lock()
				time.Sleep(Reach)
				table[second].Lock()
				meals[i].Add(1) // eat
				table[second].Unlock()
				table[first].Unlock()
				if strategy == Waiter {
					<-waiter
				}
			}
		})
	}

	snapshot := func() ([]int64, int64) {
		counts := make([]int64, n)
		var total int64
		for i := range meals {
			counts[i] = meals[i].Load()
			total += counts[i]
		}
		return counts, total
	}

	deadline := time.Now().Add(duration)
	lastTotal, lastProgress := int64(-1), time.Now()
	for time.Now().Before(deadline) {
		time.Sleep(stall / 10)
		if _, total := snapshot(); total != lastTotal {
			lastTotal, lastProgress = total, time.Now()
		} else if time.Since(lastProgress) >= stall {
			// EN: The stuck goroutines can never be woken up: a goroutine blocked on a mutex
			// has no cancel button. They are left behind, which is what a deadlock costs.
			// PT: As goroutines presas nunca poderão ser acordadas: uma goroutine bloqueada em
			// um mutex não tem botão de cancelar. Elas ficam para trás, e esse é o custo de
			// um deadlock.
			counts, _ := snapshot()
			return Result{Meals: counts, Deadlocked: true}
		}
	}
	stop.Store(true)
	wg.Wait()
	counts, _ := snapshot()
	return Result{Meals: counts}
}
