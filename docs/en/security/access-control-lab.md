# Access control lab: IDOR and role checks (MP-SEC-4)

> Versão em português: [docs/pt/security/access-control-lab.md](../../pt/security/access-control-lab.md)

Mini-project: [`projects/security/access-control-lab`](../../../projects/security/access-control-lab/README.md). Quiz topics: `access-control`, `owasp-threat-modelling`.

This is a defensive lab. It runs only in Docker, on an internal network, in memory and with fake data. The vulnerable code exists only to make the flaw observable.

## The concept

Two different questions are asked about every request:

| Question | Name | Answer when it fails |
| --- | --- | --- |
| Who are you? | Authentication | `401 Unauthorized` |
| May you do this to that record? | Authorisation (access control) | `403 Forbidden`, or `404` when existence is hidden |

Broken access control is the first item of the OWASP Top 10 because the second question is easy to forget: an application with a perfect login still fails when it treats "logged in" as "allowed". Two shapes of the same mistake appear in this lab:

- **IDOR** (insecure direct object reference), also called **BOLA** (broken object-level authorisation): the request names a record by id and the server returns it without checking who owns it.
- **Missing function-level check**: a route meant for one role (admin) only checks that somebody is logged in.

## The flaw

```
bob-fake (logged in as himself)        server (vulnerable)
GET /invoices/1002  ------------------> load invoice 1002 -> 200, his invoice
GET /invoices/1001  ------------------> load invoice 1001 -> 200, alice-fake's invoice
GET /admin/users    ------------------> "is somebody logged in?" yes -> 200
```

The id in the URL is chosen by the caller. The vulnerable API loads whatever id it receives and never compares `invoice.ownerId` with the session user. The same absence on `PATCH` and `DELETE` lets a stranger change and destroy the record, and the list returns every invoice. The admin route is "protected" by the menu: `/me` does not show the admin link to regular users, and the route itself never looks at the role.

Nothing fails for an honest user, which is why this flaw survives reviews and happy-path tests: the missing check produces no error.

## The fix

One pure function decides, and it denies by default:

```ts
can(user, action, resource): boolean
```

| Rule | Allowed when |
| --- | --- |
| `list` on the invoice collection | the caller is logged in (the content is filtered with the `read` rule) |
| `read`, `update`, `delete` on an invoice | the caller owns it, or is an admin |
| `use-admin-route` on the admin area | the caller is an admin |
| anything else | never |

How the routes use it:

1. Authenticate (`401`).
2. Validate the id with Zod (`400`): digits only, `^[1-9][0-9]{0,8}$`.
3. Load the record (`404`).
4. Ask `can()` with the owner **stored on the server** (`403`).
5. Only then hand the record to the handler. The update body is a strict Zod object, so unknown fields such as `ownerId` are refused.

The owner and the role never come from the request. The menu returned by `/me` is derived from the same policy, as a convenience: the protection is the check inside the route.

### 403 or 404

`403` is honest and easy to monitor, and confirms that the id exists. `404` hides existence, at the cost of harder debugging, and only works when the two responses are truly identical. The lab defaults to `403` and offers `hideExistence: true`, which answers the same `404` for a foreign invoice and for a missing one. Choose `404` when existence itself is sensitive.

### What is not access control

- **Hiding a button**: the interface runs on the user's machine, and the user decides which requests are sent.
- **Unguessable ids (UUIDs)**: they make guessing impractical, and ids still leak through URLs, logs, history, e-mails and other API responses. A known id plus a missing check is the same flaw.
- **Encoded or hashed ids**, and **an owner or role sent by the client**: both are controlled by the caller.
- **Input validation alone**: a well-formed id is still somebody else's id.

## What the tests prove

| Item | How it is verified |
| --- | --- |
| MP-SEC-4.1 a test reads another fake user's record on the vulnerable API | `tests/idor.test.ts`, "vulnerable API: the flaw is observable": `bob-fake` gets `200` and the invoice of `alice-fake`, changes it, deletes it, lists every invoice and calls the admin route while his menu hides the link |
| MP-SEC-4.2 the same test gets `403` on the fixed API | `tests/idor.test.ts`, "fixed API: the same attempts are blocked": the same scenario functions get `403`, the stored record is unchanged, and normal use still answers `200` |
| MP-SEC-4.2 authorisation matrix | `tests/matrix.test.ts`: 4 rows (anonymous, owner, other user, admin) by 5 columns (read, update, delete, list, admin route), generated from a table, each cell asserted, for both versions. Also the content of the list per caller |
| MP-SEC-4.2 one policy, deny by default | `tests/policy.test.ts` tests `can()` alone, including unknown actions and resource kinds. `tests/matrix.test.ts` walks every registered route and requires `401` without a session |
| MP-SEC-4.2 ids validated with Zod | `tests/idor.test.ts`: malformed ids get `400`, a body with an extra `ownerId` is refused and the owner does not change |
| Lab isolation | `tests/network.test.ts`: a request to `http://example.com` fails from inside the container |

The matrix of the fixed API:

| | read | update | delete | list | admin route |
| --- | --- | --- | --- | --- | --- |
| anonymous | 401 | 401 | 401 | 401 | 401 |
| owner | 200 | 200 | 200 | 200 (own) | 403 |
| other user | 403 | 403 | 403 | 200 (own) | 403 |
| admin | 200 | 200 | 200 | 200 (all) | 200 |

## Run

```sh
cd projects/security/access-control-lab
./setup-unix-access-control-lab.sh     # build, type check and tests
docker compose run --rm demo           # the walk-through
docker compose down -v --remove-orphans
```
