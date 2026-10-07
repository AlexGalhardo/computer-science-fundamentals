package server

import (
	"strings"
	"testing"

	"dns-subnet/dnsmsg"
	"dns-subnet/zone"
)

func testServer(t *testing.T) (*Server, *[]string) {
	t.Helper()
	logs := &[]string{}
	srv := &Server{Log: func(line string) { *logs = append(*logs, line) }}
	for _, text := range []string{
		"$ORIGIN test.\nexample 300 NS ns1.example\nns1.example 300 A 192.0.2.53",
		"$ORIGIN example.test.\nwww 60 A 192.0.2.10",
	} {
		parsed, err := zone.Parse(text)
		if err != nil {
			t.Fatal(err)
		}
		srv.Zones = append(srv.Zones, parsed)
	}
	return srv, logs
}

func query(t *testing.T, srv *Server, name string) dnsmsg.Message {
	t.Helper()
	packet, err := dnsmsg.Message{ID: 77, Question: dnsmsg.Question{Name: name, Type: dnsmsg.TypeA}}.Pack()
	if err != nil {
		t.Fatal(err)
	}
	reply, err := dnsmsg.Unpack(srv.Reply(packet))
	if err != nil {
		t.Fatal(err)
	}
	return reply
}

// A server that holds a zone and its parent answers from the most specific one.
func TestTheLongestMatchingZoneAnswers(t *testing.T) {
	srv, logs := testServer(t)
	reply := query(t, srv, "www.example.test.")
	if reply.ID != 77 || !reply.Response || !reply.Authoritative || len(reply.Answer) != 1 {
		t.Fatalf("reply = %+v", reply)
	}
	if len(*logs) != 1 || !strings.Contains((*logs)[0], "answer") {
		t.Fatalf("logs = %v", *logs)
	}
}

func TestNamesOutsideEveryZoneAreRefused(t *testing.T) {
	srv, _ := testServer(t)
	if reply := query(t, srv, "www.example.org."); reply.RCode != dnsmsg.RCodeRefused {
		t.Fatalf("reply = %+v", reply)
	}
}

func TestGarbageAndResponsesGetNoReply(t *testing.T) {
	srv, _ := testServer(t)
	if reply := srv.Reply([]byte("not a dns message")); reply != nil {
		t.Fatal("garbage was answered")
	}
	// Answering a response would let two servers bounce packets at each other forever.
	response, err := dnsmsg.Message{Response: true, Question: dnsmsg.Question{Name: "www.example.test.", Type: dnsmsg.TypeA}}.Pack()
	if err != nil {
		t.Fatal(err)
	}
	if reply := srv.Reply(response); reply != nil {
		t.Fatal("a response was answered")
	}
}
