// Package server is a tiny authoritative DNS server over UDP for the fake hierarchy of the lab.
package server

import (
	"context"
	"errors"
	"fmt"
	"net"

	"dns-subnet/dnsmsg"
	"dns-subnet/zone"
)

// Server answers questions about the zones it holds. It never asks anybody else: an
// authoritative server only knows its own data and its own delegations.
type Server struct {
	Zones []*zone.Zone
	Log   func(line string) // optional, called once per query
}

// pick chooses the zone with the longest origin that contains the name.
func (s *Server) pick(name string) *zone.Zone {
	var best *zone.Zone
	for _, z := range s.Zones {
		if dnsmsg.IsSubdomain(name, z.Origin) && (best == nil || len(z.Origin) > len(best.Origin)) {
			best = z
		}
	}
	return best
}

// Reply builds the response to one query packet. It returns nil for packets that deserve no
// answer at all.
func (s *Server) Reply(packet []byte) []byte {
	query, err := dnsmsg.Unpack(packet)
	if err != nil || query.Response {
		return nil
	}
	reply := dnsmsg.Message{Response: true, Question: query.Question, RCode: dnsmsg.RCodeRefused}
	if z := s.pick(query.Question.Name); z != nil {
		reply = z.Answer(query.Question)
	}
	// EN: The response repeats the identifier of the query. It is how the client matches
	//     answers to questions, and one of the things it checks before trusting a packet.
	// PT: A resposta repete o identificador da consulta. É assim que o cliente associa
	//     respostas a perguntas, e uma das coisas que ele confere antes de confiar em um pacote.
	reply.ID = query.ID
	if s.Log != nil {
		s.Log(fmt.Sprintf("%s %s -> %s", query.Question.Name, query.Question.Type, describe(reply)))
	}
	packed, err := reply.Pack()
	if err != nil {
		return nil
	}
	return packed
}

func describe(reply dnsmsg.Message) string {
	switch {
	case reply.RCode == dnsmsg.RCodeNotFound:
		return "NXDOMAIN"
	case reply.RCode != dnsmsg.RCodeSuccess:
		return fmt.Sprintf("rcode %d", reply.RCode)
	case len(reply.Answer) > 0:
		return fmt.Sprintf("answer (%d records)", len(reply.Answer))
	case len(reply.Authority) > 0:
		return "referral to " + reply.Authority[0].Name
	}
	return "no data"
}

// Serve answers queries arriving on conn until the context is cancelled.
func (s *Server) Serve(ctx context.Context, conn net.PacketConn) error {
	stop := context.AfterFunc(ctx, func() { _ = conn.Close() })
	defer stop()
	buf := make([]byte, 1500)
	for {
		n, addr, err := conn.ReadFrom(buf)
		if err != nil {
			if ctx.Err() != nil || errors.Is(err, net.ErrClosed) {
				return nil
			}
			return fmt.Errorf("reading a query: %w", err)
		}
		if reply := s.Reply(buf[:n]); reply != nil {
			if _, err := conn.WriteTo(reply, addr); err != nil {
				return fmt.Errorf("writing a reply: %w", err)
			}
		}
	}
}
