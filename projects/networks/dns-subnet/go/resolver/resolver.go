package resolver

import (
	"context"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"net"
	"net/netip"
	"strings"
	"time"

	"dns-subnet/dnsmsg"
)

// Errors a resolution can end with.
var (
	ErrNotFound = errors.New("the name does not exist (NXDOMAIN)")
	ErrNoData   = errors.New("the name exists but has no record of this type")
	ErrNoServer = errors.New("no name server answered")
)

const (
	maxReferrals = 12
	maxDepth     = 8
	attempts     = 2
)

// Step is one thing the resolver did, reported through Trace.
type Step struct {
	Depth    int
	Server   string // address asked, or "cache"
	Zone     string // zone the server was asked as an authority for
	Question dnsmsg.Question
	Outcome  string
}

// Resolver finds records by walking the DNS tree from the root down.
type Resolver struct {
	Roots   []netip.Addr // the only addresses known in advance: the root hints
	Port    uint16
	Timeout time.Duration
	Cache   *Cache
	Trace   func(Step)
	Queries int // packets sent, to show what the cache saved
}

// New creates a resolver that starts from the given root servers.
func New(roots []netip.Addr, port uint16, cache *Cache) *Resolver {
	return &Resolver{Roots: roots, Port: port, Timeout: time.Second, Cache: cache}
}

func (r *Resolver) trace(depth int, server, zone string, question dnsmsg.Question, outcome string) {
	if r.Trace != nil {
		r.Trace(Step{Depth: depth, Server: server, Zone: zone, Question: question, Outcome: outcome})
	}
}

// Resolve returns the records of the given type for name, following aliases.
func (r *Resolver) Resolve(ctx context.Context, name string, kind dnsmsg.Type) ([]dnsmsg.Record, error) {
	return r.resolve(ctx, dnsmsg.Question{Name: dnsmsg.Canonical(name), Type: kind}, 0)
}

func filter(records []dnsmsg.Record, name string, kind dnsmsg.Type) []dnsmsg.Record {
	var found []dnsmsg.Record
	for _, record := range records {
		if record.Name == name && record.Type == kind {
			found = append(found, record)
		}
	}
	return found
}

func addresses(records []dnsmsg.Record) []netip.Addr {
	addrs := make([]netip.Addr, 0, len(records))
	for _, record := range records {
		addrs = append(addrs, record.Addr)
	}
	return addrs
}

func list(records []dnsmsg.Record) string {
	parts := make([]string, 0, len(records))
	for _, record := range records {
		parts = append(parts, record.String())
	}
	return strings.Join(parts, "; ")
}

// closest finds the deepest zone whose name servers are already in the cache.
//
// EN: The resolver does not start from the root every time. If it already knows who serves
// example.test., a question about www.example.test. goes straight there. This is why the
// root and TLD servers survive the load of the whole Internet: caches absorb most of it.
// PT: O resolvedor não começa da raiz todas as vezes. Se ele já sabe quem serve example.test.,
// uma pergunta sobre www.example.test. vai direto para lá. É por isso que os servidores raiz e
// de TLD aguentam a carga da Internet inteira: os caches absorvem a maior parte dela.
func (r *Resolver) closest(name string) (string, []netip.Addr) {
	for zone := name; ; {
		if servers, ok := r.Cache.Get(zone, dnsmsg.TypeNS); ok {
			var addrs []netip.Addr
			for _, server := range servers {
				if glue, ok := r.Cache.Get(server.Target, dnsmsg.TypeA); ok {
					addrs = append(addrs, addresses(glue)...)
				}
			}
			if len(addrs) > 0 {
				return zone, addrs
			}
		}
		parent, ok := dnsmsg.Parent(zone)
		if !ok {
			return ".", r.Roots
		}
		zone = parent
	}
}

func (r *Resolver) resolve(ctx context.Context, question dnsmsg.Question, depth int) ([]dnsmsg.Record, error) {
	if depth > maxDepth {
		return nil, fmt.Errorf("resolving %s: too many aliases or name servers to chase", question.Name)
	}
	if cached, ok := r.Cache.Get(question.Name, question.Type); ok {
		r.trace(depth, "cache", "", question, "answer: "+list(cached))
		return cached, nil
	}
	if alias, ok := r.Cache.Get(question.Name, dnsmsg.TypeCNAME); ok && question.Type != dnsmsg.TypeCNAME {
		r.trace(depth, "cache", "", question, "alias: "+list(alias))
		return r.follow(ctx, alias, question.Type, depth)
	}

	zone, servers := r.closest(question.Name)
	for range maxReferrals {
		reply, server, err := r.ask(ctx, servers, zone, question, depth)
		if err != nil {
			return nil, err
		}
		switch reply.RCode {
		case dnsmsg.RCodeSuccess:
		case dnsmsg.RCodeNotFound:
			r.trace(depth, server, zone, question, "NXDOMAIN: the name does not exist")
			return nil, fmt.Errorf("%s: %w", question.Name, ErrNotFound)
		default:
			return nil, fmt.Errorf("%s answered %s with rcode %d", server, question.Name, reply.RCode)
		}

		// EN: Bailiwick check. A server is believed only about names inside the zone it was
		//     asked as an authority for. Without this rule any server could slip a record for
		//     some unrelated name into its reply and poison the cache.
		// PT: Verificação de bailiwick. Um servidor só é acreditado sobre nomes dentro da zona
		//     pela qual foi consultado como autoridade. Sem essa regra qualquer servidor poderia
		//     embutir na resposta um registro de um nome alheio e envenenar o cache.
		var answers []dnsmsg.Record
		for _, record := range reply.Answer {
			if dnsmsg.IsSubdomain(record.Name, zone) {
				answers = append(answers, record)
			}
		}

		if direct := filter(answers, question.Name, question.Type); len(direct) > 0 {
			r.Cache.Put(direct)
			r.trace(depth, server, zone, question, "answer: "+list(direct))
			return direct, nil
		}
		if alias := filter(answers, question.Name, dnsmsg.TypeCNAME); len(alias) > 0 {
			r.Cache.Put(alias)
			r.Cache.Put(filter(answers, alias[0].Target, question.Type))
			r.trace(depth, server, zone, question, "alias: "+list(alias))
			return r.follow(ctx, alias, question.Type, depth)
		}

		var delegation []dnsmsg.Record
		for _, record := range reply.Authority {
			inside := dnsmsg.IsSubdomain(record.Name, zone) && record.Name != zone
			if record.Type == dnsmsg.TypeNS && inside && dnsmsg.IsSubdomain(question.Name, record.Name) {
				delegation = append(delegation, record)
			}
		}
		if len(delegation) == 0 {
			r.trace(depth, server, zone, question, "no data")
			return nil, fmt.Errorf("%s %s: %w", question.Name, question.Type, ErrNoData)
		}
		child := delegation[0].Name
		delegation = filter(delegation, child, dnsmsg.TypeNS)
		r.Cache.Put(delegation)

		// EN: Glue: the addresses of the next name servers, sent along with the referral.
		//     Without glue for ns1.example.test. the resolver would have to ask
		//     example.test. where its own name server is, which is a circle.
		// PT: Glue: os endereços dos próximos servidores de nomes, enviados junto com a
		//     indicação. Sem glue para ns1.example.test. o resolvedor teria de perguntar a
		//     example.test. onde está o seu próprio servidor de nomes, o que é um círculo.
		var next []netip.Addr
		var names []string
		for _, ns := range delegation {
			names = append(names, ns.Target)
			if glue := filter(reply.Additional, ns.Target, dnsmsg.TypeA); len(glue) > 0 && dnsmsg.IsSubdomain(ns.Target, zone) {
				r.Cache.Put(glue)
				next = append(next, addresses(glue)...)
			}
		}
		r.trace(depth, server, zone, question, fmt.Sprintf("referral: %s is served by %s", child, strings.Join(names, ", ")))

		// A referral without glue: the address of the name server has to be resolved first.
		for i := 0; len(next) == 0 && i < len(delegation); i++ {
			found, err := r.resolve(ctx, dnsmsg.Question{Name: delegation[i].Target, Type: dnsmsg.TypeA}, depth+1)
			if err == nil {
				next = addresses(filter(found, found[len(found)-1].Name, dnsmsg.TypeA))
			}
		}
		if len(next) == 0 {
			return nil, fmt.Errorf("no address for the name servers of %s: %w", child, ErrNoServer)
		}
		zone, servers = child, next
	}
	return nil, fmt.Errorf("resolving %s: too many referrals", question.Name)
}

// follow resolves the target of an alias and returns the alias followed by what it leads to.
func (r *Resolver) follow(ctx context.Context, alias []dnsmsg.Record, kind dnsmsg.Type, depth int) ([]dnsmsg.Record, error) {
	rest, err := r.resolve(ctx, dnsmsg.Question{Name: alias[0].Target, Type: kind}, depth+1)
	if err != nil {
		return nil, err
	}
	return append(append([]dnsmsg.Record(nil), alias...), rest...), nil
}

// ask sends the question to the servers in turn until one of them answers.
func (r *Resolver) ask(ctx context.Context, servers []netip.Addr, zone string, question dnsmsg.Question, depth int) (dnsmsg.Message, string, error) {
	for range attempts {
		for _, server := range servers {
			reply, err := r.exchange(ctx, server, question)
			if err == nil {
				return reply, server.String(), nil
			}
			if ctx.Err() != nil {
				return dnsmsg.Message{}, "", ctx.Err()
			}
			r.trace(depth, server.String(), zone, question, "no answer: "+err.Error())
		}
	}
	return dnsmsg.Message{}, "", fmt.Errorf("%s: %w", question.Name, ErrNoServer)
}

// exchange sends one query over UDP and waits for the matching response.
func (r *Resolver) exchange(ctx context.Context, server netip.Addr, question dnsmsg.Question) (dnsmsg.Message, error) {
	// EN: The identifier is random and unpredictable. A response is accepted only if it comes
	//     from the address that was asked (the socket is connected), repeats the identifier
	//     and repeats the question. Guessing all of that is what an off-path forger would need.
	// PT: O identificador é aleatório e imprevisível. Uma resposta só é aceita se vier do
	//     endereço consultado (o socket é conectado), repetir o identificador e repetir a
	//     pergunta. Adivinhar tudo isso é o que um falsificador fora do caminho precisaria.
	var id [2]byte
	if _, err := rand.Read(id[:]); err != nil {
		return dnsmsg.Message{}, fmt.Errorf("choosing a query id: %w", err)
	}
	query := dnsmsg.Message{ID: binary.BigEndian.Uint16(id[:]), Question: question}
	packet, err := query.Pack()
	if err != nil {
		return dnsmsg.Message{}, err
	}

	var dialer net.Dialer
	conn, err := dialer.DialContext(ctx, "udp", netip.AddrPortFrom(server, r.Port).String())
	if err != nil {
		return dnsmsg.Message{}, err
	}
	defer func() { _ = conn.Close() }()
	if err := conn.SetDeadline(time.Now().Add(r.Timeout)); err != nil {
		return dnsmsg.Message{}, err
	}
	r.Queries++
	if _, err := conn.Write(packet); err != nil {
		return dnsmsg.Message{}, err
	}
	buf := make([]byte, 1500)
	for {
		n, err := conn.Read(buf)
		if err != nil {
			return dnsmsg.Message{}, err
		}
		reply, err := dnsmsg.Unpack(buf[:n])
		if err == nil && reply.Response && reply.ID == query.ID && reply.Question == question {
			return reply, nil
		}
	}
}
