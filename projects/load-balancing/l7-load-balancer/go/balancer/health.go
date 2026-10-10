package balancer

import (
	"context"
	"net/http"
	"sync"
	"time"
)

// Checker is the active health check: it asks every back end, at a fixed interval, whether
// it is alive, with or without client traffic.
//
// EN: The interval is the price of detection. A back end that dies right after a successful
// probe stays in rotation for up to one interval (times FailAfter), unless a failed request
// removes it first. A shorter interval finds failures sooner and costs more probes.
//
// PT: O intervalo é o preço da detecção. Um back end que morre logo depois de uma sonda bem
// sucedida fica em rotação por até um intervalo (vezes FailAfter), a não ser que uma
// requisição com falha o remova antes. Um intervalo menor encontra falhas mais cedo e custa
// mais sondas.
//
// ES: El intervalo es el precio de la detección. Un back end que muere justo después de una
// sonda exitosa permanece en rotación hasta por un intervalo (por FailAfter), a menos que una
// solicitud fallida lo saque antes. Un intervalo menor encuentra fallas antes y cuesta más
// sondas.
type Checker struct {
	Pool     *Pool
	Path     string
	Interval time.Duration
	Timeout  time.Duration
	// FailAfter consecutive failed probes take a back end out. PassAfter consecutive
	// successful probes put it back.
	FailAfter int
	PassAfter int

	client *http.Client
	counts []probeCount
}

type probeCount struct{ passes, fails int }

// NewChecker returns a checker that removes a back end after one failed probe and restores
// it after one successful probe.
func NewChecker(pool *Pool, path string, interval, timeout time.Duration) *Checker {
	return &Checker{
		Pool:      pool,
		Path:      path,
		Interval:  interval,
		Timeout:   timeout,
		FailAfter: 1,
		PassAfter: 1,
		client:    &http.Client{Timeout: timeout},
		counts:    make([]probeCount, len(pool.Backends())),
	}
}

// Run probes until the context is cancelled.
func (c *Checker) Run(ctx context.Context) {
	ticker := time.NewTicker(c.Interval)
	defer ticker.Stop()
	for {
		c.CheckOnce(ctx)
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// CheckOnce probes every back end once, all at the same time, and waits for the answers.
func (c *Checker) CheckOnce(ctx context.Context) {
	var wait sync.WaitGroup
	for index, backend := range c.Pool.Backends() {
		wait.Go(func() {
			c.record(index, backend, c.probe(ctx, backend))
		})
	}
	wait.Wait()
}

// EN: Alive means "answers 200 on the health path in time". An open port is not enough: a
// process can accept connections and still be unable to answer.
// PT: Vivo significa "responde 200 no caminho de saúde a tempo". Uma porta aberta não basta:
// um processo pode aceitar conexões e ainda assim não conseguir responder.
// ES: Vivo significa "responde 200 en la ruta de salud a tiempo". Un puerto abierto no basta:
// un proceso puede aceptar conexiones y aun así no poder responder.
func (c *Checker) probe(ctx context.Context, backend *Backend) bool {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, backend.URL.String()+c.Path, http.NoBody)
	if err != nil {
		return false
	}
	response, err := c.client.Do(request)
	if err != nil {
		return false
	}
	defer response.Body.Close() //nolint:errcheck // nothing useful to do with a close error
	return response.StatusCode == http.StatusOK
}

// EN: Requiring several results in a row before changing the state avoids flapping: a back
// end that answers one probe in two would otherwise enter and leave the rotation forever.
// PT: Exigir vários resultados seguidos antes de mudar o estado evita o flapping: um back end
// que responde uma sonda em cada duas entraria e sairia da rotação para sempre.
// ES: Exigir varios resultados seguidos antes de cambiar el estado evita el flapping: un back
// end que responde una sonda de cada dos entraría y saldría de la rotación para siempre.
func (c *Checker) record(index int, backend *Backend, alive bool) {
	count := &c.counts[index]
	if alive {
		count.passes++
		count.fails = 0
		if count.passes >= c.PassAfter {
			backend.SetHealthy(true)
		}
		return
	}
	count.fails++
	count.passes = 0
	if count.fails >= c.FailAfter {
		backend.SetHealthy(false)
	}
}
