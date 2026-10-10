// Package idempotency is the Go side of the idempotency-dlq mini-project. The TypeScript side
// shows the durable version (RabbitMQ and a PostgreSQL transaction). This side keeps everything
// in memory to show the part that is about concurrency: two goroutines holding the same
// message at the same instant.
package idempotency

import "sync"

// Message is one unit of work. ID is the idempotency key, chosen once by the producer.
type Message struct {
	ID     string
	Amount int64
	// Poison marks a message whose handler fails on every attempt.
	Poison bool
}

// Ledger is the side effect: a balance that receives credits.
//
// EN: A credit is a relative update, so it is not idempotent by nature: applying the same
// message twice credits twice. Effects counts how many credits were applied.
// PT: Um crédito é uma atualização relativa, então não é idempotente por natureza: aplicar a
// mesma mensagem duas vezes credita duas vezes. Effects conta quantos créditos foram aplicados.
// ES: Un crédito es una actualización relativa, así que no es idempotente por naturaleza: aplicar
// el mismo mensaje dos veces acredita dos veces. Effects cuenta cuántos créditos se aplicaron.
type Ledger struct {
	mu      sync.Mutex
	balance int64
	effects int
}

// Credit applies one effect.
func (l *Ledger) Credit(amount int64) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.balance += amount
	l.effects++
}

// Totals returns the balance and the number of effects applied so far.
func (l *Ledger) Totals() (balance int64, effects int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.balance, l.effects
}

// Store decides whether the effect of a message id still has to be applied.
type Store interface {
	// Apply runs effect if the id was not applied before, and reports whether it ran.
	Apply(id string, effect func()) bool
}

// NoStore is the unprotected consumer: every delivery applies the effect.
type NoStore struct{}

// Apply always runs the effect.
func (NoStore) Apply(_ string, effect func()) bool {
	effect()
	return true
}

// RacyStore remembers ids, but checks and marks in two separate steps.
//
// EN: This is the check-then-act bug. Each step is protected by the mutex, so there is no data
// race and the race detector stays silent, yet the logic is wrong: two goroutines with the same
// id can both finish the check before either one marks, and both apply the effect. AfterCheck
// is a test hook that runs in that window, so a test can open the window on purpose.
// PT: Este é o bug de checar e depois agir. Cada passo é protegido pelo mutex, então não há data
// race e o detector de corrida fica calado, mas a lógica está errada: duas goroutines com o
// mesmo id podem terminar a checagem antes de qualquer uma marcar, e as duas aplicam o efeito.
// AfterCheck é um gancho de teste que roda nessa janela, para um teste abri-la de propósito.
// ES: Este es el bug de verificar y luego actuar. Cada paso está protegido por el mutex, así que no
// hay data race y el detector de carreras guarda silencio, pero la lógica es incorrecta: dos
// goroutines con el mismo id pueden terminar la verificación antes de que cualquiera marque, y las
// dos aplican el efecto. AfterCheck es un hook de prueba que corre en esa ventana, para que una
// prueba la abra a propósito.
type RacyStore struct {
	mu         sync.Mutex
	seen       map[string]bool
	AfterCheck func()
}

// NewRacyStore creates an empty store.
func NewRacyStore() *RacyStore {
	return &RacyStore{seen: make(map[string]bool)}
}

// Apply checks, then applies, then marks: three steps with gaps between them.
func (s *RacyStore) Apply(id string, effect func()) bool {
	s.mu.Lock()
	seen := s.seen[id]
	s.mu.Unlock()
	if seen {
		return false
	}
	if s.AfterCheck != nil {
		s.AfterCheck()
	}
	effect()
	s.mu.Lock()
	s.seen[id] = true
	s.mu.Unlock()
	return true
}

// AtomicStore checks, applies and marks inside one critical section.
//
// EN: The mutex plays the role of the database transaction of the TypeScript side: the check,
// the effect and the mark happen as one indivisible step, so a second goroutine with the same
// id waits and then finds the mark. A single lock serialises every effect, which is the simple
// and correct choice for a lesson; a real system lets the database do it with a unique key.
// PT: O mutex faz o papel da transação de banco do lado TypeScript: a checagem, o efeito e a
// marca acontecem como um passo indivisível, então uma segunda goroutine com o mesmo id espera
// e depois encontra a marca. Um único lock serializa todos os efeitos, que é a escolha simples e
// correta para uma lição; um sistema real deixa o banco fazer isso com uma chave única.
// ES: El mutex hace el papel de la transacción de base de datos del lado TypeScript: la
// verificación, el efecto y la marca ocurren como un paso indivisible, así que una segunda
// goroutine con el mismo id espera y luego encuentra la marca. Un único lock serializa todos los
// efectos, que es la elección simple y correcta para una lección; un sistema real deja que la base
// de datos lo haga con una clave única.
type AtomicStore struct {
	mu   sync.Mutex
	seen map[string]bool
}

// NewAtomicStore creates an empty store.
func NewAtomicStore() *AtomicStore {
	return &AtomicStore{seen: make(map[string]bool)}
}

// Apply runs the effect at most once per id.
func (s *AtomicStore) Apply(id string, effect func()) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.seen[id] {
		return false
	}
	effect()
	s.seen[id] = true
	return true
}
