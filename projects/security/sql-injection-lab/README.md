# sql-injection-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A defensive, local lab about SQL injection. The same small ElysiaJS app (a login and a product search on PostgreSQL) exists twice: a version that builds its SQL by concatenating strings, labelled `vulnerable`, and a fixed version with parameterised queries, input validation and a least-privilege database role. One scenario runs against both and shows why string concatenation is exploitable and why placeholders are the fix.

Code: MP-SEC-1. Full explanation: [docs/en/security/sql-injection-lab.md](../../../docs/en/security/sql-injection-lab.md).

> The code in `ts/src/vulnerable/` is vulnerable on purpose. It exists only to be studied inside this lab. Never copy it and never import it from another project.

## Quiz topics it demonstrates

- `security` / `injection`: concatenated SQL, parameterised queries, why blocklists and manual escaping fail
- `security` / `owasp-threat-modelling`: injection in the OWASP Top 10, defence in depth, least privilege as damage limitation

## Run

The only requirement is Docker.

```sh
./setup-unix-sql-injection-lab.sh        # Linux and macOS
./setup-windows-sql-injection-lab.ps1    # Windows
```

The script builds the image, runs the type check and the tests against a PostgreSQL container on an internal network, and removes the containers and volumes at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

It prints a narrated walk-through, in English, Portuguese and Spanish (each step has an `EN:`, a `PT:` and an `ES:` line): the SQL text the vulnerable version sends to the database, the scenario against the vulnerable app (login without a password, the fake secrets in the search result), the same scenario against the fixed app (both attempts fail, normal use works), and the effect of the read-only role.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| File | What it proves |
| --- | --- |
| `ts/tests/scenario.test.ts` | Vulnerable app: the tautology logs in and the `UNION` returns the secrets table. Fixed app: the same two requests are blocked, and a valid login, a wrong password and a normal search still behave correctly. Two more tests call the fixed queries directly, without the validation layer, to show that the placeholders alone stop the injection |
| `ts/tests/least-privilege.test.ts` | The role of the fixed app reads `users` and `products`, cannot read `secrets`, and cannot `INSERT`, `UPDATE`, `DELETE` or `CREATE TABLE`. Even the vulnerable query cannot leak the secrets through that role |
| `ts/tests/network-isolation.test.ts` | A request from inside the container to an external host fails |

## Structure

| Path | What it is |
| --- | --- |
| `db/init.sql` | Schema, fake data, and the `lab_readonly` role |
| `ts/src/vulnerable/vulnerable-queries.ts` | **Vulnerable on purpose**: SQL built by string concatenation |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable on purpose**: ElysiaJS routes with no validation, connected as the database owner |
| `ts/src/fixed/fixed-queries.ts` | The same queries with placeholders (`$1`, `$2`) |
| `ts/src/fixed/fixed-app.ts` | The same routes with Zod validation, connected with the read-only role |
| `ts/src/scenario.ts` | The one scenario that runs against both apps, in-process |
| `ts/src/demo.ts` | The narrated demo |
| `ts/src/config.ts`, `ts/src/db.ts` | Validated environment, connection pool, shared types |

Routes of both apps: `POST /login` with `{ "username", "password" }`, and `GET /products?q=<term>`.

## Why the flaw happens

The vulnerable code builds the query like this:

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

The database receives one string. It has no way to know which characters the programmer wrote and which ones the user typed, so it parses everything as SQL. **Data is being interpreted as code.** A quote typed by the user ends the text literal the programmer opened, and whatever follows is read as SQL.

The lab uses two demonstration inputs, hard-coded in `ts/src/scenario.ts`:

| Where | Input | What the database ends up running |
| --- | --- | --- |
| Username of the login | `' OR '1'='1' --` | `... WHERE username = '' OR '1'='1' --' AND password_hash = '...'`. The condition is true for every row and the password check became a comment, so the first user is logged in without a password |
| Search term | `%' UNION SELECT id, label, secret_value FROM secrets --` | The product query, followed by a second query whose rows are appended to the result. The response of a product search now contains the `secrets` table |

Two other mistakes make it worse. The app accepts any input without checking it. And it connects to PostgreSQL as the owner of the database, so an injected query can read every table.

## How to prevent it

1. **Parameterised queries. This is the fix.** The SQL text is a constant with placeholders, and the values are sent separately:

   ```ts
   pool.query("SELECT id, username FROM users WHERE username = $1 AND password_hash = $2", [username, hash]);
   ```

   PostgreSQL parses the SQL text first and only then binds the values. A value is never parsed, so it cannot become SQL, whatever characters it contains. The tautology is now simply a username that does not exist. ORMs and query builders do the same thing for you, as long as you do not fall back to raw string interpolation inside them.
2. **Validate input (allowlist).** The fixed app describes with Zod what a username looks like (`^[a-z0-9-]{3,32}$`) and limits the size of the search term. This rejects nonsense early and is good hygiene, but it is a second layer: free-text fields such as the search must accept quotes, and they stay safe only because of the placeholders.
3. **Least privilege.** The fixed app connects as `lab_readonly`, which has `SELECT` on `users` and `products` and nothing else. If a concatenated query ever slips into the code, it cannot read `secrets` and cannot write. This does not remove an injection, it limits what one can reach.
4. **Identifiers cannot be parameters.** A table or column name (for example a "sort by" option) cannot be sent as `$1`. Map the user's choice to a fixed list of names written in the code, and never put the input itself in the SQL text.

## What does not work as a fix

- **Blocklists.** Removing or refusing "dangerous" pieces such as `'`, `--`, `OR` or `UNION` fails in both directions. It breaks legitimate input (a customer called O'Brien, a product called "Union Jack flag"), and it is incomplete by nature: SQL has many ways to write the same thing, and the list only knows the ones its author thought of. The filter leaves the real problem in place, which is data being parsed as code.
- **Escaping by hand.** Doubling quotes with a `replace` is the database driver's job done badly. It is easy to forget in one of fifty queries, it does nothing for values placed outside quotes (a numeric `id` needs no quote to be injected), and the correct rules depend on the database, its settings and the character encoding.
- **Validation alone.** Useful, but a free-text field cannot forbid quotes, and one field that somebody forgot to validate is enough.
- **Hiding error messages.** Not showing database errors to the user is correct, but the query is still injectable without them.
- **Stored procedures that concatenate.** A procedure that builds SQL text from its arguments and executes it has the same flaw, only in another place.
- **Least privilege alone.** In this lab the read-only role stops the `UNION` from reading `secrets`, but the login bypass would still work, because reading `users` is something the app legitimately needs.

## Safety scope of the lab

- Everything runs locally in Docker. The compose network is `internal: true`, so no container reaches the internet, and a test proves it.
- **No port is published on the host.** The plan allowed binding the app to `127.0.0.1`. This area goes further: the apps are never even started as servers. The tests and the demo call them in-process, so the scenario cannot be pointed at a URL.
- All data is fake: users such as `alice-fake`, passwords such as `lab-fake-password`, and "secrets" such as `FAKE-CARD-0000-0000-0000-0001`.
- The two demonstration inputs only make sense against the schema of this lab. There is no scanner, no payload list and no evasion technique here.
- The package is `private` and the vulnerable files are labelled as such in their names and in their first lines.

## Versions

| Component | Version |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
