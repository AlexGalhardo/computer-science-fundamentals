package zone

import (
	"os"
	"path/filepath"
	"testing"

	"dns-subnet/dnsmsg"
)

func load(t *testing.T, file string) *Zone {
	t.Helper()
	text, err := os.ReadFile(filepath.Join("..", "zones", file))
	if err != nil {
		t.Fatal(err)
	}
	z, err := Parse(string(text))
	if err != nil {
		t.Fatalf("%s: %v", file, err)
	}
	return z
}

func ask(z *Zone, name string) dnsmsg.Message {
	return z.Answer(dnsmsg.Question{Name: name, Type: dnsmsg.TypeA})
}

func TestEveryCommittedZoneParses(t *testing.T) {
	origins := map[string]string{
		"root.zone":           ".",
		"test.zone":           "test.",
		"example.test.zone":   "example.test.",
		"elsewhere.test.zone": "elsewhere.test.",
		"other.test.zone":     "other.test.",
	}
	for file, origin := range origins {
		if got := load(t, file).Origin; got != origin {
			t.Errorf("%s: origin %q, want %q", file, got, origin)
		}
	}
}

func TestRootRefersToTheTLDWithGlue(t *testing.T) {
	reply := ask(load(t, "root.zone"), "www.example.test.")
	if reply.Authoritative || len(reply.Answer) != 0 {
		t.Fatalf("a referral must not be authoritative or carry answers: %+v", reply)
	}
	if len(reply.Authority) != 1 || reply.Authority[0].Name != "test." || reply.Authority[0].Target != "ns.test." {
		t.Fatalf("authority = %v", reply.Authority)
	}
	if len(reply.Additional) != 1 || reply.Additional[0].Name != "ns.test." {
		t.Fatalf("glue = %v", reply.Additional)
	}
}

func TestTLDRefersWithAndWithoutGlue(t *testing.T) {
	tld := load(t, "test.zone")
	withGlue := ask(tld, "www.example.test.")
	if len(withGlue.Authority) != 1 || withGlue.Authority[0].Name != "example.test." || len(withGlue.Additional) != 1 {
		t.Fatalf("referral with glue: %+v", withGlue)
	}
	glueless := ask(tld, "www.other.test.")
	if len(glueless.Authority) != 1 || glueless.Authority[0].Target != "ns.elsewhere.test." || len(glueless.Additional) != 0 {
		t.Fatalf("referral without glue: %+v", glueless)
	}
	// The name server of the TLD itself is ordinary data of the zone, not a delegation.
	own := ask(tld, "ns.test.")
	if !own.Authoritative || len(own.Answer) != 1 {
		t.Fatalf("own data: %+v", own)
	}
}

func TestAuthoritativeAnswers(t *testing.T) {
	z := load(t, "example.test.zone")

	direct := ask(z, "www.example.test.")
	if !direct.Authoritative || len(direct.Answer) != 1 || direct.Answer[0].Addr.String() != "192.0.2.10" || direct.Answer[0].TTL != 3 {
		t.Fatalf("direct answer: %+v", direct)
	}
	alias := ask(z, "api.example.test.")
	if len(alias.Answer) != 2 || alias.Answer[0].Type != dnsmsg.TypeCNAME || alias.Answer[1].Name != "www.example.test." {
		t.Fatalf("alias answer: %+v", alias)
	}
	missing := ask(z, "missing.example.test.")
	if missing.RCode != dnsmsg.RCodeNotFound || !missing.Authoritative {
		t.Fatalf("missing name: %+v", missing)
	}
	noData := z.Answer(dnsmsg.Question{Name: "www.example.test.", Type: dnsmsg.TypeNS})
	if noData.RCode != dnsmsg.RCodeSuccess || len(noData.Answer) != 0 {
		t.Fatalf("existing name, other type: %+v", noData)
	}
	outside := ask(z, "www.other.test.")
	if outside.RCode != dnsmsg.RCodeRefused {
		t.Fatalf("a name outside the zone must be refused: %+v", outside)
	}
}

func TestParseErrors(t *testing.T) {
	for _, text := range []string{
		"www 60 A 192.0.2.1",                         // no $ORIGIN
		"$ORIGIN test.\nwww sixty A 192.0.2.1",       // bad TTL
		"$ORIGIN test.\nwww 60 MX mail",              // unsupported type
		"$ORIGIN test.\nwww 60 A not-an-address",     // bad address
		"$ORIGIN test.\nwww 60 A 192.0.2.1 trailing", // too many fields
	} {
		if _, err := Parse(text); err == nil {
			t.Errorf("zone accepted but should not be:\n%s", text)
		}
	}
}
