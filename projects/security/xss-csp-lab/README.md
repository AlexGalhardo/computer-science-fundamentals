# xss-csp-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A defensive lab about cross-site scripting (XSS). Three small pages (a guestbook, a search and a welcome page) are served twice by ElysiaJS: once with the classic mistakes, once fixed. A real Chromium, driven by Playwright inside Docker, opens both and shows that the same text runs as code on the vulnerable version and is displayed as plain text on the fixed one. The fix has three parts: HTML escaping on the server, `textContent` instead of `innerHTML` in the browser, and a Content Security Policy (CSP) header as a second layer.

Code: MP-SEC-2. Full explanation: [docs/en/security/xss-csp-lab.md](../../../docs/en/security/xss-csp-lab.md).

> **Vulnerable on purpose.** The files under `ts/src/vulnerable/` contain real flaws. They exist to be read and tested inside this lab. Never copy them, import them or serve them anywhere else.

## Quiz topics it demonstrates

- `security` / `xss`: stored, reflected and DOM-based XSS, output encoding, safe DOM APIs
- `security` / `csp-security-headers`: `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, CSP as defence in depth, `X-Content-Type-Options: nosniff`

## Run

The only requirement is Docker.

```sh
./setup-unix-xss-csp-lab.sh        # Linux and macOS
./setup-windows-xss-csp-lab.ps1    # Windows
```

The script builds the images, runs the unit tests (`ts-test`) and the browser tests (`e2e`), and removes the containers at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

The demo sends the same input to both apps and prints, side by side, the HTML line each one answers and its `Content-Security-Policy` header: raw `<script>` markup on the vulnerable app, `&lt;script&gt;` on the fixed one. It also prints the one line of browser code that differs in the DOM-based case (`innerHTML` against `textContent`). The demo has no browser, so it shows what the server sends. What a browser does with it is shown by the `e2e` tests.

## Tests

```sh
docker compose run --rm ts-test    # type check + unit tests (bun test)
docker compose run --rm e2e        # Playwright, Chromium only
docker compose down -v --remove-orphans
```

The same scenario functions run against both apps (`ts/tests/e2e/scenarios.ts` in the browser, `ts/tests/apps.test.ts` on the server side).

| What is proved | Where |
| --- | --- |
| Stored, reflected and DOM-based XSS each run the injected code on the vulnerable app | `tests/e2e/xss.e2e.ts`, first group |
| The same three attempts do not run on the fixed app, the text is displayed as typed, and no markup is injected | `tests/e2e/xss.e2e.ts`, second group |
| Normal use still works on the fixed app, including text with `&` and `<`, and the page script loaded from a file runs under the policy | `tests/e2e/xss.e2e.ts`, "normal use still works" |
| CSP as a second layer: on a page that keeps the encoding bug, the markup is injected but the browser refuses to run it and reports a policy violation | `tests/e2e/xss.e2e.ts`, third group |
| The escaping function, the exact CSP header value, the Zod validation | `tests/escape-html.test.ts`, `tests/security-headers.test.ts`, `tests/apps.test.ts` |
| The containers cannot reach the internet | `tests/network-isolation.test.ts` |

"Code ran" is observed without harming anything: the demonstration input only sets `window.__labXssExecuted = true` on the page, and the test reads that flag.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable.** The three pages with raw string concatenation, plus the route `/csp-only/search` (encoding bug kept, CSP header added) |
| `ts/src/vulnerable/vulnerable-dom-client.js` | **Vulnerable.** Browser script that writes `location.hash` with `innerHTML` |
| `ts/src/fixed/fixed-app.ts` | The fixed pages: escaping at output, Zod validation, security headers on every response |
| `ts/src/fixed/fixed-escape-html.ts` | The HTML escaping function |
| `ts/src/fixed/fixed-dom-client.js` | Browser script that writes `location.hash` with `textContent` |
| `ts/src/security-headers.ts` | The Content Security Policy, directive by directive |
| `ts/src/lab-inputs.ts` | The only inputs the lab uses |
| `ts/src/lab-targets.ts` | Refuses any target that is not a lab host |
| `ts/src/demo-cli.ts` | The demo |
| `ts/tests/` | Unit tests (`*.test.ts`) and browser tests (`e2e/`) |

Routes of both apps: `GET /guestbook`, `POST /guestbook`, `GET /search?q=`, `GET /welcome#name`. The vulnerable app also has `GET /csp-only/search?q=`.

## Why the flaw happens

A web page is text that the browser parses into elements. When a program builds that text by gluing its own HTML to text typed by a visitor, the browser cannot tell the two apart: `<script>` typed in a form is made of the same characters as `<script>` written by the developer. The visitor's **data** crosses into **code**.

| Kind | Where the text comes from | Where the mistake is |
| --- | --- | --- |
| Stored | A guestbook message saved on the server and shown to every later visitor | The server concatenates it into HTML |
| Reflected | The `q` parameter of the URL, echoed back in the same response. It travels inside a link | The server concatenates it into HTML |
| DOM-based | The URL fragment (after `#`), which is never sent to the server | The browser script assigns it to `innerHTML`, which parses it as HTML |

In a real application, code running in the page acts with the identity of the logged-in victim. In this lab it only sets a flag.

## How to prevent it

1. **Encode at output, for the place where the text goes.** `escapeHtml` replaces `&`, `<`, `>`, `"` and `'` with entities at the moment the text is written into HTML. The browser displays the entity as the original character and never treats it as markup, so the boundary between data and code holds. The stored text is kept as typed: `Tom & Jerry <3` is still shown exactly like that. Why it works: the parser never sees a `<` that came from the visitor. In real projects, a template engine that escapes by default (JSX, for example) does this for you.
2. **Use DOM APIs that take text.** `element.textContent = value` creates a text node and never invokes the HTML parser, so there is nothing to inject into. This is the only fix for the DOM-based case, because the server never sees the fragment.
3. **Add a Content Security Policy as a second layer.** The fixed app sends `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`. With `script-src 'self'` and no `'unsafe-inline'`, the browser runs only script files of the same server: inline `<script>` blocks and inline handlers such as `onerror="..."` are refused. For that to be possible, the fixed pages have no inline script at all: their script is a file. `object-src 'none'` disables plugins and `base-uri 'none'` forbids a `<base>` element that would redirect relative script addresses.
4. **Validate the input** (Zod here) for shape and size. This limits what is accepted, and it is not what stops XSS: the fixed app accepts the text `<script>` as a legitimate message and renders it harmlessly.

## What does not work as a fix

- **CSP alone.** The route `/csp-only/search` proves both halves: the script does not run, and the markup is still injected. Injected markup without script can still show fake content or forms, a browser or a proxy may drop the header, and one loose directive (`'unsafe-inline'`, a wildcard) brings the flaw back. CSP is defence in depth, never a replacement for encoding.
- **Removing or blocking "dangerous" words** such as `<script>`. The DOM-based input of this lab contains no `<script>` at all, which shows that such a list is always incomplete, and it also breaks honest text.
- **Escaping when the text is saved** instead of when it is written. The right encoding depends on where the text ends up (HTML, an attribute, JSON, an e-mail), which is only known at output time. Stored entities also get double-escaped later.
- **Validation in the browser** (`maxlength`, `required`, JavaScript checks). Requests can be sent without the form.
- **Server-side escaping for a DOM-based flaw.** The fragment never reaches the server.
- **Relying on `HttpOnly` cookies.** They hide the cookie from scripts, but injected code can still act as the user inside the page.

## Safety scope of the lab

- Everything runs in Docker on a compose network with `internal: true`. No container can reach the internet, and a test proves it (a request to the documentation domain `example.com` must fail).
- No port is published on the host. The vulnerable app is reachable only by the other containers of this compose file.
- The lab uses two fixed demonstration inputs, and they only set a flag in the page. The image address in one of them is a path of the lab server itself. The demo and the browser tests refuse any target that is not a lab host.
- All names and data are fake (`alice-fake`, `bob-fake`). There are no credentials.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
