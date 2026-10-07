// Package zone holds the records of one DNS zone and decides how an authoritative server
// answers a question about it.
package zone

import (
	"bufio"
	"fmt"
	"net/netip"
	"strconv"
	"strings"

	"dns-subnet/dnsmsg"
)

// Zone is the part of the name tree that one server answers for.
type Zone struct {
	Origin  string
	records map[string][]dnsmsg.Record // by owner name
}

// Parse reads a zone from a small text format, one record per line:
//
//	$ORIGIN example.test.
//	@    300 NS    ns1
//	ns1  300 A     192.0.2.53
//	www  2   A     192.0.2.10
//	api  60  CNAME www
//
// A name without a final dot is relative to the origin, and @ is the origin itself.
func Parse(text string) (*Zone, error) {
	z := &Zone{records: map[string][]dnsmsg.Record{}}
	scanner := bufio.NewScanner(strings.NewReader(text))
	for line := 1; scanner.Scan(); line++ {
		content, _, _ := strings.Cut(scanner.Text(), "#")
		fields := strings.Fields(content)
		switch {
		case len(fields) == 0:
			continue
		case fields[0] == "$ORIGIN" && len(fields) == 2:
			z.Origin = dnsmsg.Canonical(fields[1])
			continue
		case len(fields) != 4 || z.Origin == "":
			return nil, fmt.Errorf("line %d: want `name ttl type value` after a $ORIGIN line", line)
		}
		ttl, err := strconv.ParseUint(fields[1], 10, 32)
		if err != nil {
			return nil, fmt.Errorf("line %d: invalid TTL %q", line, fields[1])
		}
		kind, err := dnsmsg.ParseType(fields[2])
		if err != nil {
			return nil, fmt.Errorf("line %d: %w", line, err)
		}
		record := dnsmsg.Record{Name: z.absolute(fields[0]), Type: kind, TTL: uint32(ttl)}
		if kind == dnsmsg.TypeA {
			if record.Addr, err = netip.ParseAddr(fields[3]); err != nil || !record.Addr.Is4() {
				return nil, fmt.Errorf("line %d: invalid IPv4 address %q", line, fields[3])
			}
		} else {
			record.Target = z.absolute(fields[3])
		}
		z.records[record.Name] = append(z.records[record.Name], record)
	}
	if z.Origin == "" {
		return nil, fmt.Errorf("the zone has no $ORIGIN line")
	}
	return z, nil
}

func (z *Zone) absolute(name string) string {
	switch {
	case name == "@":
		return z.Origin
	case strings.HasSuffix(name, "."):
		return dnsmsg.Canonical(name)
	case z.Origin == ".":
		return dnsmsg.Canonical(name)
	}
	return dnsmsg.Canonical(name + "." + z.Origin)
}

func (z *Zone) find(name string, kind dnsmsg.Type) []dnsmsg.Record {
	var found []dnsmsg.Record
	for _, record := range z.records[name] {
		if record.Type == kind {
			found = append(found, record)
		}
	}
	return found
}

// delegation looks for NS records between the question name and the origin.
//
// EN: A zone hands part of its tree to other servers by publishing NS records at a name below
// its origin. From that point down this server knows nothing more: all it can do is point to
// the servers that do.
// PT: Uma zona entrega parte da sua árvore a outros servidores publicando registros NS em um
// nome abaixo da sua origem. Daquele ponto para baixo este servidor não sabe mais nada: tudo o
// que ele pode fazer é apontar para os servidores que sabem.
func (z *Zone) delegation(name string) []dnsmsg.Record {
	var cut []dnsmsg.Record
	for current := name; current != z.Origin; {
		if ns := z.find(current, dnsmsg.TypeNS); len(ns) > 0 {
			cut = ns // keep going up: the delegation closest to the origin wins
		}
		parent, ok := dnsmsg.Parent(current)
		if !ok {
			break
		}
		current = parent
	}
	return cut
}

// Answer fills a response to the question.
func (z *Zone) Answer(question dnsmsg.Question) dnsmsg.Message {
	reply := dnsmsg.Message{Response: true, Question: question}
	name := question.Name
	if !dnsmsg.IsSubdomain(name, z.Origin) {
		reply.RCode = dnsmsg.RCodeRefused
		return reply
	}

	// EN: A referral is not an answer. The server is not authoritative for the name, so the
	//     AA flag stays off, the NS records go in the authority section and the addresses of
	//     those servers (the glue) go in the additional section.
	// PT: Uma indicação não é uma resposta. O servidor não tem autoridade sobre o nome, então a
	//     flag AA fica desligada, os registros NS vão na seção authority e os endereços desses
	//     servidores (o glue) vão na seção additional.
	if ns := z.delegation(name); len(ns) > 0 {
		reply.Authority = ns
		for _, server := range ns {
			reply.Additional = append(reply.Additional, z.find(server.Target, dnsmsg.TypeA)...)
		}
		return reply
	}

	reply.Authoritative = true
	if found := z.find(name, question.Type); len(found) > 0 {
		reply.Answer = found
		return reply
	}
	// EN: An alias answers any question about the name: the server returns the CNAME and,
	//     when it also knows the canonical name, the record that was really wanted.
	// PT: Um apelido responde a qualquer pergunta sobre o nome: o servidor devolve o CNAME e,
	//     quando também conhece o nome canônico, o registro que realmente se queria.
	if alias := z.find(name, dnsmsg.TypeCNAME); len(alias) > 0 {
		reply.Answer = append(reply.Answer, alias...)
		reply.Answer = append(reply.Answer, z.find(alias[0].Target, question.Type)...)
		return reply
	}
	if _, exists := z.records[name]; !exists {
		reply.RCode = dnsmsg.RCodeNotFound
	}
	return reply
}
