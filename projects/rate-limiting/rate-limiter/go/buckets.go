package ratelimiter

import "sync"

// TokenBucket holds up to Limit tokens and earns Limit tokens every WindowMs.
//
// EN: A request takes one token. The capacity is the burst that passes at once, the refill
// rate is the long-run average, and tokens above the capacity are thrown away. The balance
// is kept in "credit" units (one token = WindowMs credits), so each millisecond earns
// exactly Limit credits and no floating point is involved. The refill is lazy: computed
// from the elapsed time at each request, with no background timer.
//
// PT: Uma requisição gasta uma ficha. A capacidade é a rajada que passa de uma vez, a taxa
// de reposição é a média no longo prazo, e fichas acima da capacidade são descartadas. O
// saldo é guardado em unidades de "crédito" (uma ficha = WindowMs créditos), então cada
// milissegundo rende exatamente Limit créditos e não há ponto flutuante. A reposição é
// preguiçosa: calculada a partir do tempo decorrido a cada requisição, sem timer em segundo plano.
type TokenBucket struct {
	mu     sync.Mutex
	config Config
	credit int64
	lastMs int64
}

// Allow refills by the elapsed time and spends one token when there is one.
func (t *TokenBucket) Allow(nowMs int64) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	limit, windowMs := t.config.Limit, t.config.WindowMs
	t.credit = min(limit*windowMs, t.credit+(nowMs-t.lastMs)*limit)
	t.lastMs = nowMs
	if t.credit < windowMs {
		return false
	}
	t.credit -= windowMs
	return true
}

// LeakyBucket is the leaky bucket as a queue: a traffic shaper.
//
// EN: The bucket holds at most Limit requests and leaks Limit of them every WindowMs. A
// request that finds it full is rejected. An admitted request waits for the water in front
// of it to leak, so the output is never faster than the leak rate, whatever the input. It
// admits the same requests as a token bucket of the same size; the difference is that the
// token bucket forwards a burst at once and the leaky bucket spreads it over time.
//
// PT: O balde guarda no máximo Limit requisições e vaza Limit delas a cada WindowMs. Uma
// requisição que o encontra cheio é rejeitada. Uma requisição admitida espera a água à sua
// frente vazar, então a saída nunca é mais rápida que a taxa de vazão, seja qual for a
// entrada. Ele admite as mesmas requisições que um token bucket do mesmo tamanho; a
// diferença é que o token bucket encaminha a rajada de uma vez e o leaky bucket a espalha no tempo.
type LeakyBucket struct {
	mu     sync.Mutex
	config Config
	level  int64
	lastMs int64
}

// Schedule returns when an admitted request leaves the bucket. ok is false when it is full.
func (l *LeakyBucket) Schedule(nowMs int64) (departAtMs int64, ok bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	limit, windowMs := l.config.Limit, l.config.WindowMs
	l.level = max(0, l.level-(nowMs-l.lastMs)*limit)
	l.lastMs = nowMs
	if l.level+windowMs > limit*windowMs {
		return 0, false
	}
	// EN: The wait is the time the water already in the bucket takes to leak, rounded up.
	// PT: A espera é o tempo que a água já presente no balde leva para vazar, arredondado para cima.
	waitMs := (l.level + limit - 1) / limit
	l.level += windowMs
	return nowMs + waitMs, true
}

// Allow admits the request when the bucket has room.
func (l *LeakyBucket) Allow(nowMs int64) bool {
	_, ok := l.Schedule(nowMs)
	return ok
}
