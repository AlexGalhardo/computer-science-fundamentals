# CSRF lab (MP-SEC-3)

> Versão em português: [docs/pt/security/csrf-lab.md](../../pt/security/csrf-lab.md)

Mini-project: [`projects/security/csrf-lab`](../../../projects/security/csrf-lab/README.md). Quiz topics: `csrf-samesite`, `sessions-cookies`.

Defensive, educational lab. It runs only in Docker, on an internal network with no published port, with fake data. The vulnerable app and the forging page exist only to make the flaw observable there.

## The concept

A session cookie answers one question: "which logged-in browser is this?". The browser attaches it to every request to the host that set it, whatever page started the request.

```
1. user  -> app            POST /login                 app sets the session cookie
2. user  -> other site     GET  /some-page             (same browser, another tab or a link)
3. other site's page makes the browser send:
   browser -> app          POST /email/change          Cookie: session=...   <- attached by the browser
4. app: "valid session"    -> changes the e-mail
```

The other site never sees the cookie and cannot read the app's answer (the same-origin policy). It does not need to. The request arrives with a valid session, and the app has no way to tell it from a request the user made on purpose. That is cross-site request forgery (CSRF).

**Site and origin.** An origin is scheme + host + port. A site is wider: scheme + registrable domain (`app.example.com` and `blog.example.com` are different origins of the same site). `SameSite` cookies use the site. In the lab every container name (`app-vulnerable`, `other-origin`) is a single-label host with no shared parent, so each one is a different site.

## The flaw

`app-vulnerable` (`ts/src/vulnerable/vulnerable-app.ts`) has three flaws, each marked in the code:

1. The session cookie is the only thing the e-mail change asks for.
2. The cookie has no `SameSite` attribute, so each browser applies its own default.
3. `GET /email/change?email=...` changes state.

`other-origin` (`ts/src/other-origin/forging-page.ts`) is the lab's forging page. It has two pages, and both can only target the lab's own app hosts (a closed list validated with Zod):

- `/forge/get`: a link to the app that the page clicks by itself. A cross-site top-level GET navigation.
- `/forge/post`: a hidden form whose `action` is the app, submitted by script. A cross-site top-level POST.

### Browser defaults for a cookie with no `SameSite`

Measured with the browsers of the pinned Playwright image (`v1.63.0-noble`):

| Browser | Cross-site GET (link) | Cross-site POST (form) |
| --- | --- | --- |
| Chromium 153 | sent | sent while the cookie is less than 2 minutes old ("Lax + POST"), not sent afterwards |
| Firefox 155 | sent | sent |
| WebKit 26.6 | sent | not sent |

So the GET forgery works in all three, and the POST forgery works in Chromium and Firefox. In WebKit the vulnerable app survives the POST only because of that browser's default, and falls to the GET in the same browser. The defaults differ and change between versions, which is why an app must not depend on them.

`SameSite=None` would make the cookie travel everywhere, but browsers accept it only together with `Secure`, and a plain-HTTP origin cannot set a `Secure` cookie. The lab is plain HTTP inside Docker, so the honest demonstration is the missing attribute. For the same reason (plain HTTP) browsers do not send `Sec-Fetch-Site` to the lab apps.

## The fix

`app-fixed` (`ts/src/fixed/fixed-app.ts`) applies three changes:

| Fix | What it does | Who enforces it |
| --- | --- | --- |
| Synchroniser token | A random secret (32 bytes) created with the session, stored on the server, written as a hidden field into the app's own form. The POST must bring it back. Validated with Zod and compared in constant time (`timingSafeEqual` over SHA-256 digests) | The server |
| `SameSite=Strict` | The browser does not attach the cookie to requests started by another site | The browser |
| POST only | `GET /email/change` answers `405` and changes nothing | The server |

The token works because of the same-origin policy: the other site can *send* a form to the app, but cannot *read* the app's page, so it cannot learn the value. It must be tied to the session, otherwise the attacker would use the token of their own account.

`Strict` or `Lax`? `Lax` still sends the cookie when the user follows a link from another site, so links from e-mails and searches land on a logged-in page, and it is only safe when no GET changes state. `Strict` withholds the cookie there too. The lab uses `Strict` to make the effect visible on both forgeries.

Why both defences: the token is enforced by the server on every request. `SameSite` depends on the browser, and treats sibling subdomains as the same site. Each one covers a failure of the other.

## What the tests prove

Browser tests (`ts/e2e/csrf.e2e.ts`, Playwright, Chromium + Firefox + WebKit). One scenario function runs against every version: log in through the app's form, visit `other-origin`, let the forging page send the browser back. The apps record what they received on each attempt (method, whether the session cookie was present, outcome), and the tests assert on it.

| Test | Result |
| --- | --- |
| `app-vulnerable`, GET forgery | Cookie received, e-mail changed, in all browsers. The profile page then shows the forged e-mail |
| `app-vulnerable`, POST forgery | Cookie received and e-mail changed in Chromium and Firefox. No cookie in WebKit |
| `app-token-only`, POST forgery | The cookie arrives (Chromium, Firefox) and the request is still refused with `403`: the token alone is enough |
| `app-token-only`, GET forgery | The cookie arrives, `405`, nothing changes |
| `app-samesite-only`, GET and POST forgery | The server receives **no** session cookie: `SameSite=Strict` alone keeps it from being attached |
| `app-fixed`, GET and POST forgery | No cookie received, e-mail unchanged |
| Legitimate form, all four versions | The user changes the e-mail through the app's own form |

Unit tests (`ts/tests/`, `bun test`), without a browser, with the cookie attached by hand:

- Token: unique, 43 URL-safe characters, verified only against the exact token of the session, refuses wrong types and oversized values.
- Cookie attributes: no `SameSite` on the vulnerable app, `SameSite=Strict` on the fixed one.
- The same forged POST and GET against both apps: the vulnerable app changes the e-mail, the fixed app answers `403` and `405`. A valid token from another session is refused.
- A limit stated honestly: with `SameSite` alone, if the cookie does arrive, the change is accepted.
- The forging page refuses any target outside the lab's list.
- The container cannot reach `http://example.com`: the network is internal.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-SEC-3.1 the forged change succeeds on the vulnerable app | `docker compose run --rm e2e`: the `app-vulnerable` tests (GET forgery in three browsers, POST forgery in Chromium and Firefox) |
| MP-SEC-3.2 the forged request is rejected and the legitimate form still works | Same command: the `app-fixed`, `app-token-only` and `app-samesite-only` tests, and the legitimate form test on every version |
| MP-SEC-3.3 definition of done | `./setup-unix-csrf-lab.sh` (or `.ps1`) runs `ts-test` and `e2e` and exits 0 |

## Run

```sh
cd projects/security/csrf-lab
./setup-unix-csrf-lab.sh           # unit tests + browser tests
docker compose run --rm demo       # narrated walk-through
docker compose down -v --remove-orphans
```
