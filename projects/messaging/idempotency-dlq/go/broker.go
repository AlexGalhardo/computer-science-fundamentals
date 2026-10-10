package idempotency

import (
	"errors"
	"fmt"
	"math/rand/v2"
	"sync"
	"time"
)

// ErrPoison is the failure of a poisoned message: it happens on every attempt.
var ErrPoison = errors.New("poisoned message: the handler cannot process it")

// Policy is the retry policy of the broker.
type Policy struct {
	// MaxAttempts is the total number of tries, the first one included.
	MaxAttempts int
	// BaseDelay is the wait after the first failed attempt.
	BaseDelay time.Duration
}

// Backoff returns the wait after the given failed attempt, starting at 1.
//
// EN: Exponential backoff: base, 2 x base, 4 x base, ... Each failure doubles the wait, so a
// dependency in trouble gets more and more time to recover.
// PT: Backoff exponencial: base, 2 x base, 4 x base, ... Cada falha dobra a espera, então uma
// dependência com problemas ganha cada vez mais tempo para se recuperar.
// ES: Backoff exponencial: base, 2 x base, 4 x base, ... Cada fallo duplica la espera, así que una
// dependencia con problemas tiene cada vez más tiempo para recuperarse.
func Backoff(attempt int, base time.Duration) time.Duration {
	if attempt < 1 {
		attempt = 1
	}
	return base << (attempt - 1)
}

// Delivery is a message handed to a consumer, with the number of the attempt.
type Delivery struct {
	Message Message
	Attempt int
}

// Broker is a small in-memory broker with at-least-once delivery, retry with backoff and a
// dead-letter queue.
//
// EN: It behaves like the real ones in the three ways that matter here. A delivery that is not
// acknowledged comes back. A handler that fails is retried after a growing wait. A message that
// used all its attempts is set aside in the dead-letter queue instead of looping forever.
// PT: Ele se comporta como os de verdade nos três pontos que importam aqui. Uma entrega sem
// confirmação volta. Um handler que falha é repetido depois de uma espera crescente. Uma
// mensagem que usou todas as tentativas é posta de lado na dead-letter queue em vez de ficar em
// laço para sempre.
// ES: Se comporta como los de verdad en los tres puntos que importan aquí. Una entrega sin
// confirmación vuelve. Un handler que falla se reintenta tras una espera creciente. Un mensaje que
// usó todos sus intentos se aparta en la dead-letter queue en lugar de dar vueltas para siempre.
type Broker struct {
	policy Policy
	// Sleep is how the broker waits before a retry. Tests replace it to avoid real waits.
	Sleep func(time.Duration)
	// LoseAck reports whether the acknowledgement of a successful delivery is "lost".
	LoseAck func() bool

	work    chan Delivery
	pending sync.WaitGroup

	mu         sync.Mutex
	deliveries map[string]int
	waits      map[string][]time.Duration
	dead       []Delivery
}

// NewBroker creates a broker with no chaos: every acknowledgement arrives.
func NewBroker(policy Policy) *Broker {
	return &Broker{
		policy:     policy,
		Sleep:      time.Sleep,
		LoseAck:    func() bool { return false },
		work:       make(chan Delivery, 64),
		deliveries: make(map[string]int),
		waits:      make(map[string][]time.Duration),
	}
}

// SeededLoss returns a LoseAck function that loses the given share of acknowledgements.
//
// EN: The generator is seeded, so "fails randomly" is reproducible, and it is guarded by a
// mutex because several workers ask it at the same time.
// PT: O gerador tem semente, então "falha aleatoriamente" é reproduzível, e é protegido por um
// mutex porque vários workers o consultam ao mesmo tempo.
// ES: El generador tiene semilla, así que "falla aleatoriamente" es reproducible, y está protegido
// por un mutex porque varios workers lo consultan al mismo tiempo.
func SeededLoss(rate float64, seed uint64) func() bool {
	var mu sync.Mutex
	random := rand.New(rand.NewPCG(seed, seed))
	return func() bool {
		mu.Lock()
		defer mu.Unlock()
		return random.Float64() < rate
	}
}

// Publish hands a message to the broker.
func (b *Broker) Publish(message Message) {
	b.pending.Add(1)
	b.enqueue(Delivery{Message: message, Attempt: 1})
}

// enqueue never blocks the caller: a worker that requeues must not wait on its own queue.
func (b *Broker) enqueue(delivery Delivery) {
	go func() { b.work <- delivery }()
}

// Run starts the workers, waits until every published message is settled (acknowledged or
// dead-lettered) and stops the workers.
func (b *Broker) Run(workers int, handle func(Message) error) {
	var running sync.WaitGroup
	for range workers {
		running.Add(1)
		go func() {
			defer running.Done()
			for delivery := range b.work {
				b.consume(delivery, handle)
			}
		}()
	}
	b.pending.Wait()
	close(b.work)
	running.Wait()
}

func (b *Broker) consume(delivery Delivery, handle func(Message) error) {
	id := delivery.Message.ID
	b.mu.Lock()
	b.deliveries[id]++
	b.mu.Unlock()

	if err := handle(delivery.Message); err != nil {
		if delivery.Attempt >= b.policy.MaxAttempts {
			// EN: No attempts left: the message goes to the dead-letter queue and stops
			// taking the place of healthy messages.
			// PT: Sem tentativas: a mensagem vai para a dead-letter queue e para de ocupar o
			// lugar das mensagens saudáveis.
			// ES: Sin intentos: el mensaje va a la dead-letter queue y deja de ocupar el
			// lugar de los mensajes sanos.
			b.mu.Lock()
			b.dead = append(b.dead, delivery)
			b.mu.Unlock()
			b.pending.Done()
			return
		}
		wait := Backoff(delivery.Attempt, b.policy.BaseDelay)
		b.mu.Lock()
		b.waits[id] = append(b.waits[id], wait)
		b.mu.Unlock()
		// EN: The wait happens outside the worker, so a failing message does not hold a
		// worker while it waits.
		// PT: A espera acontece fora do worker, então uma mensagem com falha não prende um
		// worker enquanto espera.
		// ES: La espera ocurre fuera del worker, así que un mensaje con fallo no retiene a un
		// worker mientras espera.
		go func() {
			b.Sleep(wait)
			b.work <- Delivery{Message: delivery.Message, Attempt: delivery.Attempt + 1}
		}()
		return
	}
	if b.LoseAck() {
		// EN: The effect is done but the broker never heard the acknowledgement, so it
		// delivers the same message again. This is where duplicates are born.
		// PT: O efeito foi feito, mas o broker nunca ouviu a confirmação, então entrega a
		// mesma mensagem de novo. É aqui que as duplicatas nascem.
		// ES: El efecto se hizo, pero el broker nunca oyó la confirmación, así que entrega el
		// mismo mensaje de nuevo. Aquí es donde nacen los duplicados.
		b.enqueue(delivery)
		return
	}
	b.pending.Done()
}

// Deliveries returns how many times the message id was delivered.
func (b *Broker) Deliveries(id string) int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.deliveries[id]
}

// TotalDeliveries returns the number of deliveries of all messages.
func (b *Broker) TotalDeliveries() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	total := 0
	for _, count := range b.deliveries {
		total += count
	}
	return total
}

// Waits returns the backoff waits requested for the message id, in order.
func (b *Broker) Waits(id string) []time.Duration {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]time.Duration(nil), b.waits[id]...)
}

// DeadLetters returns the content of the dead-letter queue.
func (b *Broker) DeadLetters() []Delivery {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]Delivery(nil), b.dead...)
}

// Handler builds the consumer: the store decides whether the credit is applied.
func Handler(store Store, ledger *Ledger) func(Message) error {
	return func(message Message) error {
		if message.Poison {
			return ErrPoison
		}
		store.Apply(message.ID, func() { ledger.Credit(message.Amount) })
		return nil
	}
}

// Result is the outcome of one run of the duplicates scenario.
type Result struct {
	Messages   int
	Deliveries int
	Effects    int
	Balance    int64
	// MinDeliveries is the lowest number of deliveries any single message had.
	MinDeliveries int
}

// RunDuplicates publishes every message twice, loses 20% of the acknowledgements and reports
// how many effects were applied.
func RunDuplicates(store Store, messages int, workers int, seed uint64) Result {
	broker := NewBroker(Policy{MaxAttempts: 3, BaseDelay: time.Millisecond})
	broker.LoseAck = SeededLoss(0.2, seed)
	ledger := &Ledger{}
	ids := make([]string, messages)
	for index := range messages {
		ids[index] = messageID(index)
		message := Message{ID: ids[index], Amount: 100}
		// EN: Twice, like a producer that retries after a lost confirmation.
		// PT: Duas vezes, como um produtor que repete depois de perder a confirmação.
		// ES: Dos veces, como un productor que reintenta tras perder la confirmación.
		broker.Publish(message)
		broker.Publish(message)
	}
	broker.Run(workers, Handler(store, ledger))

	balance, effects := ledger.Totals()
	lowest := 0
	for index, id := range ids {
		if count := broker.Deliveries(id); index == 0 || count < lowest {
			lowest = count
		}
	}
	return Result{
		Messages:      messages,
		Deliveries:    broker.TotalDeliveries(),
		Effects:       effects,
		Balance:       balance,
		MinDeliveries: lowest,
	}
}

func messageID(index int) string {
	return fmt.Sprintf("pay-%05d", index)
}
