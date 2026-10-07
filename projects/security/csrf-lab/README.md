# csrf-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A browser attaches cookies to a request because of where the request **goes**, not because of which page asked for it. So a page on another site can make a logged-in browser send a request to your app, and the app sees a valid session. This is cross-site request forgery (CSRF). This lab shows it with real browsers: a fake "profile" app whose e-mail is changed by a second local origin, and then the same attempt refused by an anti-CSRF token, an explicit `SameSite` cookie and "state changes only through POST".

Code: MP-SEC-3. Full explanation: [docs/en/security/csrf-lab.md](../../../docs/en/security/csrf-lab.md).

> **Defensive, educational lab.** `ts/src/vulnerable/` is vulnerable on purpose and `ts/src/other-origin/` is the lab's forging page. Both exist only to make the flaw observable here. Never copy them or point them at anything outside this compose file.

## Quiz topics it demonstrates

- `security` / `csrf-samesite`: why the cookie travels on a forged request, the synchroniser token, `SameSite=Strict` and `Lax`, why GET must not change state
- `security` / `sessions-cookies`: the session cookie as the only proof of identity, cookie attributes (`HttpOnly`, `SameSite`, `Secure`), browser defaults when an attribute is missing

## Run

The only requirement is Docker.

```sh
./setup-unix-csrf-lab.sh        # Linux and macOS
./setup-windows-csrf-lab.ps1    # Windows
```

The script builds two images, runs the unit tests and the browser tests, and removes the containers at the end. The first build downloads the Playwright image (browsers included), which is large.

## Structure

| Service | Host inside the lab | What it is |
| --- | --- | --- |
| `app-vulnerable` | `http://app-vulnerable:3000` | Cookie with no `SameSite`, no token, e-mail change by GET and POST |
| `app-fixed` | `http://app-fixed:3000` | The fix: token + `SameSite=Strict` + POST only |
| `app-token-only` | `http://app-token-only:3000` | The fixed code with `SameSite` switched off |
| `app-samesite-only` | `http://app-samesite-only:3000` | The fixed code with the token switched off |
| `other-origin` | `http://other-origin:3000` | The lab's forging page. It can only target the four hosts above |
| `ts-test` | | Type check and unit tests (Bun) |
| `e2e` | | Playwright with Chromium, Firefox and WebKit |
| `demo` | | The CLI walk-through |

Each service name is a different host, and for a browser a different host with no shared parent domain is a different **site**. That is what makes the requests from `other-origin` cross-site.

| Path | What it is |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | The vulnerable app, with the three flaws marked in comments |
| `ts/src/fixed/fixed-app.ts` | The fixed app, with the three fixes marked in comments |
| `ts/src/fixed/fixed-csrf-token.ts` | Token generation and constant-time verification |
| `ts/src/other-origin/forging-page.ts` | The forging page: an auto-clicked link (GET) and an auto-submitted form (POST) |
| `ts/src/shared/` | Fake data, cookie helpers, the HTML page, the in-memory state and the lab instrumentation routes |
| `ts/src/demo.ts` | The demo |
| `ts/tests/` | Unit tests (`bun test`) |
| `ts/e2e/` | Browser tests (Playwright) |

The apps expose `GET /lab/observations` and `POST /lab/reset`. They are lab instrumentation, so the tests can see what the server received (was the cookie there?) and repeat the experiment. A real application has no such routes.

## Tests

```sh
docker compose run --rm ts-test    # type check + unit tests
docker compose run --rm e2e        # browser tests
docker compose down -v --remove-orphans
```

The browser tests run one scenario against every version of the app: the user logs in through the app's form, the same tab visits `other-origin`, and the forging page sends the browser back to the app.

| Version | GET forgery (link) | POST forgery (form) | Legitimate form |
| --- | --- | --- | --- |
| `app-vulnerable` | **e-mail changed** in all three browsers | **e-mail changed** in Chromium and Firefox. WebKit does not send the cookie | works |
| `app-token-only` | cookie arrives, `405` | cookie arrives in Chromium and Firefox, `403` (no token) | works |
| `app-samesite-only` | no cookie arrives, `405` | no cookie arrives, `401` | works |
| `app-fixed` | no cookie arrives, `405` | no cookie arrives, `401` | works |

The unit tests cover the server side without a browser: token generation and verification, the cookie attributes of each version, the same forged requests with the cookie attached by hand, the allow-list of the forging page, and a check that the container cannot reach `http://example.com` (the network is internal).

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

A narrated walk-through with `fetch`: the `Set-Cookie` header of each version, a forged POST and a forged GET against the vulnerable app (both change the e-mail), and the same requests against the fixed app (`403` and `405`), followed by the legitimate form with its token. `fetch` is not a browser, so the demo attaches the cookie by hand and shows only the server side. The browser side is what the `e2e` tests show.

## Why the flaw happens

1. **Cookies are sent automatically.** After login the browser stores the session cookie and attaches it to every request to that host. The page that started the request does not matter.
2. **Other sites may start requests to your host.** A link, a redirect and an HTML form can all point at another site. This is how the web has always worked. The other site cannot read the answer (the same-origin policy forbids that), but it does not need to: the damage is the request itself.
3. **The app treats the cookie as proof of intent.** The cookie proves "this browser is logged in". The vulnerable app reads it as "the user wants this change".
4. **A GET changes state.** Following a link is a GET, and browsers treat GET as safe. Even the `SameSite=Lax` default sends cookies on a link followed from another site.

### What browsers do when `SameSite` is missing

Measured in this lab with the browsers of `mcr.microsoft.com/playwright:v1.63.0-noble`:

| Browser | Cross-site top-level GET (link) | Cross-site top-level POST (form) |
| --- | --- | --- |
| Chromium 153 | cookie sent | cookie sent while the cookie is less than 2 minutes old ("Lax + POST"), not sent afterwards |
| Firefox 155 | cookie sent | cookie sent |
| WebKit 26.6 | cookie sent | cookie **not** sent |

The Chromium "not sent afterwards" cell was measured once by hand, with a cookie 130 seconds old. The automated tests always use a fresh cookie, so they stay fast and deterministic.

Three browsers, three behaviours, and they change between versions. The lesson is: **do not rely on the browser default. Set `SameSite` explicitly and use a token.**

Two more facts about this lab's setup:

- `SameSite=None` (always send) requires `Secure`, and a browser refuses a `Secure` cookie from plain HTTP. The lab is plain HTTP inside Docker, so the vulnerable app simply omits the attribute, which is also the most common real mistake.
- Browsers send the `Sec-Fetch-Site` header only to HTTPS (or `localhost`) origins, so it is always empty in the lab's observations. On a real HTTPS site it is one more signal a server can check.

## How to prevent it

1. **Anti-CSRF token (synchroniser token).** The server creates a random secret with the session, stores it on the server and writes it into its own forms as a hidden field. Every state-changing request must bring it back. Another site can send a form but cannot read your page, so it cannot know the value. Here: 32 random bytes, validated with Zod, compared in constant time, and valid only for the session it was created with.
2. **`SameSite` set explicitly on the session cookie.** `Strict` never sends the cookie on a request started by another site. `Lax` sends it only on top-level GET navigations, which is a good default when links from other sites must land on a logged-in page.
3. **State changes only through POST** (or PUT, PATCH, DELETE). GET stays read-only. The fixed app answers `405` to `GET /email/change`.

The fixed app uses all three. The token is the main defence, because the server enforces it itself. `SameSite` is defence in depth, because the browser enforces it. In production, also serve over HTTPS and mark the cookie `Secure` (a `__Host-` name prefix makes the browser require it).

## What does not work as a fix

- **Relying on the browser default for `SameSite`.** See the table above.
- **`SameSite` alone.** It is enforced by the browser, not by your server, and "site" is wider than "origin": `evil.example.com` and `app.example.com` are the same site, so a compromised or user-controlled subdomain bypasses it. A unit test here shows that the `samesite-only` app accepts the change when the cookie does arrive.
- **`SameSite=Lax` with a GET that changes state.** `Lax` sends the cookie on followed links by design.
- **Accepting only POST, with no token.** A hidden auto-submitted form sends a POST. The lab's POST forgery is exactly this.
- **A secret cookie.** `HttpOnly` or a long random session id do not help: the attacker never reads the cookie, the browser sends it for them.
- **Checking the `Referer` only.** It can be absent for privacy reasons, so the check ends up either blocking real users or allowing empty values.
- **A token that is not tied to the session**, or that is the same for every user. The attacker gets a valid one from their own account.
- **A token in a GET URL.** URLs leak through history, logs and the `Referer` header.
- **CORS.** CORS controls who may *read* a cross-origin response. A plain form POST is sent without asking.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

## Safety scope of the lab

- Runs only locally, in Docker, on an `internal: true` network: no container reaches the internet (a test proves it) and no port is published on the host.
- The forging page takes its target from a closed list of this compose file's own service names, and sends one fixed fake e-mail. It cannot be pointed anywhere else.
- All data is fake: user `alice-fake`, password `lab-fake-password`, addresses under the reserved `.example` domain.
- The vulnerable code is labelled as such in its file name and banner comment, the package is `private`, and nothing here is meant to be imported by other projects.
