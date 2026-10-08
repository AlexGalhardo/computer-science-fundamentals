package balancer

import (
	"fmt"
	"sync/atomic"
)

// Strategy chooses the back end of one request.
//
// EN: `usable` says which back ends may be chosen now: the healthy ones that this request
// has not tried yet. A strategy returns nil when none is usable.
//
// PT: `usable` diz quais back ends podem ser escolhidos agora: os saudáveis que esta
// requisição ainda não tentou. Uma estratégia devolve nil quando nenhum é utilizável.
type Strategy interface {
	Pick(backends []*Backend, usable func(*Backend) bool) *Backend
	Name() string
}

func filter(backends []*Backend, usable func(*Backend) bool) []*Backend {
	candidates := make([]*Backend, 0, len(backends))
	for _, backend := range backends {
		if usable(backend) {
			candidates = append(candidates, backend)
		}
	}
	return candidates
}

// RoundRobin walks the list in a circle.
//
// EN: The whole state is one counter. Each request takes the next number, and the number
// modulo the count of usable back ends is the choice. The rotation runs over the USABLE
// back ends, not over the whole list. The obvious shortcut, "start at counter modulo the
// list size and skip the dead ones", is biased: with B down in A, B, C, every request that
// lands on B falls through to C, so C gets two thirds of the traffic. The first version of
// this file did exactly that, and the test caught 34 against 66.
//
// PT: O estado inteiro é um contador. Cada requisição pega o próximo número, e o número
// módulo a quantidade de back ends utilizáveis é a escolha. O rodízio corre sobre os back
// ends UTILIZÁVEIS, não sobre a lista inteira. O atalho óbvio, "começar em contador módulo o
// tamanho da lista e pular os mortos", é viciado: com B fora em A, B, C, toda requisição que
// cai em B escorrega para C, então C recebe dois terços do tráfego. A primeira versão deste
// arquivo fazia exatamente isso, e o teste pegou 34 contra 66.
type RoundRobin struct {
	next atomic.Uint64
}

// Name implements Strategy.
func (*RoundRobin) Name() string { return "round-robin" }

// Pick implements Strategy.
func (r *RoundRobin) Pick(backends []*Backend, usable func(*Backend) bool) *Backend {
	candidates := filter(backends, usable)
	if len(candidates) == 0 {
		return nil
	}
	turn := r.next.Add(1) - 1
	return candidates[turn%uint64(len(candidates))]
}

// LeastConnections chooses the back end with the fewest requests in flight.
//
// EN: Round robin counts requests, and this strategy counts work in progress. They only
// differ when requests take different times: a slow back end keeps its requests longer, so
// its counter stays high and it is chosen less often. Ties are broken in rotation,
// otherwise an idle balancer would send everything to the first back end of the list.
//
// PT: O round robin conta requisições, e esta estratégia conta trabalho em andamento. Elas só
// diferem quando as requisições levam tempos diferentes: um back end lento segura suas
// requisições por mais tempo, então seu contador fica alto e ele é escolhido menos vezes.
// Empates são desfeitos em rodízio, senão um balanceador ocioso mandaria tudo para o
// primeiro back end da lista.
type LeastConnections struct {
	next atomic.Uint64
}

// Name implements Strategy.
func (*LeastConnections) Name() string { return "least-connections" }

// Pick implements Strategy.
func (l *LeastConnections) Pick(backends []*Backend, usable func(*Backend) bool) *Backend {
	candidates := filter(backends, usable)
	if len(candidates) == 0 {
		return nil
	}
	// Keep only the back ends that share the smallest count, then rotate among them.
	lowest := candidates[0].InFlight()
	for _, candidate := range candidates[1:] {
		lowest = min(lowest, candidate.InFlight())
	}
	tied := candidates[:0]
	for _, candidate := range candidates {
		if candidate.InFlight() <= lowest {
			tied = append(tied, candidate)
		}
	}
	turn := l.next.Add(1) - 1
	return tied[turn%uint64(len(tied))]
}

// StrategyByName returns the strategy with the given name.
func StrategyByName(name string) (Strategy, error) {
	switch name {
	case "round-robin":
		return &RoundRobin{}, nil
	case "least-connections":
		return &LeastConnections{}, nil
	default:
		return nil, fmt.Errorf("unknown strategy %q: use round-robin or least-connections", name)
	}
}
