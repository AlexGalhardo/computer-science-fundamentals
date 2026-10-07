# SSRF lab (MP-SEC-5)

> Versão em português: [docs/pt/security/ssrf-lab.md](../../pt/security/ssrf-lab.md)

Mini-project: [`projects/security/ssrf-lab`](../../../projects/security/ssrf-lab/README.md). Quiz topics: `ssrf-path-traversal-upload`, `owasp-threat-modelling`.

This lab is defensive and educational. It runs only locally, in Docker, on internal networks with no published port, and all its data is fake. The vulnerable code exists to be compared with its fix, never to be reused.

## The concept

Server-side request forgery (SSRF) happens when a server makes a network request to a destination chosen by a user. Features that do this are common and legitimate: link previews, webhooks, "import from URL", image fetchers, PDF renderers.

The problem is not the request, it is **where it comes from**. The request leaves from the server, so it has the server's network position: it reaches `localhost`, the private network of the company, and the link-local metadata service of a cloud provider. Many of those destinations have no authentication because "only internal machines can connect". SSRF lends that trust to whoever can type a URL. It has had its own category in the OWASP Top 10 since 2021.

The cure follows from the cause: the application must decide where it is willing to connect, and take that decision on the thing the connection really uses, the numeric address, at every hop.

## The flaw

```ts
const response = await fetch(url); // `url` came from the user
```

The lab has a fake internal service, `internal-admin`, on a private Docker network. It answers a fake token (`FAKE-INTERNAL-TOKEN-not-real`) to anyone who can connect, and only the app can. Two demonstration inputs, built in `ts/src/scenario.ts`:

| Input | Result in the vulnerable app |
| --- | --- |
| `http://internal-admin:8080/secret` | The preview contains the fake token |
| `http://public-site:8080/redirect-to-internal` | The URL names only the fake public site. It answers `302` to the internal service, `fetch` follows the redirect by default, and the preview contains the fake token |

The second input is the reason a check on the first URL is not a fix.

## The lab network

Every container address is private, so the real rule "refuse private addresses" would refuse the fake public site too. The lab keeps the rule honest by giving the "public" side a documentation range:

| Network | Subnet | Services |
| --- | --- | --- |
| `lab` (`internal: true`) | private, chosen by Docker | `internal-admin`, the app |
| `lab-public` (`internal: true`) | `203.0.113.0/24`, TEST-NET-3 (RFC 5737) | `public-site`, the app |

`203.0.113.0/24` is not private and is never routed on the real internet, and the network is internal anyway, so nothing leaves the machine. Inside the lab, `public-site` resolves to a public address and `internal-admin` to a private one, exactly as the classifier expects, and a test asserts it.

## The fix

Every hop of the request passes through the same gate (`ts/src/fixed/fixed-safe-fetch.ts`):

| Layer | What it does | What it does not do |
| --- | --- | --- |
| Zod on the route | Accepts only a URL of at most 2048 characters | Says nothing about where the URL points |
| Scheme check | Only `http` and `https` | |
| Host and port allow-list | Exact comparison on the host parsed by `new URL()`. **The strongest control** when the feature has a known set of destinations | A name on the list may still resolve to an internal address |
| Resolved-address check | Resolves with `node:dns`; every address must be public. Refuses loopback, private, link-local, unspecified and reserved ranges, IPv4 and IPv6, including IPv4 wrapped in IPv6 | Alone, it leaves a gap between check and connection |
| Pinned connection | Connects to the validated address and sends the name in the `Host` header, so the DNS is not asked a second time | |
| Manual redirects | `redirect: "manual"`; each `Location` restarts from the scheme check, up to 3 hops | |
| Limits | One 2 s deadline for all hops and the body; body counted while read, at most 64 KiB | |

The time-of-check/time-of-use gap deserves a note. If the code validates the address of a name and then hands the name to the HTTP client, the client resolves it again, and a DNS server controlled by somebody else may give a different answer the second time (DNS rebinding). The usual answer is to connect to the address that was validated, which is what the pinned connection does.

What does not work: blocklists of strings such as `localhost` (the same address has many spellings, and any DNS name may point inward), validating only the first URL (redirects), `startsWith` or regular expressions on the raw URL, hiding the answer from the user (the request is still made: blind SSRF), and trusting `Content-Length`.

Application checks are one layer. The network should enforce the same rule: an isolated segment or an egress proxy for the component that fetches user URLs, authentication between internal services, and the hardened metadata service in the cloud.

## What the tests prove

One scenario function asks both apps for the same four previews: a public article, a public page that redirects to another public page, the internal URL, and the public URL that redirects to the internal service. The fake internal service counts the requests it receives.

| Item | How it is verified |
| --- | --- |
| MP-SEC-5.1 vulnerable feature and fake internal service on internal networks; a test reaches the internal service through the feature | `tests/scenario.test.ts`, vulnerable block: the direct URL and the redirect both answer `200` with the fake token in the preview, and the internal counter grew by 2. `tests/network-isolation.test.ts`: a request to `http://example.com` fails from inside the container. `docker-compose.yml` publishes no port and both networks are `internal: true` |
| MP-SEC-5.2 the fix blocks the same test, including through a redirect, and normal use works | `tests/scenario.test.ts`, fixed block: both attempts answer `403` (`host-not-allowed`), the internal counter did not move, the public article and the public redirect still answer `200`. Third block: with the internal name wrongly on the allow-list, both attempts answer `403` (`address-not-allowed`) and the counter still does not move. `tests/address-classifier.test.ts`: table of IPv4 and IPv6 addresses. `tests/fixed-safe-fetch.test.ts`: scheme, credentials, allow-list, loopback literals, stub resolver answering internal addresses, pinned connection, redirect limit, size limit, timeout, Zod validation |
| MP-SEC-5.3 definition of done | Setup scripts, demo, both READMEs with "Why the flaw happens", "How to prevent it" and "What does not work as a fix", and this page in both languages |

## Run

```sh
cd projects/security/ssrf-lab
./setup-unix-ssrf-lab.sh              # type check and tests, then clean-up
docker compose run --rm demo          # narrated walk-through
docker compose down -v --remove-orphans
```
