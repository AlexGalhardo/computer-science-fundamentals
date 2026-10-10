# access-control-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)
>
> **Security lab, vulnerable on purpose.** The code in `ts/src/vulnerable/` exists only to make a flaw observable inside this lab. Never copy it, import it or deploy it.

A small invoices API knows exactly who is logged in and still lets any user read, change and delete any invoice by changing the number in the URL, and lets a regular user call an admin route whose only protection is a hidden button. This lab reproduces that flaw (broken access control: IDOR, also called broken object-level authorisation, plus a missing role check) and fixes it by putting every authorisation decision in one function, `can(user, action, resource)`, that denies by default.

Code: MP-SEC-4. Full explanation: [docs/en/security/access-control-lab.md](../../../docs/en/security/access-control-lab.md).

## Quiz topics it demonstrates

- `security` / `access-control`: authentication against authorisation, ownership checks, role checks, deny by default, 401 against 403 against 404
- `security` / `owasp-threat-modelling`: broken access control in the OWASP Top 10, and asking "who can call this, and on whose data?" for every route

## Run

The only requirement is Docker.

```sh
./setup-unix-access-control-lab.sh        # Linux and macOS
./setup-windows-access-control-lab.ps1    # Windows
```

The script builds the image, runs the type check and the tests on an internal network, and removes everything at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

It prints the same six steps twice. On the vulnerable API, `bob-fake` reads, changes and deletes the invoice of `alice-fake`, sees every invoice in the list and calls the admin route. On the fixed API the same requests with the same token get `403`, the list shows only his invoices, and the legitimate use (the owner and the admin) still answers `200`.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

The container runs `tsc --noEmit` and then `bun test`.

| File | What it proves |
| --- | --- |
| `ts/tests/idor.test.ts` | The same scenario functions run against both versions. Vulnerable: `bob-fake` reads, changes and deletes the invoice of `alice-fake` and calls the admin route. Fixed: the same attempts get `403`, the record is untouched, and normal use still works. Also the Zod validation and the `403` against `404` option |
| `ts/tests/matrix.test.ts` | The authorisation matrix, generated from a table: 4 callers (anonymous, owner, other user, admin) by 5 operations (read, update, delete, list, admin route), every cell asserted, for both versions. Also what the list contains per caller, and that every registered route refuses an anonymous caller |
| `ts/tests/policy.test.ts` | `can()` alone, without HTTP, including the combinations nobody wrote a rule for |
| `ts/tests/network.test.ts` | The container cannot reach the outside: a request to `http://example.com` fails |

The matrix of the fixed API:

| | read | update | delete | list | admin route |
| --- | --- | --- | --- | --- | --- |
| anonymous | 401 | 401 | 401 | 401 | 401 |
| owner | 200 | 200 | 200 | 200 (own invoices) | 403 |
| other user | 403 | 403 | 403 | 200 (own invoices) | 403 |
| admin | 200 | 200 | 200 | 200 (all invoices) | 200 |

On the vulnerable API the anonymous row is the same and every other cell is `200`.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/data.ts` | Fake users, fake session tokens and the in-memory invoices |
| `ts/src/vulnerable/vulnerable-app.ts` | The ElysiaJS API that trusts the id in the URL. Vulnerable on purpose |
| `ts/src/fixed/fixed-policy.ts` | `can(user, action, resource)`: the only place where access is decided |
| `ts/src/fixed/fixed-app.ts` | The same API, with every route behind the policy and ids and bodies validated with Zod |
| `ts/src/scenario.ts` | The attempts, written once and run against both versions |
| `ts/src/demo.ts` | The walk-through printed by the `demo` service |
| `ts/src/http.ts` | The error type that carries the status code |

## Why the flaw happens

The vulnerable API answers one question, "who are you?" (authentication), and skips the next one, "may you do this to that record?" (authorisation).

```ts
// vulnerable: the id comes from the caller, and the record goes to whoever asked
const invoice = store.invoices.get(Number(params.id));
return invoice;
```

- **The id in the URL is input, like any form field.** The caller chooses it. Receiving `1001` only means somebody typed `1001`.
- **Nothing compares the owner of the record with the logged-in user.** The check is not wrong, it is absent, and an absent check produces no error, no log line and no failing test. The feature works perfectly for every honest user.
- **The role check lives only in the interface.** `/me` returns a menu without the admin link for regular users, and `/admin/users` only checks that someone is logged in. Whoever types the address gets the answer.
- **Each route decides by itself.** With the checks spread across handlers, one forgotten handler is enough, and there is no single place to review.

## How to prevent it

- **Check on the server, on every request, against data the server owns.** The owner comes from the stored record and the role from the session, never from the request.
- **One policy function.** Every route asks `can(user, action, resource)` in `fixed-policy.ts`. Routes contain no `if (user.role === ...)` of their own. The list is filtered with the same `read` rule used for a single invoice, so the two can never disagree.
- **Deny by default.** `can()` returns `true` only for the combinations that are written down. An anonymous caller, an unknown action or a new kind of resource falls through to `false`.
- **Make the check hard to forget.** A handler receives the invoice only from `authorizeInvoice()`, which authenticates, validates the id, loads the record and asks the policy, in that order. A test walks every registered route and requires `401` without a session.
- **Validate the input with Zod.** The id must match `^[1-9][0-9]{0,8}$`, and the update body is a strict object, so an extra `ownerId` field is refused instead of silently changing the owner. Validation does not replace the ownership check: `1001` is a perfectly valid id of somebody else.
- **Test the matrix, including the refusals.** Tests that only cover the happy path pass on the vulnerable version too. The matrix asserts each `403` and `401` and that the record was left untouched.

### 403 or 404?

When the invoice exists and the caller may not touch it, there are two defensible answers:

| Answer | Advantage | Cost |
| --- | --- | --- |
| `403 Forbidden` (default here) | Honest and easy to debug and monitor: a burst of `403` is a clear signal | Confirms that the id exists. `404` for 9999 and `403` for 1001 tell a stranger which invoices are real |
| `404 Not Found` | Reveals nothing: a foreign record and a missing one are indistinguishable | Harder to debug, and the two answers must be truly identical (same body, same headers) or the difference leaks anyway |

Use `404` when the existence of the record is itself sensitive (a private repository, a medical record, a user account). Use `403` when existence is not a secret. This lab defaults to `403` and implements both: `createFixedApp(store, { hideExistence: true })` returns the same `404` in both cases, and a test asserts that the two responses are equal. Either way, the decision is taken in one place, after the same policy check. And `401` is a different thing: it means "we do not know who you are", not "you may not".

## What does not work as a fix

- **Hiding the button.** The interface runs on the user's machine, and the user decides which requests to send. Hiding a link is good usability (the fixed `/me` derives the menu from the same policy) and zero protection: the server must refuse the request.
- **Unguessable ids (UUIDs).** A random id makes guessing impractical, which is not the same as checking. Ids are not secrets: they appear in URLs, browser history, logs, e-mails, screenshots and shared links, and the API itself often hands them out in other responses. Once an id is known, an API without the ownership check serves the record. UUIDs are a reasonable extra layer and do not replace the check.
- **Encoding or hashing the id** (base64, a hash of the number). It is obscurity: whoever sees one value learns the scheme.
- **Trusting an owner or a role sent by the client** (a `userId` in the body, an `X-Role` header, a `role` cookie the server does not verify). The caller writes those too.
- **Checking only the read routes**, or checking in most routes. Access control fails at the one route that was forgotten, which is why the fix is a single policy plus a test over all routes.
- **Input validation alone.** A well-formed id is still somebody else's id.

## Safety scope of the lab

- Everything runs locally in Docker, on a compose network with `internal: true`. No port is published and a test proves the container cannot reach the outside.
- Both APIs run in memory, inside the test process. No request leaves the container, and nothing here targets any other system.
- All data is fake: `alice-fake`, `bob-fake`, `carol-admin-fake`, tokens such as `FAKE-TOKEN-alice-not-real`.
- The "attack" is one logged-in fake user changing a number in a URL. There is no scanner, no enumeration tool and no payload list.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
