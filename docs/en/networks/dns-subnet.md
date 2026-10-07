# DNS resolver and subnet calculator

> Versão em português: [docs/pt/networks/dns-subnet.md](../../pt/networks/dns-subnet.md)

Mini-project: [`projects/networks/dns-subnet`](../../../projects/networks/dns-subnet/README.md). Languages: Go and TypeScript. Quiz topics: `networks` / `application-layer` and `networks` / `network-layer`.

## Part 1: how a name is resolved

### The tree and who knows what

DNS is a tree of names split into **zones**, and each zone is served by servers that know only their own piece:

| Server in the lab | Zone | What it knows |
| --- | --- | --- |
| root, 10.253.53.2 | `.` | who serves `test.` |
| TLD, 10.253.53.3 | `test.` | who serves `example.test.`, `elsewhere.test.` and `other.test.` |
| authoritative, 10.253.53.4 | those three domains | the actual records |

No server has the whole answer, and none of them asks another one. A server that does not own the name returns a **referral**: NS records saying who to ask next and, when it has them, the addresses of those servers (**glue**).

### Iterative resolution

The resolver starts knowing one thing: the address of the root server. It asks the same question at each level and follows the referrals. This is the committed trace ([results/resolution.txt](../../../projects/networks/dns-subnet/results/resolution.txt)):

```
1. www.example.test. A
  ask 10.253.53.2     (zone .)  www.example.test. A -> referral: test. is served by ns.test.
  ask 10.253.53.3     (zone test.)  www.example.test. A -> referral: example.test. is served by ns1.example.test.
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 3
```

### The cache and the time to live

Every record carries a TTL chosen by its owner: for how many seconds the answer may be reused. The cache in `go/resolver/cache.go` stores each record set until its shortest TTL runs out and hands records on with the time they have left.

```
2. www.example.test. A
  cache                        www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 0

-- waiting 4s --

3. www.example.test. A
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 1
```

The second question costs no packet. After 4 seconds the address (TTL 3) has expired, but the NS records (TTL 300) have not, so the third question goes straight to the authoritative server: one query instead of three. The cache keeps the upper levels of the tree out of almost every lookup.

The tests check the timing with a fake clock instead of sleeping: at 2.999 s the entry is still served, at 3.000 s it is gone.

### Aliases and referrals without glue

- `api.example.test.` is a CNAME. The resolver stores the alias and resolves the canonical name, which here comes from the cache.
- `other.test.` is delegated to `ns.elsewhere.test.` and the TLD sends no address for it, because that address lives in another zone. The resolver has to stop, resolve the name of the name server (indented in the trace), and then continue.
- `shop.other.test.` is an alias into a different zone. The resolver starts a new resolution for the target.
- `missing.example.test.` gets NXDOMAIN from the server that owns the zone: only an authority can say that a name does not exist.

### What the resolver refuses to believe

The checks are deliberately part of the lesson, because a resolver that trusts everything can have its cache poisoned:

| Check | Where |
| --- | --- |
| The response must come from the address asked (connected socket), repeat a random 16-bit identifier and repeat the question | `exchange` |
| A server is believed only about names inside the zone it was asked as an authority for (bailiwick) | `resolve` |
| Glue is accepted only for the name servers named in the referral | `resolve` |
| Compression pointers may not loop, lengths may not run past the packet | `dnsmsg.Unpack` |

A test runs a lying server that answers correctly and also slips in a record for a name of another zone; the record never reaches the cache.

### Wire format

`go/dnsmsg` implements the real format of RFC 1035 for what the lab needs: the 12-byte header, one question, and records of type A, NS and CNAME in the answer, authority and additional sections. Names are sequences of length-prefixed labels and may end in a compression pointer. Because the format is the real one, the fake servers and the resolver could in principle talk to standard tools, but nothing in the lab is exposed outside its internal network.

## Part 2: how addresses are divided

An IPv4 address is a 32-bit number. A prefix `/n` says that the first n bits identify the network. `ts/src/subnet.ts` derives everything from that:

| Value | How |
| --- | --- |
| mask | n ones followed by 32 - n zeros |
| network | address AND mask |
| broadcast | network OR (NOT mask) |
| hosts | 2^(32 - n) - 2, since network and broadcast are reserved |

Worked example, `192.168.10.77/26`:

```
address    11000000.10101000.00001010.01 001101   192.168.10.77
mask       11111111.11111111.11111111.11 000000   255.255.255.192
network    11000000.10101000.00001010.01 000000   192.168.10.64
broadcast  11000000.10101000.00001010.01 111111   192.168.10.127
hosts      192.168.10.65 to 192.168.10.126        62 addresses
```

Edge cases covered by the table in [results/subnets.md](../../../projects/networks/dns-subnet/results/subnets.md): a `/31` is a point-to-point link with two usable addresses and nothing reserved (RFC 3021), a `/32` is one machine, and `/0` is the whole address space.

### Why TypeScript

The reference language of the repository makes this calculator a lesson of its own. JavaScript bitwise operators work on **signed** 32-bit integers, so `192 << 24` is negative and a mask built naively prints as a negative number. Shift counts are taken modulo 32, so `x << 32` does nothing and `/0` needs a special case. The code uses `>>> 0` to return to unsigned numbers and a test checks all 33 masks bit by bit.

`contains` answers the question a host asks before sending a packet: is the destination in my subnet (deliver directly) or not (send to the router)? `10.20.37.130/22` and `10.20.38.5` are in the same subnet although their third octets differ.

## Limits

- Record types A, NS and CNAME only. No IPv6 records, no SOA, so negative answers are not cached.
- UDP only, messages up to 1500 bytes, no truncation handling and no EDNS.
- No DNSSEC: the bailiwick and identifier checks reduce the room for forgery, they do not prove authenticity.
- The cache is for one goroutine and lives only while the command runs.

## Verifying

```sh
cd projects/networks/dns-subnet
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
docker compose up -d root tld auth
docker compose run --rm -T resolver
docker network inspect dns-subnet_dnslab --format '{{.Internal}}'    # prints true
docker compose down -v
```
