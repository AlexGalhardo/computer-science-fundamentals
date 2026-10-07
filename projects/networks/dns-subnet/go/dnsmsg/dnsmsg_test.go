package dnsmsg

import (
	"errors"
	"net/netip"
	"reflect"
	"testing"
)

func TestPackAndUnpackRoundTrip(t *testing.T) {
	original := Message{
		ID:            0xbeef,
		Response:      true,
		Authoritative: true,
		RCode:         RCodeSuccess,
		Question:      Question{Name: "api.example.test.", Type: TypeA},
		Answer: []Record{
			{Name: "api.example.test.", Type: TypeCNAME, TTL: 60, Target: "www.example.test."},
			{Name: "www.example.test.", Type: TypeA, TTL: 3, Addr: netip.MustParseAddr("192.0.2.10")},
		},
		Authority:  []Record{{Name: "example.test.", Type: TypeNS, TTL: 300, Target: "ns1.example.test."}},
		Additional: []Record{{Name: "ns1.example.test.", Type: TypeA, TTL: 300, Addr: netip.MustParseAddr("192.0.2.53")}},
	}
	packed, err := original.Pack()
	if err != nil {
		t.Fatal(err)
	}
	decoded, err := Unpack(packed)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(original, decoded) {
		t.Fatalf("round trip changed the message:\n got %+v\nwant %+v", decoded, original)
	}
}

// A hand-built response in which the answer's owner name is a compression pointer to the
// question, as real servers send it.
func compressedReply() []byte {
	return []byte{
		0x12, 0x34, 0x84, 0x00, 0, 1, 0, 1, 0, 0, 0, 0, // header: response, authoritative, 1 question, 1 answer
		3, 'W', 'w', 'w', 4, 't', 'e', 's', 't', 0, 0, 1, 0, 1, // question WwW.test. A IN
		0xc0, 12, 0, 1, 0, 1, 0, 0, 0, 9, 0, 4, 192, 0, 2, 7, // answer: pointer to offset 12, A, TTL 9
	}
}

func TestUnpackFollowsCompressionPointersAndLowercases(t *testing.T) {
	decoded, err := Unpack(compressedReply())
	if err != nil {
		t.Fatal(err)
	}
	want := Record{Name: "www.test.", Type: TypeA, TTL: 9, Addr: netip.MustParseAddr("192.0.2.7")}
	if decoded.Question.Name != "www.test." || len(decoded.Answer) != 1 || decoded.Answer[0] != want {
		t.Fatalf("got %+v", decoded)
	}
}

func TestUnpackRejectsPointerLoopsAndTruncation(t *testing.T) {
	loop := compressedReply()
	loop[12], loop[13] = 0xc0, 12 // the question name points at itself
	if _, err := Unpack(loop); !errors.Is(err, ErrMalformed) {
		t.Fatalf("a pointer loop must be rejected, got %v", err)
	}
	whole := compressedReply()
	for size := range len(whole) {
		if _, err := Unpack(whole[:size]); err == nil {
			t.Fatalf("a message cut at %d bytes was accepted", size)
		}
	}
}

func TestNames(t *testing.T) {
	if got := Canonical(" WWW.Example.TEST "); got != "www.example.test." {
		t.Fatalf("Canonical = %q", got)
	}
	parents := []string{}
	for name, ok := "www.example.test.", true; ok; name, ok = Parent(name) {
		parents = append(parents, name)
	}
	if want := []string{"www.example.test.", "example.test.", "test.", "."}; !reflect.DeepEqual(parents, want) {
		t.Fatalf("parents = %v", parents)
	}
	cases := []struct {
		name, zone string
		want       bool
	}{
		{"www.example.test.", "example.test.", true},
		{"example.test.", "example.test.", true},
		{"badexample.test.", "example.test.", false},
		{"anything.at.all.", ".", true},
		{"test.", "example.test.", false},
	}
	for _, c := range cases {
		if got := IsSubdomain(c.name, c.zone); got != c.want {
			t.Errorf("IsSubdomain(%q, %q) = %v", c.name, c.zone, got)
		}
	}
}

func TestPackRejectsBadNames(t *testing.T) {
	if _, err := (Message{Question: Question{Name: "a..test.", Type: TypeA}}).Pack(); err == nil {
		t.Fatal("an empty label must be rejected")
	}
}
