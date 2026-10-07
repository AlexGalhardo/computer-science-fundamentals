# passwords-sessions-lab

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

> **Security lab, vulnerable on purpose.** The code in `ts/src/vulnerable/` exists only to make flaws observable inside this lab. Never copy it, import it or deploy it.

How passwords should be stored and how a login should be protected. The lab has two parts. The first one stores the same fake password with four schemes (plain text, MD5, salted SHA-256 and Argon2id), shows what each one writes in the table and measures how many hashes per second each one computes. The second one is a small login API in two versions: the vulnerable one has no attempt limit, keeps the same session id across the login (session fixation), sends a cookie with no protective attribute and tells an unknown user from a wrong password; the fixed one closes each of those.

Code: MP-SEC-6. Full explanation: [docs/en/security/passwords-sessions-lab.md](../../../docs/en/security/passwords-sessions-lab.md).

## Quiz topics it demonstrates

- `security` / `authentication`: password storage (salt, fast hash against slow memory-hard function, Argon2id parameters, upgrade of old hashes on login), attempt limiting and lockout, generic error messages
- `security` / `sessions-cookies`: server-side sessions, session fixation and id rotation, logout and timeouts, the `HttpOnly`, `Secure` and `SameSite` attributes and the `__Host-` prefix

## Run

The only requirement is Docker.

```sh
./setup-unix-passwords-sessions-lab.sh        # Linux and macOS
./setup-windows-passwords-sessions-lab.ps1    # Windows
```

The script builds the image, runs the type check and the tests on an internal network, and removes everything at the end.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Part 1 prints what each scheme stores for `alice-fake` and `bob-fake`, who chose the same fake password: identical rows for plain text and MD5, different rows for salted SHA-256 and Argon2id. Part 2 prints the same seven login steps twice. On the vulnerable API the cookie has only `Path`, the session id from before the login answers as `alice-fake` after it and still works after logout, the two error messages differ, and the sixth wrong password is evaluated like the first. On the fixed API the same requests get a `__Host-` cookie with every attribute, a new id on login, `401` for the old one, one generic error and `429` after five failures, while a normal login still answers `200`.

## Benchmark

```sh
docker compose run --rm bench
docker compose down -v --remove-orphans
```

On Linux, start it as your own user, because the container writes into `results/`: `HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose run --rm bench`. Without the variables it runs as uid 1000.

It prints the table and writes [`results/results.md`](results/results.md) and `results/results.json`, with the machine, the runtime version, the Argon2 parameters and the command. Each scheme runs one warm-up run (discarded) and five measured runs on one thread; the table reports the median, the slowest and the fastest run. It takes a few seconds and is not part of the tests.

Committed run (AMD Ryzen 7 5700X3D, Bun 1.4.2 in Docker, one thread):

| Scheme | Hashes/s (median) | Min to max | Time per hash | Cost of one hash against MD5 |
| --- | --- | --- | --- | --- |
| plain text | not a hash | | about 0 | none |
| MD5, no salt | 843,636 | 797,901 to 890,710 | 1.19 µs | 1x |
| SHA-256, 16-byte salt | 548,724 | 500,384 to 624,058 | 1.82 µs | 1.5x |
| Argon2id, 19 MiB, t=2, p=1 (the lab policy) | 22 | 19.5 to 23.1 | 45 ms | about 38,000x |
| Argon2id, 64 MiB, t=3, p=1 | 3.5 | 3.2 to 3.8 | 285 ms | about 241,000x |

What the numbers mean for defence:

- **Read the rate from the side of whoever stole the table.** The number of hashes per second a server computes is also the number of guesses per second that one CPU core can test against a leaked table. Hardware built for the job is many orders of magnitude faster than this single core for MD5 and SHA-256.
- **A fast hash makes every guess almost free.** MD5 and SHA-256 were designed to digest large files quickly. That is a quality for checksums and the wrong property for passwords, which are short and often predictable.
- **A slow, memory-hard function makes every guess expensive.** One Argon2id hash here costs about 45 ms and 19 MiB. A user pays that once per login and does not notice. Somebody testing guesses pays it for every single guess, and the memory requirement is what stops cheap parallel hardware from getting the usual speed-up.
- **The salt does a different job.** It does not slow anything down: salted SHA-256 is as fast as MD5. It makes equal passwords hash differently and makes tables computed in advance useless, so each stolen row has to be worked on separately.
- **The cost is a dial.** The two Argon2id rows differ only in parameters. Raise them as hardware improves; `needsRehash` then upgrades the stored hashes as users log in.

This is a measurement of the hash functions. It hashes one fake password repeatedly; it never compares against a stored hash and it tries no candidate passwords.

## Tests

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

The container runs `tsc --noEmit` and then `bun test`.

| File | What it proves |
| --- | --- |
| `ts/tests/password-storage.test.ts` | MP-SEC-6.1. Two fake users with the same password: same plain text, same MD5, different salted SHA-256, different Argon2id. Verification accepts the right password and refuses a wrong one in every scheme. `needsRehash` is true for legacy schemes and for Argon2id below the policy. `verifyAndUpgrade` turns an MD5 hash into Argon2id on a successful check and changes nothing on a failed one |
| `ts/tests/login.test.ts` | MP-SEC-6.2. The same scenario functions run against both versions: cookie flags, session rotation on login, logout, error messages, lockout and the per-client throttle. Vulnerable: each flaw is observable. Fixed: each attempt is blocked and normal login works. Also: the lockout expires, follows the account across clients and does not reveal which names exist; idle and absolute timeouts; Zod validation; the MD5 row of `carol-legacy-fake` becomes Argon2id on login |
| `ts/tests/limiter.test.ts` | The attempt limiter alone, with an injected clock: lock, countdown, window, reset and bounded memory. No test sleeps |
| `ts/tests/bench.test.ts` | The arithmetic of the benchmark (median, warm-up discarded) with a made-up subject |
| `ts/tests/network.test.ts` | The container cannot reach the outside: a request to `http://example.com` fails |

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/data.ts` | Fake accounts, the fixed list of six wrong passwords and the clock type |
| `ts/src/vulnerable/vulnerable-password-storage.ts` | Plain text, unsalted MD5 and salted SHA-256. Vulnerable on purpose |
| `ts/src/vulnerable/vulnerable-app.ts` | The ElysiaJS login API with the five flaws, each marked `FLAW`. Vulnerable on purpose |
| `ts/src/fixed/fixed-password-storage.ts` | Argon2id through `Bun.password`, `needsRehash`, constant-time comparison and upgrade on login |
| `ts/src/fixed/fixed-attempt-limiter.ts` | Failure counter with a temporary lockout and an injectable clock |
| `ts/src/fixed/fixed-sessions.ts` | Server-side session store with random ids and idle and absolute timeouts |
| `ts/src/fixed/fixed-app.ts` | The same login API with every flaw closed and the body validated with Zod |
| `ts/src/scenario.ts` | The attempts, written once and run against both versions |
| `ts/src/demo.ts` | The walk-through printed by the `demo` service |
| `ts/src/bench.ts` | The benchmark run by the `bench` service |
| `ts/src/http.ts` | Reading `Cookie` and `Set-Cookie` headers |
| `results/` | The committed benchmark results |

## Why the flaw happens

**Storage.** A password table is treated like any other column, or protected with the first hash function that comes to mind.

- Plain text: whoever reads the table (a leaked backup, an SQL injection, an insider) reads every password, and people reuse passwords on other sites.
- Unsalted MD5: equal passwords give equal hashes, so the table shows who shares a password and precomputed tables apply. And MD5 is fast.
- Salted SHA-256: the salt fixes the first problem and leaves the second. "It is a strong hash" is true for files and irrelevant here: speed is the problem.

**Login.** Each flaw is something the code does not do, so nothing fails for an honest user.

```ts
// vulnerable: the browser already had a session id, so the server keeps it
current.session.username = username;
```

- **No attempt limit.** The thousandth wrong password is evaluated like the first.
- **Session fixation.** The site hands a session id to every visitor, and the login marks that same id as logged in. Whoever knew the id before the login (they planted it in the victim's browser, or read it on a shared computer) is inside the account afterwards without knowing the password.
- **Logout only on the browser.** The cookie is cleared and the session stays valid on the server, with no timeout.
- **Bare cookie.** Without `HttpOnly`, a script on the page reads it. Without `Secure`, it travels over plain HTTP. Without `SameSite`, other sites can make the browser send it.
- **Two error messages.** `unknown_user` against `wrong_password` tells anybody which usernames are registered.

## How to prevent it

- **Store passwords with Argon2id**, with a random salt per password (the function generates it) and parameters as high as the login can afford. The lab uses the OWASP minimum: 19 MiB, 2 passes, 1 thread.
- **Keep the scheme and the parameters inside the stored value** and upgrade on login: the only moment the server holds the real password is a successful login, so that is when an old hash is replaced (`verifyAndUpgrade`, `needsRehash`).
- **Limit attempts twice.** Per account (5 failures in 15 minutes lock it for 15 minutes) and per client (10 failures in 15 minutes). Count by the name that was typed, whether it exists or not, so the lockout itself does not reveal which accounts are real. Identify the client by the connection address or by a header written by your own proxy.
- **Rotate the session id on every login**: destroy whatever id the browser arrived with and issue a new random one (32 bytes from `node:crypto`). **Destroy the session on the server at logout**, and expire it by inactivity (15 minutes) and by age (8 hours).
- **Set every cookie attribute**: `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, with no `Domain`. The `__Host-` prefix makes the browser refuse the cookie unless it is `Secure`, has `Path=/` and has no `Domain`, so another subdomain cannot overwrite it.
- **One generic answer** for an unknown user and a wrong password, with the same status and body, and roughly the same time: an unknown user is verified against a dummy Argon2id hash.
- **Compare in constant time** (`timingSafeEqual`, and `Bun.password.verify` for Argon2id).
- **Validate the body with Zod**: a strict object, a username pattern and a maximum password length, so nobody makes the server hash megabytes.

The lockout has a cost: anybody can lock somebody else's account for 15 minutes by typing wrong passwords. That is why it is temporary, and why real systems add a second factor, progressive delays or a challenge before the lock.

## What does not work as a fix

- **A faster or "stronger" general hash** (SHA-512, SHA-3), or hashing twice. They are all fast; the problem is the cost per guess.
- **One salt for the whole table**, or a salt derived from the username. Equal passwords hash equally again, and one precomputed table serves every row.
- **A secret "pepper" or encryption instead of a slow hash.** A pepper is a reasonable extra layer on top of Argon2id, and it only helps while its key stays out of the leak. Encryption is reversible: whoever gets the key gets every password.
- **Password composition rules alone.** They change which passwords people choose and do nothing about a fast hash or an unlimited login.
- **A limit only per IP address**, or only per account. The first misses many addresses trying one account, the second misses one address trying many accounts. A limit kept in the browser (a cookie, a hidden field, JavaScript) is no limit: the caller controls it.
- **A permanent lockout.** It turns the protection into a way of disabling other people's accounts.
- **Clearing the cookie at logout**, or keeping the id and only "marking it as logged in". The server must forget the old id.
- **`HttpOnly` as the cure for XSS.** It stops a script from copying the cookie, and a script on the page can still send requests as the user. Each attribute closes one door.
- **A vague message with a different status, body or timing.** If the two answers can be told apart in any way, the names are still enumerable. The sign-up and password-reset pages need the same care.

## Safety scope of the lab

- Everything runs locally in Docker, on a compose network with `internal: true`. No port is published and a test proves the container cannot reach the outside.
- Both APIs run in memory, inside the test process. No request leaves the container, and nothing here targets any other system.
- All data is fake: `alice-fake`, `bob-fake`, `carol-legacy-fake`, passwords such as `lab-fake-password-alice`.
- There is no cracking tool. The benchmark hashes one fake password and compares nothing. The attempt-limit scenario sends a fixed list of six obviously wrong values (`wrong-fake-1` to `wrong-fake-6`) only to count attempts.

## Versions

| Component | Version |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
