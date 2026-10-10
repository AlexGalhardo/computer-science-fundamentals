# XSS and Content Security Policy lab (MP-SEC-2)

> Versão em português: [docs/pt/security/xss-csp-lab.md](../../pt/security/xss-csp-lab.md) · Versión en español: [docs/es/security/xss-csp-lab.md](../../es/security/xss-csp-lab.md)

Mini-project: [`projects/security/xss-csp-lab`](../../../projects/security/xss-csp-lab/README.md). Quiz topics: `xss`, `csp-security-headers`.

This is a defensive lab. It runs only in Docker, on an internal network with no published port, with fake data, and its demonstration input only sets a flag in the page.

## The concept

A browser receives text and parses it into a tree of elements. Some elements are code: a `<script>` block, or an attribute such as `onerror="..."`. Cross-site scripting (XSS) happens when text supplied by one person is parsed as code in the page of another person. The injected code then runs with everything that page can do, in the name of whoever has it open.

The root cause is always the same: **data was written into a place that is parsed as code, without being encoded for that place**.

## The flaw, three times

```text
visitor types:   <script>window.__labXssExecuted = true</script>

server builds:   "<span>" + text + "</span>"
browser parses:  <span><script>...</script></span>     <- a script element, and it runs
```

| Kind | Route in the lab | How the text arrives | Who makes the mistake |
| --- | --- | --- | --- |
| Stored | `POST /guestbook`, then `GET /guestbook` | Saved on the server and served to every later visitor | Server: string concatenation into HTML |
| Reflected | `GET /search?q=...` | Inside the URL of a link, echoed in the response | Server: string concatenation into HTML |
| DOM-based | `GET /welcome#...` | In the URL fragment, which the browser never sends to the server | Browser script: `element.innerHTML = text` |

The DOM-based input is an `<img>` with an inline `onerror` handler, because a `<script>` element inserted through `innerHTML` is never executed. It is a useful detail: looking for the word `script` finds nothing in it.

## The fix, three layers

**1. Output encoding (server).** `escapeHtml` replaces `&`, `<`, `>`, `"` and `'` with `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&#39;` at the moment the text is written into HTML.

```text
server builds:   "<span>" + escapeHtml(text) + "</span>"
browser parses:  <span>&lt;script&gt;...&lt;/script&gt;</span>     <- one text node
screen shows:    <script>window.__labXssExecuted = true</script>
```

It works because the parser never meets a `<` that came from the visitor, so the visitor cannot open a tag or close an attribute. Nothing is deleted: the text is displayed exactly as typed. The encoding is applied at output, not when saving, because the right encoding depends on the destination (HTML text, an attribute, JSON), and that is only known when writing.

**2. Safe DOM API (browser).** `element.textContent = text` creates a text node and does not invoke the HTML parser. This is the fix for the DOM-based case, where the server has nothing to escape.

**3. Content Security Policy (header).** The fixed app sends, on every response:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
```

| Directive | Effect |
| --- | --- |
| `script-src 'self'` | Only script files from the same origin run. Without `'unsafe-inline'`, inline `<script>` blocks and inline event handlers are refused |
| `object-src 'none'` | No `<object>` or `<embed>` plugins |
| `base-uri 'none'` | No `<base>` element, which would change where relative script addresses point |
| `default-src 'self'` | Everything not listed (images, styles, connections) only from the same origin |
| `form-action 'self'` | Forms post only to the same origin |
| `frame-ancestors 'none'` | The page cannot be framed by another site |

A strict policy has a price: the application itself can have no inline script. That is why the fixed pages load their script from a file (`/static/fixed-dom-client.js`).

## CSP is the second layer, not the fix

The vulnerable app has one extra route, `/csp-only/search`, which keeps the encoding bug and adds only the header. The browser test observes two facts on it at the same time:

- the injected element **is in the page** (the markup was injected);
- the code **did not run**, and the browser fired a `securitypolicyviolation` event.

So the policy reduced the damage of a bug that is still there. Injected markup without script can still display false content, the header can be missing or weakened by a single loose directive, and older or unusual clients may not enforce it. Encode first, and keep CSP for the day an encoding bug slips through.

## What the tests prove

| Item | How it is verified |
| --- | --- |
| MP-SEC-2.1 stored, reflected and DOM-based XSS are demonstrated inside the lab | `docker compose run --rm e2e`: the group "vulnerable app" of `tests/e2e/xss.e2e.ts` asserts that the flag was set by the injected code in each of the three scenarios |
| MP-SEC-2.2 the same tests fail to execute script on the fixed version | Same command: the group "fixed app" runs the same scenario functions and asserts that the flag is not set, that no element was injected, that the text is displayed as typed and that normal use works |
| MP-SEC-2.2 CSP as a second layer | Same command: the group "vulnerable page with CSP only" asserts injected markup, no execution and a reported policy violation |
| MP-SEC-2.3 cause and prevention documented | This page and the three READMEs of the mini-project |
| No access to the outside | `docker compose run --rm ts-test`: `tests/network-isolation.test.ts` asserts that a request to `example.com` fails. The compose network is `internal: true` and publishes no port |

The server-side tests (`tests/apps.test.ts`) check the same thing one step earlier: what the server writes (raw markup or entities) and which headers it sends. The exact value of the policy is pinned by `tests/security-headers.test.ts`.

## Run

```sh
cd projects/security/xss-csp-lab
./setup-unix-xss-csp-lab.sh          # unit tests and browser tests
docker compose run --rm demo         # narrated comparison
docker compose down -v --remove-orphans
```
