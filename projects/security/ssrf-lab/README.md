# ssrf-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A defensive, local lab about server-side request forgery (SSRF): how a server can be tricked into calling internal services. The same small ElysiaJS feature (a "link preview" that fetches a URL given by the user and returns part of the page) exists twice: a version that fetches anything, labelled `vulnerable`, and a fixed version with a host allow-list, scheme validation, validation of the resolved address, redirects re-validated hop by hop, a size limit and a timeout. One scenario runs against both, with a fake internal service and a fake public site on internal Docker networks.

Code: MP-SEC-5. Full explanation: [docs/en/security/ssrf-lab.md](../../../docs/en/security/ssrf-lab.md).

> The code in `ts/src/vulnerable/` is vulnerable on purpose. It exists only to be studied inside this lab. Never copy it and never import it from another project.

## Quiz topics it demonstrates

- `security` / `ssrf-path-traversal-upload`: what SSRF is, why the server's position in the network is the problem, allow-lists, validation of the resolved address, redirects
- `security` / `owasp-threat-modelling`: SSRF in the OWASP Top 10, trust boundaries ("internal" is not the same as "trusted"), defence in depth

## Run

The only requirement is Docker.

```sh
./setup-unix-ssrf-lab.sh        # Linux and macOS
./setup-windows-ssrf-lab.ps1    # Windows
```

The script builds the image, starts the two fake services, runs the type check and the tests, and removes the containers and networks at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

It prints a narrated walk-through, in English and Portuguese: the four URLs of the scenario, the addresses the two host names resolve to and how the fix classifies them, the scenario against the vulnerable app (the fake token leaks, directly and through a redirect), the same scenario against the fixed app (both attempts refused, normal previews work), and the address check still refusing when the allow-list is misconfigured.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| File | What it proves |
| --- | --- |
| `ts/tests/scenario.test.ts` | Vulnerable app: the internal service is reached through the feature and its fake token appears in the preview, directly and through a public URL that answers 302. Fixed app: the same two requests answer 403, the internal service receives **no request at all** (it counts them), and a normal preview and a redirect between public pages still work. A third block adds the internal name to the allow-list by mistake and shows the address check refusing it anyway |
| `ts/tests/fixed-safe-fetch.test.ts` | One test per layer of the fix: scheme, credentials in the URL, host and port allow-list, loopback literals, a name that resolves to an internal address (stub resolver), several addresses with one internal, connection to the validated address, redirect limit, size limit, timeout, and the Zod validation of the route |
| `ts/tests/address-classifier.test.ts` | A table of IPv4 and IPv6 addresses and the class each one gets: loopback, private, link-local, unspecified, reserved, public, including IPv4 addresses wrapped in IPv6 |
| `ts/tests/network-isolation.test.ts` | A request from inside the container to an external host fails |

## Structure

| Path | What it is |
| --- | --- |
| `docker-compose.yml` | Two networks, both `internal: true`, and four services: `internal-admin`, `public-site`, `ts-test`, `demo` |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable on purpose**: `POST /preview` that calls `fetch(url)` with no check |
| `ts/src/fixed/fixed-app.ts` | The same route with Zod validation and the fetch policy |
| `ts/src/fixed/fixed-safe-fetch.ts` | The safe fetch: scheme, allow-list, resolved address, pinned connection, manual redirects, limits |
| `ts/src/fixed/fixed-address-classifier.ts` | Classifies an IPv4 or IPv6 address (loopback, private, link-local and so on) |
| `ts/src/lab-services/internal-admin.ts` | Fake internal service with a fake token and no login |
| `ts/src/lab-services/public-site.ts` | Fake public site: an article, redirects, a huge body, a slow answer |
| `ts/src/scenario.ts` | The one scenario that runs against both apps, in-process |
| `ts/src/demo.ts` | The narrated demo |
| `ts/src/config.ts`, `ts/src/preview.ts` | Validated environment, shared types, how a preview is cut out of a page |

Route of both apps: `POST /preview` with `{ "url": "<URL>" }`. The answer has the title and the first 200 characters of the page.

### The network of the lab

| Network | Subnet | Who is there | Role |
| --- | --- | --- | --- |
| `lab` | private, chosen by Docker (RFC 1918) | `internal-admin`, `ts-test`, `demo` | The company network |
| `lab-public` | `203.0.113.0/24` (TEST-NET-3) | `public-site`, `ts-test`, `demo` | Stand-in for the internet |

Every container address is private by default, so "refuse private addresses" would refuse the fake public site too. Instead of weakening the rule for the lab, the "public" network uses a documentation range (RFC 5737) that is not private and is never routed on the real internet. The address rule in the code is the real one, unchanged. Both networks are `internal: true`: the range is only a label, and nothing leaves the machine.

## Why the flaw happens

The vulnerable code is one line:

```ts
const response = await fetch(url); // `url` came from the user
```

The request does not leave from the user's browser. It leaves from the **server**, and it carries the server's place in the network. A server usually reaches things the user cannot: other services of the company with no login "because they are internal", an admin panel bound to `localhost`, the metadata service of a cloud provider on a link-local address. Those services trust the network: whoever can connect is assumed to be a colleague. SSRF turns the server into the user's messenger inside that network, so the trust is lent to a stranger.

In the lab, `internal-admin` answers a fake token to anyone who can connect, and only the app can connect. The scenario in `ts/src/scenario.ts` uses two demonstration inputs:

| Input | What happens in the vulnerable app |
| --- | --- |
| `http://internal-admin:8080/secret` | The server fetches the internal service and returns the first characters of the answer, which contain the fake token |
| `http://public-site:8080/redirect-to-internal` | The URL names only the public site. That site answers `302` with `Location: http://internal-admin:8080/secret`, `fetch` follows it by default, and the token leaks the same way |

Showing the answer is not even necessary for harm. A request that reaches an internal route can change state just by being made (blind SSRF), and it can be used to find out which internal hosts and ports exist. That is why the tests check that the fixed app makes **no request**, not only that it shows no token.

Two other mistakes make it worse: there is no limit on the size of the answer and no timeout, so one request can hold a connection and memory of the server for as long as the remote side wants.

## How to prevent it

The fixed version (`ts/src/fixed/fixed-safe-fetch.ts`) puts every hop of the request through the same gate.

1. **Ask whether the feature needs arbitrary URLs at all.** The strongest control is an **allow-list of host names**: the feature fetches only the sites it was built for. In the lab that list has one entry, the fake public site. The comparison is exact and made on the host name returned by the URL parser, never with `includes` or `endsWith` on the raw text.
2. **Accept only `http` and `https`.** A server-side `fetch` understands more than the web. In Bun, for example, a `file:` URL reads the disk of the server.
3. **Validate the resolved address, not the name.** The host name is resolved with `node:dns` and **every** address returned must be public. Loopback (`127.0.0.0/8`, `::1`), private (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), link-local (`169.254/16`, `fe80::/10`), unspecified (`0.0.0.0`, `::`) and reserved ranges are refused, in IPv4 and IPv6, including IPv4 addresses wrapped in IPv6 (`::ffff:a.b.c.d`). The rule is "only public passes", not a list of what is forbidden.
4. **Connect to the address that was validated.** See the section on DNS below.
5. **Follow redirects by hand.** With `redirect: "manual"`, a `3xx` answer comes back to the code instead of being followed. Each `Location` is a new URL chosen by the remote server, so it goes through steps 1 to 4 again, up to a small number of hops.
6. **Limit size and time.** One deadline covers the whole operation (all hops and the body), and the body is counted while it is read and dropped when it crosses the limit. `Content-Length` is only a hint from the other side.
7. **Validate the input with Zod** (a URL of at most 2048 characters). This answers "is it a URL?", not "is it safe to fetch?".
8. **Answer with little.** A refusal says which rule refused, never what the internal network answered. Detailed errors ("connection refused", "timeout") would tell the user which internal hosts exist.

### The time-of-check/time-of-use gap of DNS

Step 3 resolves the name and checks the address. If the code then gave the **name** to `fetch`, the HTTP client would resolve it a second time. Nothing guarantees the second answer equals the first: a DNS server controlled by somebody else may answer a public address to the check and an internal one, a moment later, to the connection. This is known as DNS rebinding, and it is a classic time-of-check/time-of-use (TOCTOU) flaw: the thing that was checked is not the thing that was used.

The usual answer is to **use what was checked**: resolve once, validate, and connect to that address. The fixed version does this: it replaces the host of the URL with the validated address and sends the original name in the `Host` header (and, for https, as the TLS server name, so the certificate is still verified against the name). `ts/tests/fixed-safe-fetch.test.ts` proves it with a name that exists only in a stub resolver: the fetch works only because the connection goes to the address the resolver returned, and the resolver is asked exactly once per hop. The lab has no HTTPS service, so the https branch is not covered by tests here.

### Network-level egress filtering (defence in depth)

All of the above lives in application code, and code has bugs: another feature may fetch a URL and forget the safe function, a library may fetch on its own (image processing, PDF rendering, webhooks, XML parsers). The network should enforce the same rule independently:

- Run the component that fetches user-supplied URLs in its own network segment, with firewall rules that let it out to the internet but **not** to internal ranges, or send its traffic through an egress proxy that applies the allow-list.
- Do not let internal services trust the network. `internal-admin` has no login "because it is internal"; with authentication between services, reaching it would not be enough.
- In the cloud, use the hardened version of the metadata service (the one that requires a session token and a special header), and give the instance only the permissions it needs.

This lab shows the idea in its own compose file: `public-site` is not attached to the `lab` network, so it cannot reach `internal-admin` however it is coded. Only the app can, which is exactly why the app is the target.

## What does not work as a fix

- **A blocklist of strings such as `localhost` or `127.0.0.1`.** The same address has many spellings: a single decimal number, hexadecimal or octal parts, the short forms of IPv4, an IPv4 address wrapped in IPv6, the whole `127.0.0.0/8` range, `0.0.0.0`. And any DNS name can simply have a record that points to an internal address, so the text of the URL contains nothing suspicious at all. Comparing text is trying to guess what the network stack will do; classify the resolved numeric address instead.
- **Validating only the first URL.** A perfectly public URL can answer with a redirect to an internal one, as `/redirect-to-internal` does in the lab. If the HTTP client follows redirects by itself, the check ran on a URL that is not the one finally fetched.
- **Validating the name and then letting the client resolve it again.** That is the TOCTOU gap described above.
- **Checking with a regular expression or `startsWith` on the raw URL.** URLs have user info, ports, fragments and encodings; `http://allowed.test@other.test/` starts with the allowed name and points somewhere else. Parse with `new URL()` and compare the parsed host exactly.
- **An allow-list of names alone, when the list is broad.** A wildcard such as `*.example.test` trusts every record anybody can create under that domain. This is why the address check stays even with an allow-list: the third block of `scenario.test.ts` shows it catching a wrong entry.
- **Not showing the answer to the user.** The request was still made. Blind SSRF can change state and map the internal network through timing and error differences.
- **Trusting `Content-Length` for the size limit.** The header is written by the remote side and may be absent or false; count the bytes.
- **Network filtering alone.** It usually cannot tell `http://public-site/` from a redirect chain inside allowed hosts, and it does not cover services on the same host (`localhost`). Application checks and network checks cover each other's gaps.

## Safety scope of the lab

- Everything runs locally in Docker. Both compose networks are `internal: true`, so no container reaches the internet, and a test proves it. `203.0.113.0/24` is a documentation range that is never routed on the real internet.
- **No port is published on the host.** The apps are never started as servers: the tests and the demo call them in-process. The only listeners are the two fake services, reachable only from inside the lab networks.
- The URLs of the scenario are built from the lab configuration and name only `public-site` and `internal-admin`. Nothing here targets a host outside the lab.
- All data is fake: the "secret" is `FAKE-INTERNAL-TOKEN-not-real`.
- There is no scanner, no payload list and no evasion technique here. The section on blocklists explains why spellings exist; it is not a list to try.
- The package is `private` and the vulnerable file is labelled as such in its name and in its first lines.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| `@types/bun` | 1.4.2 |
