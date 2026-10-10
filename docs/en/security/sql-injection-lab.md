# SQL injection lab (MP-SEC-1)

> Versão em português: [docs/pt/security/sql-injection-lab.md](../../pt/security/sql-injection-lab.md) · Versión en español: [docs/es/security/sql-injection-lab.md](../../es/security/sql-injection-lab.md)

Mini-project: [`projects/security/sql-injection-lab`](../../../projects/security/sql-injection-lab/README.md). Quiz topics: `injection`, `owasp-threat-modelling`.

This lab is defensive and educational. It runs only locally, in Docker, on an internal network with no published port, and all its data is fake. The vulnerable code exists to be compared with its fix, never to be reused.

## The concept

An injection happens whenever a program builds a command for another interpreter (SQL, a shell, HTML) by mixing its own text with text that came from outside. The interpreter receives one string and parses all of it. If the outside text contains the characters that have meaning in that language, **data becomes code**.

SQL injection is the best known case, and injection as a category has been in the OWASP Top 10 since its first edition. The cause is always the same, and so is the cure: keep code and data in separate channels.

## The flaw

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

With the username `' OR '1'='1' --`, the database receives:

```sql
SELECT id, username FROM users WHERE username = '' OR '1'='1' --' AND password_hash = '...'
```

The quote closed the literal, `OR '1'='1'` is true for every row, and `--` commented out the password check. The app takes the first row and logs that user in.

The search has the same flaw in a `LIKE` pattern. With one `UNION SELECT` appended, the result of a product search carries the rows of a table that no route was ever meant to read. In the vulnerable version this reaches every table, because the app also connects as the owner of the database.

Both inputs are hard-coded in `ts/src/scenario.ts` and only make sense against the schema of the lab.

## The fix

| Layer | What it does | What it does not do |
| --- | --- | --- |
| Parameterised queries | The SQL text is a constant with `$1`, `$2`. Values are bound after the text has been parsed, so they are never parsed themselves. **This removes the flaw** | Cannot parameterise identifiers (table and column names): map those to a fixed list in the code |
| Input validation (Zod) | Refuses input outside the expected shape, such as a username with quotes | Cannot forbid quotes in free text, so it never replaces the placeholders |
| Least-privilege role | The fixed app connects as `lab_readonly`: `SELECT` on `users` and `products` only | Does not stop an injection that stays within what the role may read |

What does not work: blocklists of "dangerous" words or characters (they break legitimate input and never cover every way of writing the same SQL), escaping quotes by hand (forgotten in one query, useless for values outside quotes, dependent on database and encoding), validation alone, hiding error messages, and stored procedures that concatenate text themselves.

A detail found while building the lab: with a Zod schema in the `query` option of a route, Elysia 1.4 splits a query value at commas into an array before validating it. The fixed search route therefore validates the term with Zod inside the handler, so a legitimate search containing a comma is accepted and reaches the database as one parameter.

## What the tests prove

One scenario function makes the same five requests to both apps: a valid login, a login with a wrong password, the tautology login, a normal search and the `UNION` search.

| Item | How it is verified |
| --- | --- |
| MP-SEC-1.1 internal network, fake data, no outside access | `tests/network-isolation.test.ts`: a request to `http://example.com` fails from inside the container. `docker-compose.yml` publishes no port and its only network is `internal: true` |
| MP-SEC-1.2 the vulnerable version has both flaws | `tests/scenario.test.ts`, vulnerable block: the tautology answers `200` with a logged-in user, and the `UNION` search returns the three fake secrets |
| MP-SEC-1.3 the fixed version blocks them and normal use works | `tests/scenario.test.ts`, fixed block: the tautology answers `422`, the `UNION` search answers `200` with zero rows, a valid login and a normal search still work. Two tests call the parameterised queries directly, without validation, and get the same safe result. `tests/least-privilege.test.ts`: `lab_readonly` gets SQLSTATE `42501` when reading `secrets` or writing |
| MP-SEC-1.4 documentation | The three READMEs have "Why the flaw happens", "How to prevent it" and "What does not work as a fix" |

## Run

```sh
cd projects/security/sql-injection-lab
./setup-unix-sql-injection-lab.sh     # type check and tests, then clean-up
docker compose run --rm demo          # narrated walk-through
docker compose down -v --remove-orphans
```
