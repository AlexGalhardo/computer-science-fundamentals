# JWT lab: the common mistakes of token validation (MP-SEC-7)

> Versão em português: [docs/pt/security/jwt-lab.md](../../pt/security/jwt-lab.md)

Mini-project: [`projects/security/jwt-lab`](../../../projects/security/jwt-lab/README.md). Quiz topics: `jwt-oauth-oidc`, `authentication`.

This is a defensive lab. It runs only in Docker, on an internal network, in memory and with fake data. The vulnerable code exists only to make the flaws observable. The verifier is written by hand with `node:crypto` so that each check is visible; production code should use a maintained library (for example `jose`) configured with an explicit list of allowed algorithms.

## The concept

A JSON Web Token is three base64url texts joined by dots:

```
base64url(header) . base64url(payload) . base64url(signature)
```

| Part | Content | Example |
| --- | --- | --- |
| Header | How the token was signed | `{"alg":"HS256","typ":"JWT"}` |
| Payload | The claims | `{"sub":"bob-fake","role":"user","iss":"...","aud":"...","exp":1800000900}` |
| Signature | Proof that the issuer wrote the first two parts | `HMAC-SHA256(key, header + "." + payload)` |

The server keeps no session: it trusts what the payload says, as long as the verification passes. That moves the whole security of the login into one function, the verifier.

Two facts shape everything else:

- **The payload is encoded, not encrypted.** Whoever holds the token reads every claim with no key. The signature prevents changes, not reading. Secrets never go in a JWT.
- **The header is written by the sender.** Anything the verifier reads from it before checking the signature is a suggestion from a stranger.

The claims used here (RFC 7519): `sub` (who), `iss` (who issued), `aud` (for which service), `iat` (issued at), `exp` (expires at), `nbf` (not valid before). Times are Unix seconds.

## The flaw

The vulnerable verifier makes three mistakes, each demonstrated by one hand-built token:

| | Mistake | What the test does | Result on the vulnerable API |
| --- | --- | --- | --- |
| (a) | Trusts `alg` from the header, including `none` | `bob-fake` changes his payload to `role: "admin"`, writes `alg: none`, leaves the signature empty | `200` on the admin route |
| (b) | The HS256 secret is the word `secret` | `bob-fake` signs his own token with five made-up guesses, offline, finds the one that matches, and signs an admin token | `200` on the admin route |
| (c) | Never reads `exp` (nor `iss`, `aud`) | A 15-minute token is used two hours later; a token issued for another service is replayed | `200` in both cases |

Why (b) works without touching the server: an HS256 signature is a deterministic function of the key and of text the token holder already has. Comparing a guess needs only one token. No rate limit or lockout applies, because nothing is sent. A key must therefore be unguessable in itself, which a word chosen by a person never is.

None of the three produces an error for an honest user, and a tampered payload under an HS256 signature is correctly refused by both versions. The flaws are the paths *around* the signature check.

## The fix

The fixed verifier is a fixed sequence. Nothing from the payload is believed before step 4 passes.

| Step | Check | Refusal reason (server log) |
| --- | --- | --- |
| 1 | Token size at most 2048 bytes, before parsing | `token_too_large` |
| 2 | Exactly three non-empty base64url parts | `malformed` |
| 3 | Header is a strict object and `alg` equals the pinned `HS256`. Refused before any signature work | `malformed`, `algorithm_not_allowed` |
| 4 | HMAC-SHA256 recomputed and compared with `timingSafeEqual` | `bad_signature` |
| 5 | Payload validated with Zod; `exp` is required | `invalid_claims` |
| 6 | `now < exp + 30 s`; when `nbf` exists, `now + 30 s >= nbf`. Injected clock | `expired`, `not_yet_valid` |
| 7 | `iss` is the expected issuer, `aud` contains this service | `wrong_issuer`, `wrong_audience` |

The key is at least 32 bytes from the system random generator, generated at start-up or given as base64 in `JWT_LAB_KEY_BASE64`; the verifier refuses to be created with a shorter one. The client always receives the same `401 {"error":"invalid_token"}`, so the refusal reveals nothing about which check failed.

### Algorithm pinning and key confusion

The `none` problem is one case of a general rule: the token must not choose its algorithm. The other classic case is RS256/HS256 key confusion. A service verifies RS256 tokens with the issuer's public key and lets the header select the algorithm. A sender writes `HS256` in the header and computes the HMAC with the public key bytes as the secret. The verifier, told `HS256`, uses the key it has (the public one) for an HMAC check, and it passes: a public value became a signing key. Pinning the algorithm on the server removes the starting point of both. The lab explains this case and does not implement it.

### Expiry, refresh and revocation

A stateless token cannot be taken back: after logout or theft it stays valid until `exp`, because verification consults nothing. The usual design is a short-lived access token (minutes) plus a refresh token that is stored on the server, sent only to the issuer, rotated at each use and revocable. Immediate revocation of an access token needs server state again (a deny list of `jti`, or a per-user "not issued before" instant), which is the lookup the JWT was meant to avoid. When instant revocation is required, a server-side session is often simpler.

### What is not a fix

- **A deny list for `none`**: allow one algorithm instead of forbidding some.
- **A longer human-chosen secret**: length is not randomness.
- **A long expiry for convenience**: every leaked token becomes a long-term credential.
- **Signature only**: a valid signature does not say the token is still valid or meant for this service.
- **Reading claims before verifying**: until the signature passes, the payload is a stranger's text.

## What the tests prove

| Item | How it is verified |
| --- | --- |
| MP-SEC-7.1 (a) unsigned token accepted | `tests/forgery.test.ts`, "vulnerable API": the token ends with an empty signature, its payload says `role: "admin"`, and the admin route answers `200` |
| MP-SEC-7.1 (b) weak secret | Same file: the secret is recovered from a fixed list of five made-up words compared with the lab's own token, and a token signed with it gets `200` |
| MP-SEC-7.1 (c) no expiry check | Same file: the clock advances two hours past a 15-minute token and `/me` still answers `200` |
| MP-SEC-7.2 forged tokens refused | `tests/forgery.test.ts`, "fixed API": the same scenario functions get `401`, with the logged reasons `malformed`, `bad_signature`, `expired`, `wrong_audience`; no guessed word matches the random key |
| MP-SEC-7.2 valid token accepted | `tests/forgery.test.ts`, "what must work on both": login, `/me` and the admin route for the admin answer `200`; the regular user gets `403` on the admin route |
| MP-SEC-7.2 wrong audience, wrong issuer, tampered payload, malformed, another audience | `tests/verifier.test.ts` (each reason asserted on the verifier alone) and `tests/forgery.test.ts` (through HTTP) |
| MP-SEC-7.2 pinned algorithm | `tests/verifier.test.ts`: `none`, `RS256`, `HS512` and `hs256` are refused with `algorithm_not_allowed` even when the HS256 signature is correct |
| MP-SEC-7.2 `exp` tolerance and injected clock, `nbf` | `tests/verifier.test.ts`: accepted at `exp + 29 s`, refused at `exp + 30 s`; `nbf` in the future refused |
| MP-SEC-7.2 strong key | `tests/key.test.ts`: 32 random bytes by default, and a short key makes the verifier and the app throw at creation |
| MP-SEC-7.2 Zod and size limit | `tests/verifier.test.ts` (unknown role, missing `exp`, missing `aud`, oversized token) and `tests/forgery.test.ts` (login body) |
| Lab isolation | `tests/network.test.ts`: a request to `http://example.com` fails from inside the container |

## Run

```sh
cd projects/security/jwt-lab
./setup-unix-jwt-lab.sh                # build, type check and tests
docker compose run --rm demo           # the walk-through
docker compose down -v --remove-orphans
```
