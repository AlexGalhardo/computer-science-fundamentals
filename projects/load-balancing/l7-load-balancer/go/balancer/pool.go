// Package balancer is a small layer 7 load balancer written with the standard library only.
//
// EN: A load balancer does four things on every request: it chooses a back end, forwards the
// request, copies the answer back and, when the back end fails, decides whether to try
// another one. This package keeps each of those steps in its own file so that they can be
// read one at a time: pool.go (who the back ends are), strategy.go (the choice), proxy.go
// (forwarding and retrying) and health.go (finding out who is alive).
//
// PT: Um balanceador de carga faz quatro coisas a cada requisição: escolhe um back end,
// encaminha a requisição, copia a resposta de volta e, quando o back end falha, decide se
// tenta outro. Este pacote mantém cada um desses passos em seu próprio arquivo, para que
// possam ser lidos um de cada vez: pool.go (quem são os back ends), strategy.go (a escolha),
// proxy.go (encaminhar e tentar de novo) e health.go (descobrir quem está vivo).
//
// ES: Un balanceador de carga hace cuatro cosas en cada solicitud: elige un back end,
// reenvía la solicitud, copia la respuesta de vuelta y, cuando el back end falla, decide si
// prueba otro. Este paquete mantiene cada uno de esos pasos en su propio archivo, para que
// puedan leerse de a uno: pool.go (quiénes son los back ends), strategy.go (la elección),
// proxy.go (reenviar y reintentar) y health.go (descubrir quién está vivo).
package balancer

import (
	"errors"
	"fmt"
	"net/url"
	"sync/atomic"
)

// Backend is one server behind the balancer, with the counters the strategies need.
//
// EN: The fields are atomic because every request runs in its own goroutine, and many of
// them read and change the same back end at the same moment.
//
// PT: Os campos são atômicos porque cada requisição roda em sua própria goroutine, e muitas
// delas leem e alteram o mesmo back end no mesmo instante.
//
// ES: Los campos son atómicos porque cada solicitud corre en su propia goroutine, y muchas
// de ellas leen y modifican el mismo back end en el mismo instante.
type Backend struct {
	URL *url.URL

	healthy  atomic.Bool
	inFlight atomic.Int64
	served   atomic.Int64
}

// Healthy says whether the balancer may choose this back end.
func (b *Backend) Healthy() bool { return b.healthy.Load() }

// SetHealthy puts the back end in or out of rotation.
func (b *Backend) SetHealthy(healthy bool) { b.healthy.Store(healthy) }

// InFlight is the number of requests this balancer has sent and not finished yet.
func (b *Backend) InFlight() int64 { return b.inFlight.Load() }

// Served is the number of requests forwarded to this back end since the start.
func (b *Backend) Served() int64 { return b.served.Load() }

// Pool is the fixed list of back ends.
type Pool struct {
	backends []*Backend
}

// NewPool parses the addresses and starts with every back end healthy.
//
// EN: Starting healthy is a choice: the balancer can serve at once, and a dead back end is
// removed by the first health check or the first failed request. Starting unhealthy would be
// safer and slower: nothing is served until the first round of checks passes.
//
// PT: Começar saudável é uma escolha: o balanceador pode atender na hora, e um back end
// morto é removido pela primeira verificação de saúde ou pela primeira requisição que
// falhar. Começar não saudável seria mais seguro e mais lento: nada é atendido até a
// primeira rodada de verificações passar.
//
// ES: Empezar sano es una elección: el balanceador puede atender de inmediato, y un back end
// caído lo saca la primera verificación de salud o la primera solicitud que falle. Empezar no
// sano sería más seguro y más lento: no se atiende nada hasta que pase la primera ronda de
// verificaciones.
func NewPool(addresses []string) (*Pool, error) {
	if len(addresses) == 0 {
		return nil, errors.New("at least one back end is required")
	}
	pool := &Pool{}
	for _, address := range addresses {
		parsed, err := url.Parse(address)
		if err != nil {
			return nil, fmt.Errorf("back end %q: %w", address, err)
		}
		if parsed.Scheme != "http" || parsed.Host == "" || parsed.Path != "" {
			return nil, fmt.Errorf("back end %q: expected http://host:port", address)
		}
		backend := &Backend{URL: parsed}
		backend.SetHealthy(true)
		pool.backends = append(pool.backends, backend)
	}
	return pool, nil
}

// Backends returns the back ends in configuration order.
func (p *Pool) Backends() []*Backend { return p.backends }

// Status is a snapshot of one back end, for the status endpoint and the tests.
type Status struct {
	Address  string `json:"address"`
	Healthy  bool   `json:"healthy"`
	InFlight int64  `json:"inFlight"`
	Served   int64  `json:"served"`
}

// Snapshot returns the state of every back end.
func (p *Pool) Snapshot() []Status {
	snapshot := make([]Status, 0, len(p.backends))
	for _, backend := range p.backends {
		snapshot = append(snapshot, Status{
			Address:  backend.URL.Host,
			Healthy:  backend.Healthy(),
			InFlight: backend.InFlight(),
			Served:   backend.Served(),
		})
	}
	return snapshot
}
