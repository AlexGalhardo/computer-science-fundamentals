package resolver

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/netip"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"dns-subnet/dnsmsg"
	"dns-subnet/server"
	"dns-subnet/zone"
)

// The tests run the same three servers as the compose file, in this process, on three
// loopback addresses. On Linux the whole 127.0.0.0/8 block is local, so nothing leaves the
// machine and the tests pass in a container with networking disabled.
const (
	testPort = 5353
	rootAddr = "127.0.0.2"
	liarAddr = "127.0.0.5"
)

func TestMain(m *testing.M) {
	ctx, cancel := context.WithCancel(context.Background())
	hierarchy := map[string][]string{
		rootAddr:    {"root.zone"},
		"127.0.0.3": {"test.zone"},
		"127.0.0.4": {"example.test.zone", "elsewhere.test.zone", "other.test.zone"},
	}
	for addr, files := range hierarchy {
		srv := &server.Server{}
		for _, file := range files {
			text, err := os.ReadFile(filepath.Join("..", "zones", file))
			if err != nil {
				panic(err)
			}
			// The committed zones use the addresses of the compose network.
			parsed, err := zone.Parse(strings.ReplaceAll(string(text), "10.253.53.", "127.0.0."))
			if err != nil {
				panic(err)
			}
			srv.Zones = append(srv.Zones, parsed)
		}
		conn := listen(ctx, addr)
		go func() { _ = srv.Serve(ctx, conn) }()
	}
	go lie(listen(ctx, liarAddr))
	code := m.Run()
	cancel()
	os.Exit(code)
}

func listen(ctx context.Context, addr string) net.PacketConn {
	var config net.ListenConfig
	conn, err := config.ListenPacket(ctx, "udp", fmt.Sprintf("%s:%d", addr, testPort))
	if err != nil {
		panic(err)
	}
	return conn
}

// lie is a server that answers correctly about liar.test. and, in the same reply, tries to
// smuggle in a record for a name of another zone.
func lie(conn net.PacketConn) {
	buf := make([]byte, 1500)
	for {
		n, addr, err := conn.ReadFrom(buf)
		if err != nil {
			return
		}
		query, err := dnsmsg.Unpack(buf[:n])
		if err != nil {
			continue
		}
		reply := dnsmsg.Message{
			ID: query.ID, Response: true, Authoritative: true, Question: query.Question,
			Answer: []dnsmsg.Record{
				{Name: query.Question.Name, Type: dnsmsg.TypeA, TTL: 60, Addr: netip.MustParseAddr("192.0.2.66")},
				{Name: "www.example.test.", Type: dnsmsg.TypeA, TTL: 3600, Addr: netip.MustParseAddr("203.0.113.66")},
			},
		}
		if packed, err := reply.Pack(); err == nil {
			_, _ = conn.WriteTo(packed, addr)
		}
	}
}

type fakeClock struct{ now time.Time }

func (c *fakeClock) Now() time.Time { return c.now }

func (c *fakeClock) advance(d time.Duration) { c.now = c.now.Add(d) }

func newResolver(t *testing.T) (*Resolver, *fakeClock, *[]Step) {
	t.Helper()
	clock := &fakeClock{now: time.Unix(1_800_000_000, 0)}
	r := New([]netip.Addr{netip.MustParseAddr(rootAddr)}, testPort, NewCache(clock.Now))
	steps := &[]Step{}
	r.Trace = func(step Step) { *steps = append(*steps, step) }
	return r, clock, steps
}

func resolve(t *testing.T, r *Resolver, name string) []dnsmsg.Record {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	records, err := r.Resolve(ctx, name, dnsmsg.TypeA)
	if err != nil {
		t.Fatalf("resolving %s: %v", name, err)
	}
	return records
}

func servers(steps []Step) []string {
	asked := make([]string, 0, len(steps))
	for _, step := range steps {
		asked = append(asked, step.Server)
	}
	return asked
}

// Acceptance criterion of MP-NET-3.1: the name is resolved through root, TLD and
// authoritative server, with no external network, and every step is reported.
func TestIterativeResolutionWalksTheHierarchy(t *testing.T) {
	r, _, steps := newResolver(t)
	records := resolve(t, r, "www.example.test")
	if len(records) != 1 || records[0].Addr.String() != "192.0.2.10" {
		t.Fatalf("records = %v", records)
	}
	want := []string{"127.0.0.2", "127.0.0.3", "127.0.0.4"}
	if got := servers(*steps); strings.Join(got, " ") != strings.Join(want, " ") {
		t.Fatalf("servers asked = %v, want %v", got, want)
	}
	for i, prefix := range []string{"referral: test.", "referral: example.test.", "answer: www.example.test."} {
		if outcome := (*steps)[i].Outcome; !strings.HasPrefix(outcome, prefix) {
			t.Errorf("step %d = %q, want it to start with %q", i+1, outcome, prefix)
		}
	}
	if r.Queries != 3 {
		t.Fatalf("queries = %d, want 3", r.Queries)
	}
}

// Acceptance criterion of MP-NET-3.2: a second query is answered from the cache, and the
// entry expires on time.
func TestCacheAnswersTheSecondQueryAndExpiresOnTime(t *testing.T) {
	r, clock, steps := newResolver(t)
	resolve(t, r, "www.example.test") // TTL of the A record: 3 seconds
	sent := r.Queries

	clock.advance(2 * time.Second)
	*steps = nil
	cached := resolve(t, r, "www.example.test")
	if r.Queries != sent || len(*steps) != 1 || (*steps)[0].Server != "cache" {
		t.Fatalf("the second query must come from the cache: queries %d -> %d, steps %v", sent, r.Queries, *steps)
	}
	if cached[0].TTL != 1 {
		t.Fatalf("remaining TTL = %d, want 1", cached[0].TTL)
	}

	clock.advance(999 * time.Millisecond) // 2.999 s: one millisecond before the end
	resolve(t, r, "www.example.test")
	if r.Queries != sent {
		t.Fatal("the entry expired before its TTL")
	}

	clock.advance(time.Millisecond) // exactly 3 s
	*steps = nil
	resolve(t, r, "www.example.test")
	// The A record expired, but the NS records (TTL 300) did not: the resolver goes straight
	// to the authoritative server, with one query instead of three.
	if r.Queries != sent+1 || strings.Join(servers(*steps), " ") != "127.0.0.4" {
		t.Fatalf("after expiry: queries %d -> %d, servers %v", sent, r.Queries, servers(*steps))
	}
}

func TestAliasIsFollowed(t *testing.T) {
	r, _, _ := newResolver(t)
	records := resolve(t, r, "api.example.test")
	if len(records) != 2 || records[0].Type != dnsmsg.TypeCNAME || records[1].Addr.String() != "192.0.2.10" {
		t.Fatalf("records = %v", records)
	}
}

func TestReferralWithoutGlueResolvesTheNameServerFirst(t *testing.T) {
	r, _, steps := newResolver(t)
	records := resolve(t, r, "www.other.test")
	if len(records) != 1 || records[0].Addr.String() != "198.51.100.7" {
		t.Fatalf("records = %v", records)
	}
	nested := false
	for _, step := range *steps {
		if step.Depth == 1 && step.Question.Name == "ns.elsewhere.test." {
			nested = true
		}
	}
	if !nested {
		t.Fatalf("the address of ns.elsewhere.test. was never looked up: %+v", *steps)
	}
}

func TestAliasAcrossZones(t *testing.T) {
	r, _, _ := newResolver(t)
	records := resolve(t, r, "shop.other.test")
	last := records[len(records)-1]
	if records[0].Target != "www.example.test." || last.Addr.String() != "192.0.2.10" {
		t.Fatalf("records = %v", records)
	}
}

func TestMissingNameIsNXDOMAIN(t *testing.T) {
	r, _, _ := newResolver(t)
	_, err := r.Resolve(context.Background(), "missing.example.test", dnsmsg.TypeA)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("err = %v, want ErrNotFound", err)
	}
}

func TestSilentServerGivesAnError(t *testing.T) {
	r, _, _ := newResolver(t)
	r.Roots = []netip.Addr{netip.MustParseAddr("127.0.0.9")} // nobody listens there
	r.Timeout = 50 * time.Millisecond
	_, err := r.Resolve(context.Background(), "www.example.test", dnsmsg.TypeA)
	if !errors.Is(err, ErrNoServer) {
		t.Fatalf("err = %v, want ErrNoServer", err)
	}
}

// A record for a name outside the zone the server was asked about must not enter the cache.
func TestOutOfBailiwickRecordsAreIgnored(t *testing.T) {
	r, _, _ := newResolver(t)
	// The resolver believes liar.test. is served by the lying server.
	r.Cache.Put([]dnsmsg.Record{{Name: "liar.test.", Type: dnsmsg.TypeNS, TTL: 300, Target: "ns.liar.test."}})
	r.Cache.Put([]dnsmsg.Record{{Name: "ns.liar.test.", Type: dnsmsg.TypeA, TTL: 300, Addr: netip.MustParseAddr(liarAddr)}})

	records := resolve(t, r, "www.liar.test")
	if len(records) != 1 || records[0].Addr.String() != "192.0.2.66" {
		t.Fatalf("records = %v", records)
	}
	if _, poisoned := r.Cache.Get("www.example.test.", dnsmsg.TypeA); poisoned {
		t.Fatal("the smuggled record for www.example.test. entered the cache")
	}
	if honest := resolve(t, r, "www.example.test"); honest[0].Addr.String() != "192.0.2.10" {
		t.Fatalf("www.example.test. resolved to %v", honest)
	}
}

func TestCacheRules(t *testing.T) {
	clock := &fakeClock{now: time.Unix(1_800_000_000, 0)}
	cache := NewCache(clock.Now)
	addr := netip.MustParseAddr("192.0.2.1")
	cache.Put([]dnsmsg.Record{{Name: "zero.test.", Type: dnsmsg.TypeA, TTL: 0, Addr: addr}})
	if _, ok := cache.Get("zero.test.", dnsmsg.TypeA); ok {
		t.Fatal("a TTL of zero must not be cached")
	}
	cache.Put([]dnsmsg.Record{
		{Name: "two.test.", Type: dnsmsg.TypeA, TTL: 100, Addr: addr},
		{Name: "two.test.", Type: dnsmsg.TypeA, TTL: 10, Addr: addr},
	})
	clock.advance(10 * time.Second)
	if _, ok := cache.Get("two.test.", dnsmsg.TypeA); ok {
		t.Fatal("a record set must expire with its shortest TTL")
	}
	if _, ok := cache.Get("two.test.", dnsmsg.TypeNS); ok {
		t.Fatal("another type of the same name must not match")
	}
}
