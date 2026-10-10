# dns-subnet

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

How names are resolved and how addresses are divided. Two tools:

1. An **iterative DNS resolver** in Go, with a cache that respects the time to live, working against a fake hierarchy of root, TLD and authoritative servers that are also part of the project. It speaks the real DNS wire format over UDP and prints every step.
2. A **subnet calculator** in TypeScript: network, broadcast, host range and mask for any IPv4 CIDR.

Full explanation: [docs/en/networks/dns-subnet.md](../../../docs/en/networks/dns-subnet.md).

## Everything is local

The lab never talks to a real DNS server. The three name servers and the resolver run on a docker-compose network marked `internal: true`, which has no route to the outside, and no port is published. The zones are fake: the TLD is `test` (reserved by RFC 2606) and the addresses in the answers come from the documentation ranges of RFC 5737. The only address the resolver is given is the fake root server.

## Quiz topics it demonstrates

- `networks` / `application-layer`: purpose of DNS, record types (A, NS, CNAME), iterative resolution, caching and time to live
- `networks` / `network-layer`: subnets and CIDR, network and broadcast addresses, number of hosts, whether two addresses share a subnet

## Run

The only requirement is Docker.

```sh
./setup-unix-dns-subnet.sh        # Linux and macOS
./setup-windows-dns-subnet.ps1    # Windows
```

The script builds the images and runs the tests of both languages.

## Demo

DNS lab:

```sh
docker compose up -d root tld auth        # the three fake name servers
docker compose run --rm -T resolver       # resolves seven names, printing each step
docker compose logs root tld auth         # what each server was asked
docker compose down -v                    # removes containers and the network
```

Subnet calculator:

```sh
docker compose run --rm -T ts-subnet                                        # the table of cases
docker compose run --rm -T ts-subnet bun run src/cli.ts 192.168.10.77/26    # any CIDR
```

Committed output: [results/resolution.txt](results/resolution.txt) and [results/subnets.md](results/subnets.md).

To resolve other names of the fake zones, pass them to the resolver. `wait=5s` pauses, which lets cached records expire:

```sh
docker compose run --rm -T resolver resolve -roots 10.253.53.2 mail.example.test wait=5s mail.example.test
```

## Structure

| Path | What it is |
| --- | --- |
| `go/dnsmsg` | DNS wire format: header, question, records A, NS and CNAME, name compression |
| `go/zone` | zone file parser and the logic of an authoritative answer or a referral |
| `go/server` | UDP name server holding one or more zones |
| `go/resolver` | iterative resolver and TTL cache |
| `go/cmd/nameserver`, `go/cmd/resolve` | the two commands used by the compose file |
| `go/zones` | the fake zones |
| `ts/src/subnet.ts` | the subnet calculator |
| `ts/src/cases.ts` | table of CIDR cases worked out by hand |
| `results/` | committed outputs |

Go carries the DNS part because it is about sockets and a binary protocol. TypeScript carries the subnet calculator, where the lesson is bit arithmetic and the traps of 32-bit operators in JavaScript.

## Tests

```sh
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
```

The Go tests start the same three servers inside the test process, on loopback addresses, so they also run with networking disabled. They cover the wire format (including hostile packets), referrals with and without glue, the walk from root to authoritative server, the cache answering a second query and expiring exactly on time (with a fake clock), aliases, missing names, and the rejection of records a server has no authority over. The TypeScript tests compare the calculator with the table of cases.
