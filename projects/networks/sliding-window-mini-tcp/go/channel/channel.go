// Package channel simulates an unreliable link: packets can be lost, duplicated and reordered.
package channel

import "math/rand/v2"

// Config describes how badly the channel behaves.
type Config struct {
	Loss      float64 // probability that a packet disappears
	Duplicate float64 // probability that a second copy of a packet is delivered
	Reorder   float64 // probability that a copy takes a slower path
	Delay     int     // ticks every copy takes to cross the link
	Jitter    int     // extra ticks, from 1 up to this value, added to a slow copy
	Seed      uint64  // same seed, same sequence of losses, copies and delays
}

// Stats counts what the channel did to the traffic.
type Stats struct {
	Sent       int
	Lost       int
	Duplicated int
	Delayed    int
}

// Channel is one direction of the simulated link.
type Channel struct {
	cfg   Config
	rng   *rand.Rand
	Stats Stats
}

// New creates a channel with its own random generator.
//
// EN: Every random decision comes from one generator seeded by the configuration, never from
// the clock. A simulation that can be replayed exactly is what makes a protocol bug debuggable:
// the same seed reproduces the same lost frame at the same tick.
// PT: Toda decisão aleatória vem de um gerador semeado pela configuração, nunca do relógio.
// Uma simulação que pode ser repetida exatamente é o que torna depurável um erro de protocolo:
// a mesma semente reproduz a mesma perda de quadro no mesmo tick.
// ES: Toda decisión aleatoria viene de un generador sembrado por la configuración, nunca del reloj.
// Una simulación que puede repetirse exactamente es lo que hace depurable un error de protocolo:
// la misma semilla reproduce la misma pérdida de trama en el mismo tick.
func New(cfg Config) *Channel {
	return &Channel{cfg: cfg, rng: rand.New(rand.NewPCG(cfg.Seed, cfg.Seed^0x9e3779b97f4a7c15))}
}

// Send hands one packet to the channel at tick now and returns the ticks at which its copies
// arrive. An empty result means the packet was lost.
//
// EN: The channel does not carry the bytes, it only decides the fate of the packet: zero
// arrivals is a loss, two arrivals is a duplicate, and a copy with extra delay can arrive after
// packets that were sent later, which is reordering.
// PT: O canal não carrega os bytes, apenas decide o destino do pacote: nenhuma chegada é uma
// perda, duas chegadas são uma duplicata, e uma cópia com atraso extra pode chegar depois de
// pacotes enviados mais tarde, o que é reordenação.
// ES: El canal no carga los bytes, solo decide el destino del paquete: ninguna llegada es una
// pérdida, dos llegadas son un duplicado, y una copia con retraso extra puede llegar después de
// paquetes enviados más tarde, lo que es reordenamiento.
func (c *Channel) Send(now int) []int {
	c.Stats.Sent++
	if c.rng.Float64() < c.cfg.Loss {
		c.Stats.Lost++
		return nil
	}
	arrivals := []int{now + c.delay()}
	if c.rng.Float64() < c.cfg.Duplicate {
		c.Stats.Duplicated++
		arrivals = append(arrivals, now+c.delay())
	}
	return arrivals
}

func (c *Channel) delay() int {
	delay := c.cfg.Delay
	if c.cfg.Jitter > 0 && c.rng.Float64() < c.cfg.Reorder {
		c.Stats.Delayed++
		delay += 1 + c.rng.IntN(c.cfg.Jitter)
	}
	return delay
}
