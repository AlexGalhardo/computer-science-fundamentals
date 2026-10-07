# Passwords and sessions lab: storage, attempt limiting and session cookies (MP-SEC-6)

> Versão em português: [docs/pt/security/passwords-sessions-lab.md](../../pt/security/passwords-sessions-lab.md)

Mini-project: [`projects/security/passwords-sessions-lab`](../../../projects/security/passwords-sessions-lab/README.md). Quiz topics: `authentication`, `sessions-cookies`.

This is a defensive lab. It runs only in Docker, on an internal network, in memory and with fake data. The vulnerable code exists only to make the flaws observable, and the benchmark measures hash functions: it guesses nothing.

## The concept

A login has three moments, and each one has its own way of going wrong:

| Moment | Question | What protects it |
| --- | --- | --- |
| At rest | What does somebody learn from a stolen user table? | A slow, salted, memory-hard password hash |
| At the door | How many times may somebody try? | Attempt limiting, and answers that reveal nothing |
| After the door | What proves that the next request comes from the same person? | A random session id, rotated at login, in a well-protected cookie |

### Storing a password

The server never needs to know the password, only to recognise it. So it stores the output of a one-way function and repeats the computation at login. Three properties matter:

| Property | What it gives | Plain text | MD5 | Salted SHA-256 | Argon2id |
| --- | --- | --- | --- | --- | --- |
| One-way | The table does not show the passwords | no | yes | yes | yes |
| Salt (random, per password) | Equal passwords hash differently; precomputed tables are useless | no | no | yes | yes |
| Slow and memory-hard | Each guess against a stolen table is expensive | no | no | no | yes |

The salt is not a secret and is stored next to the hash. Argon2id writes everything in one string: `$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>`, where `m` is the memory in KiB, `t` the number of passes and `p` the number of threads.

### What the benchmark shows

`docker compose run --rm bench` hashes one fake password repeatedly and reports hashes per second: one discarded warm-up run and five measured runs per scheme, on one thread, with the median and the range. The committed run (AMD Ryzen 7 5700X3D, Bun 1.4.2 in Docker) is in [`results/results.md`](../../../projects/security/passwords-sessions-lab/results/results.md):

| Scheme | Hashes/s (median) | Time per hash |
| --- | --- | --- |
| MD5, no salt | 843,636 | 1.19 µs |
| SHA-256, 16-byte salt | 548,724 | 1.82 µs |
| Argon2id, 19 MiB, t=2, p=1 | 22 | 45 ms |
| Argon2id, 64 MiB, t=3, p=1 | 3.5 | 285 ms |

The rate is the server's cost per login and, read from the other side, the number of guesses per second one CPU core can test against a stolen table. A fast hash makes each guess almost free. Argon2id makes each one cost tens of milliseconds and megabytes of memory, about 38,000 times the cost of MD5 on this machine, while a user pays it once per login. The salt does not slow anything down (SHA-256 with a salt is as fast as MD5): its job is to make each row a separate problem. The two Argon2id rows show that the cost is a parameter to raise over time.

## The flaw

```
somebody else                       server (vulnerable)                     alice-fake
GET /home  ---------------------->  new session X, anonymous
        (X ends up in alice-fake's browser)
                                    POST /login, cookie sid=X  <----------  right password
                                    session X is now alice-fake
GET /me, cookie sid=X  ---------->  200 {"user":"alice-fake"}
```

The vulnerable API has five flaws, each one an omission:

| Flaw | What the code does |
| --- | --- |
| No attempt limit | Evaluates every wrong password, with no count |
| Session fixation | Keeps the session id the browser already had and marks it as logged in |
| Logout only on the browser | Clears the cookie and keeps the session valid on the server, with no timeout |
| Bare cookie | `sid=...; Path=/`, without `HttpOnly`, `Secure` or `SameSite` |
| User enumeration | Answers `unknown_user` or `wrong_password` |

It also stores the passwords as unsalted MD5.

## The fix

| Flaw | Fix in `ts/src/fixed/` |
| --- | --- |
| Weak storage | Argon2id through `Bun.password` (19 MiB, 2 passes). `needsRehash` and `verifyAndUpgrade` replace an old hash at the next successful login |
| No attempt limit | `AttemptLimiter`, twice: per account (5 failures in 15 minutes, locked for 15 minutes) and per client (10 failures). `429` with `Retry-After`. The clock is injected, so the tests do not sleep |
| Session fixation | On every login the old id is destroyed and a new one is created from 32 random bytes |
| Logout | The session is deleted on the server. Idle timeout of 15 minutes and absolute timeout of 8 hours |
| Bare cookie | `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, no `Domain` |
| User enumeration | One answer, `401 invalid_credentials`. An unknown user is verified against a dummy Argon2id hash, so the time is similar. The lockout counts by the name typed, existing or not |
| Unvalidated input | Zod: strict object, username pattern, password of at most 128 characters |

The order inside the fixed login matters: validate the body, check both limits, verify the password (always, even for an unknown name), record the failure or reset the count, and only then rotate the session.

### What each cookie attribute does

| Attribute | Closes |
| --- | --- |
| `HttpOnly` | Page scripts reading the cookie (`document.cookie`) |
| `Secure` | The cookie travelling over plain HTTP |
| `SameSite=Lax` | The cookie being attached to requests other sites start in the background |
| `__Host-` prefix | Another subdomain or an HTTP page overwriting the cookie: the browser demands `Secure`, `Path=/` and no `Domain` |
| `Max-Age` | The browser keeping the cookie past the absolute timeout (the server enforces it as well) |

### The trade-off of a lockout

A lock per account stops guessing and lets anybody lock somebody else out for a while. That is why it is temporary, why the per-client limit exists next to it, and why real systems add a second factor or progressive delays.

### What is not a fix

- A faster or "stronger" general hash, or hashing twice: the problem is the cost per guess.
- One salt for the whole table: equal passwords hash equally again.
- Encryption instead of hashing: whoever gets the key gets every password.
- A limit kept in the browser, a limit only per IP address, or a permanent lockout.
- Clearing the cookie at logout while the server keeps the session.
- A vague message with a different status, body or timing.

## What the tests prove

| Item | How it is verified |
| --- | --- |
| MP-SEC-6.1 a benchmark shows hashes per second for each scheme, on fake data only | `docker compose run --rm bench` prints the table and writes `results/results.md` and `results/results.json` with the machine, runtime, Argon2 parameters, command and the spread of five runs. `tests/bench.test.ts` checks its arithmetic |
| MP-SEC-6.1 same password, different hashes | `tests/password-storage.test.ts`: equal plain text and equal MD5 for two fake users, different salted SHA-256 and Argon2id; verification; `needsRehash`; upgrade from MD5 to Argon2id |
| MP-SEC-6.2 lockout | `tests/login.test.ts`: vulnerable, six wrong passwords are all evaluated and the right one works next. Fixed, the same scenario gets `401` five times and then `429`, even with the right password; the lock expires after 15 minutes with the injected clock. `tests/limiter.test.ts` covers the limiter alone |
| MP-SEC-6.2 cookie flags | `tests/login.test.ts`: vulnerable, the cookie has only `Path`. Fixed, `__Host-` name, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age`, no `Domain` |
| MP-SEC-6.2 session rotation on login | `tests/login.test.ts`: vulnerable, the id from before the login answers as `alice-fake`. Fixed, the login issues a different id and the old one gets `401` |
| MP-SEC-6.2 normal login still works | `tests/login.test.ts`, "normal use works", for both versions |
| Generic error, logout, timeouts, validation, upgrade on login | `tests/login.test.ts`, the remaining blocks |
| Lab isolation | `tests/network.test.ts`: a request to `http://example.com` fails from inside the container |

## Run

```sh
cd projects/security/passwords-sessions-lab
./setup-unix-passwords-sessions-lab.sh   # build, type check and tests
docker compose run --rm demo             # the walk-through
docker compose run --rm bench            # the benchmark
docker compose down -v --remove-orphans
```
