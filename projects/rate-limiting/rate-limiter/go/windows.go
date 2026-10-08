package ratelimiter

import "sync"

// FixedWindow counts the admitted requests of the current aligned window.
//
// EN: Windows are [0, W), [W, 2W), ... and the counter restarts at each boundary. The state
// is one window number and one counter. The flaw: Limit requests at the end of a window
// plus Limit at the start of the next all pass, twice the limit in a short time.
//
// PT: As janelas são [0, W), [W, 2W), ... e o contador recomeça em cada fronteira. O estado
// é um número de janela e um contador. O defeito: Limit requisições no fim de uma janela
// mais Limit no começo da seguinte passam todas, o dobro do limite em pouco tempo.
type FixedWindow struct {
	mu       sync.Mutex
	config   Config
	windowID int64
	count    int64
}

// Allow admits the request while the counter of its window is below the limit.
func (f *FixedWindow) Allow(nowMs int64) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	windowID := nowMs / f.config.WindowMs
	if windowID != f.windowID {
		f.windowID = windowID
		f.count = 0
	}
	if f.count >= f.config.Limit {
		return false
	}
	f.count++
	return true
}

// SlidingLog keeps the timestamp of every admitted request.
//
// EN: A request at time t is admitted when fewer than Limit timestamps lie in (t - W, t].
// Nothing is aligned to the clock, so the limit holds for any interval of length W. The
// price is memory: up to Limit timestamps per client. Rejected requests are not logged,
// otherwise a client that keeps retrying would never be admitted again.
//
// PT: Uma requisição no tempo t é admitida quando menos de Limit instantes estão em
// (t - W, t]. Nada é alinhado ao relógio, então o limite vale para qualquer intervalo de
// tamanho W. O preço é memória: até Limit instantes por cliente. Requisições rejeitadas
// não entram no log, senão um cliente que insiste nunca mais seria admitido.
type SlidingLog struct {
	mu     sync.Mutex
	config Config
	log    []int64
}

// Allow drops the expired timestamps and admits when the log has room.
func (s *SlidingLog) Allow(nowMs int64) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	oldestKept := nowMs - s.config.WindowMs
	expired := 0
	for expired < len(s.log) && s.log[expired] <= oldestKept {
		expired++
	}
	s.log = s.log[expired:]
	if int64(len(s.log)) >= s.config.Limit {
		return false
	}
	s.log = append(s.log, nowMs)
	return true
}

// SlidingCounter approximates the sliding log with two counters.
//
// EN: estimate = previous * (1 - elapsed / W) + current, where elapsed is the time since
// the current aligned window began. The request is admitted when estimate < Limit. The
// formula assumes the previous window was evenly spread, so it can be slightly wrong, in
// exchange for constant memory.
//
// PT: estimativa = anterior * (1 - decorrido / W) + atual, em que decorrido é o tempo desde
// o início da janela alinhada atual. A requisição é admitida quando estimativa < Limit. A
// fórmula supõe que a janela anterior foi uniforme, então pode errar um pouco, em troca de
// memória constante.
type SlidingCounter struct {
	mu       sync.Mutex
	config   Config
	windowID int64
	current  int64
	previous int64
}

// Allow weighs the previous window by the part of it the sliding window still covers.
func (s *SlidingCounter) Allow(nowMs int64) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	limit, windowMs := s.config.Limit, s.config.WindowMs
	windowID := nowMs / windowMs
	if windowID != s.windowID {
		if windowID == s.windowID+1 {
			s.previous = s.current
		} else {
			s.previous = 0
		}
		s.current = 0
		s.windowID = windowID
	}
	elapsed := nowMs - windowID*windowMs
	// EN: Both sides are multiplied by W: integers only, no rounding.
	// PT: Os dois lados são multiplicados por W: só inteiros, sem arredondamento.
	scaledEstimate := s.previous*(windowMs-elapsed) + s.current*windowMs
	if scaledEstimate >= limit*windowMs {
		return false
	}
	s.current++
	return true
}
