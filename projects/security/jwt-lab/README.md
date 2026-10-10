# jwt-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)
>
> **Security lab, vulnerable on purpose.** The code in `ts/src/vulnerable/` exists only to make a flaw observable inside this lab. Never copy it, import it or deploy it.

A JSON Web Token (JWT) is a signed note that says "this is `bob-fake`, role `user`, valid until 10:15". The server that receives it has no session table to consult: it believes the note if, and only if, the verification is right. This lab shows the common ways that verification goes wrong: accepting unsigned tokens because the token itself said `alg: none`, signing with a word a person chose, and never checking the expiry. Then it fixes each one in a verifier written by hand with `node:crypto`, where every check is a visible, numbered step.

> **Use a library in production.** The verifier here is hand-written only so each check can be read and tested in isolation. Real code should use a maintained library (for example [`jose`](https://github.com/panva/jose)) configured with an explicit list of allowed algorithms, the expected issuer and the expected audience. Writing your own JWT verification is how the flaws of this lab got into real systems.

Code: MP-SEC-7. Full explanation: [docs/en/security/jwt-lab.md](../../../docs/en/security/jwt-lab.md).

## Quiz topics it demonstrates

- `security` / `jwt-oauth-oidc`: the three parts of a JWT, HS256 against RS256, algorithm pinning, the `exp`, `nbf`, `iss` and `aud` claims, access and refresh tokens
- `security` / `authentication`: proving who the caller is on every request, stateless tokens against server-side sessions, 401 against 403

## Run

The only requirement is Docker.

```sh
./setup-unix-jwt-lab.sh        # Linux and macOS
./setup-windows-jwt-lab.ps1    # Windows
```

The script builds the image, runs the type check and the tests on an internal network, and removes everything at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

It first prints the payload of a token decoded with no key, then the same six steps twice. On the vulnerable API the unsigned `admin` token, the token signed with the guessed word, the token used two hours after its expiry and the token issued for another service are all accepted. On the fixed API the same attempts get `401`, with the reason the server logged (`malformed`, `bad_signature`, `expired`, `wrong_audience`), and normal use still answers `200`.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

The container runs `tsc --noEmit` and then `bun test`.

| File | What it proves |
| --- | --- |
| `ts/tests/forgery.test.ts` | The same scenario functions run against both versions. Vulnerable: (a) a token with `alg: none`, an empty signature and `role: "admin"` is accepted, (b) the secret is found among five guessed words and a token signed with it is accepted, (c) a token whose `exp` is two hours in the past is accepted. Fixed: every one of those is refused with `401`, and so are a token for another audience, another issuer, a token not valid yet and malformed tokens. Normal use works on both |
| `ts/tests/verifier.test.ts` | The fixed verifier alone, one test per check, asserting the exact reason: pinned algorithm (`none`, `RS256`, `HS512`, `hs256`), tampered payload, another key, wrong signature length, malformed shapes, size limit, `exp` with the 30-second tolerance and an injected clock, `nbf`, `iss`, `aud`, payload shape |
| `ts/tests/key.test.ts` | The key is 32 random bytes by default, and a short key (the word `secret`) makes the verifier and the app refuse to start |
| `ts/tests/network.test.ts` | The container cannot reach the outside: a request to `http://example.com` fails |

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/token.ts` | The shape of a JWT and the neutral helpers: base64url, HMAC-SHA256, signing, reading a payload without verifying |
| `ts/src/data.ts` | Fake users, the issuer and audience names, the token lifetime and the clock type |
| `ts/src/vulnerable/vulnerable-verifier.ts` | The verifier with the three flaws. Vulnerable on purpose |
| `ts/src/vulnerable/vulnerable-app.ts` | The ElysiaJS API protected by it. Vulnerable on purpose |
| `ts/src/fixed/fixed-key.ts` | Key rules: 32 random bytes, refuse to start with less |
| `ts/src/fixed/fixed-verifier.ts` | The verifier, as seven numbered steps |
| `ts/src/fixed/fixed-app.ts` | The same API behind the fixed verifier, with the login body validated with Zod |
| `ts/src/scenario.ts` | The attempts, written once and run against both versions |
| `ts/src/demo.ts` | The walk-through printed by the `demo` service |
| `ts/src/http.ts` | The error type that carries the status code |

## A JWT in one minute

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiJib2ItZmFrZSIsInJvbGUiOiJ1c2VyIiwuLi59 . 3q2-7w...
        header                                    payload                                  signature
 {"alg":"HS256","typ":"JWT"}        {"sub":"bob-fake","role":"user","exp":...}     HMAC-SHA256(key, header.payload)
```

- **The payload is encoded, not encrypted.** base64url is a way of writing bytes as text. Anyone holding the token (the user, a proxy, a log file, a browser extension) reads every claim with no key at all, and the demo prints one to show it. Never put a password, an API key or private personal data in a JWT. The signature protects the content against *change*, not against *reading*.
- **HS256** uses one shared key to sign and to verify. Whoever can verify can also sign.
- **RS256** uses a key pair: the private key signs and the public key verifies. The public key can be handed to every service.

## Why the flaw happens

The vulnerable verifier is short and looks reasonable, which is the point:

```ts
// vulnerable
if (header.alg !== "none") { /* check the HS256 signature with the secret "secret" */ }
return payload; // exp, iss and aud are never read
```

- **(a) The token chooses how it is verified.** `alg` is a field of the header, and the header is written by whoever sends the token. `none` is a real value of the JWT standard ("unsecured JWT"). A verifier that dispatches on `header.alg` lets the sender pick "do not check me": change the payload, write `alg: none`, leave the signature empty.
- **(b) The key is a word.** An HS256 signature can be tested by anyone who has one token: sign the same header and payload with a guess and compare. That happens on the guesser's machine, so no rate limit, lockout or alert ever sees it. A word that a person chose (`secret`, the product name, a keyboard pattern) is among the first guesses, and once it is found the guesser *is* the issuer and signs any payload. The test uses five made-up guesses against the lab's own token, only to show that the comparison needs nothing from the server.
- **(c) Nobody reads `exp`.** The issuer writes an expiry of 15 minutes and the verifier never looks at it, so a token copied from a log or a lost laptop works forever. The same absence applies to `iss` and `aud`: a genuine token issued for another service is accepted here.
- **None of this fails for an honest user.** Login works, valid tokens work, even a tampered payload under an HS256 signature is correctly refused. Happy-path tests pass. The flaws are in what the verifier does *not* refuse.

## How to prevent it

The fixed verifier does these steps in this order (`ts/src/fixed/fixed-verifier.ts`):

1. **Size limit** (2048 bytes) before any parsing: the token comes from a stranger.
2. **Shape**: exactly three non-empty base64url parts.
3. **Pinned algorithm**: the server decides `HS256`. The header must say exactly that, or the token is refused before any signature work. The header is a strict Zod object, so fields that point to a key (`kid`, `jku`, `jwk`) are refused too.
4. **Signature compared in constant time** with `timingSafeEqual`, so the response time says nothing about how close a guess was.
5. **Payload validated with Zod**, only after the signature is confirmed. `exp` is required.
6. **Time**: refused when `now >= exp + 30 s`, and when `nbf` is present and still in the future. The clock is injected, so tests move time without waiting.
7. **Issuer and audience**: `iss` must be the expected issuer and `aud` must contain this service.

And around the verifier:

- **A strong key**: at least 32 bytes from the system random generator (`randomBytes(32)`), generated at start-up or passed as base64 through `JWT_LAB_KEY_BASE64`. The app refuses to start with a shorter key. In a real system the key comes from a secret manager, is never committed, and can be rotated.
- **One answer for every refusal**: the client always gets `401 {"error":"invalid_token"}`. The precise reason goes to the server log.

### Why pinning also matters with RS256: key confusion

Suppose a service verifies RS256 tokens with the issuer's **public** key, and its verifier picks the algorithm from the header. The public key is, by design, known to everyone. Someone writes a token whose header says `HS256` and computes the HMAC using the public key bytes as the shared secret. The verifier reads `HS256`, takes "the key it has" (the public key) and runs an HMAC check, which succeeds. A value that was never secret has become a signing key. The root cause is the same as with `none`: the token was allowed to choose the algorithm. With a pinned algorithm (and a key that is typed for one algorithm only) the attack has nowhere to start. This lab only explains it and does not implement it.

### Short expiry, refresh tokens and revocation

A JWT is verified without consulting any database, which is why it scales and also why it is hard to take back: after logout, a password change or a stolen laptop, the token is still valid until `exp`, because no server is asked.

- **Short-lived access tokens** (minutes) limit how long a leaked token is useful.
- **A refresh token** keeps the user logged in: it is long-lived, sent only to the issuer, stored on the server, rotated at every use, and therefore *can* be revoked. Revocation takes effect when the current access token expires.
- **Immediate revocation needs state**: a deny list of token ids (`jti`) checked on every request, or a per-user "tokens issued before this instant are invalid" value. Both bring back the lookup that the JWT avoided. When instant revocation is a hard requirement, a server-side session is often the simpler design.

## What does not work as a fix

- **Blocking the string `none`.** A deny list invites variations and the next unexpected algorithm. Allow exactly one value and refuse everything else.
- **A longer word or phrase as the secret.** Length chosen by a person is not randomness. The 32-byte rule is a floor: the key must come from a random generator.
- **Encoding the payload differently, or "hiding" claims in base64.** The payload is public to whoever holds the token. Data that must be secret stays on the server.
- **A very long expiry "for convenience".** It turns every leaked token into a long-term credential. Use a short access token with a refresh token.
- **Checking the signature and nothing else.** A valid signature says who wrote the token, not that it is still valid, nor that it was meant for this service.
- **Reading claims before verifying** (for example choosing the key or the tenant from an unverified payload). Until the signature is confirmed, the payload is text written by a stranger.
- **Deleting the token in the browser as "logout".** A copy made before that keeps working until `exp`.

## Safety scope of the lab

- Everything runs locally in Docker, on a compose network with `internal: true`. No port is published and a test proves the container cannot reach the outside.
- Both APIs run in memory, inside the test process. No request leaves the container, and nothing here targets any other system.
- All data is fake: `alice-admin-fake`, `bob-fake`, passwords such as `lab-fake-password-bob`, the issuer `https://issuer.lab.invalid`.
- The demonstrations are one hand-built token each. The "guessing" is a fixed list of five made-up words compared with a token this lab issued to its own fake user. There is no cracking tool, no word-list file and no scanner.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
