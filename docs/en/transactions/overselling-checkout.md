# Overselling at checkout (MP-TX-2)

> Versão em português: [docs/pt/transactions/overselling-checkout.md](../../pt/transactions/overselling-checkout.md) · Versión en español: [docs/es/transactions/overselling-checkout.md](../../es/transactions/overselling-checkout.md)

Mini-project: [`projects/transactions/overselling-checkout`](../../../projects/transactions/overselling-checkout/README.md). Quiz topics: `locking`, `isolation-levels-anomalies`, `acid-properties`, `mvcc`.

## The bug

```text
buyer A: SELECT stock  -> 10
buyer B: SELECT stock  -> 10      (A has not written yet)
buyer A: UPDATE stock = 9, INSERT order
buyer B: UPDATE stock = 9, INSERT order     <- two orders, one unit gone
```

This is a **lost update** caused by a read, a decision in the application, and a write based on the old read. Wrapping it in `BEGIN ... COMMIT` does not help: at `READ COMMITTED`, the PostgreSQL default, a plain `SELECT` takes no row lock and every transaction is free to read the same stock. A transaction gives atomicity (the stock update and the order go together), which is a different promise from isolation.

The stock column never becomes negative, because each buyer writes an absolute value. The damage is only visible in the `orders` table, which is why this bug survives a quick look at the product.

## Three fixes

| Fix | Idea | What the buyer pays |
| --- | --- | --- |
| Optimistic, version column | Read `stock` and `version`. Write with `WHERE version = <the one I read>`. Zero rows updated means someone else won: read again and retry | Wasted work and retries when many compete for the same row |
| Pessimistic, `SELECT ... FOR UPDATE` | Lock the row at the read. The next buyer waits at its own `SELECT` and then sees the new stock | Waiting in line. The lock is held while the application thinks |
| `SERIALIZABLE` with retry | Same code as the bug, stronger isolation level. PostgreSQL aborts with SQLSTATE `40001` the transactions that could not have run one after the other | The application must catch `40001` and run the whole transaction again |

All retries use a short random pause (jitter), so the losers do not come back at the same instant, and stop after a maximum number of attempts with an honest `503`.

A single SQL statement, `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`, also fixes this particular case, because the check and the write happen inside the database on the current row. The mini-project keeps the read and the write apart on purpose: real checkouts do work between them (prices, coupons, payment), and that is where the three fixes above are needed.

## Results

The committed table is in the [README](../../../projects/transactions/overselling-checkout/README.md#results) and in `results/results.md`, with the machine and the versions. In the measured run, `naive` created 150 to 180 orders for 10 units, and each fix created exactly 10 in every round.

How to read the throughput column without fooling yourself:

- Only 10 of the 200 requests can succeed. After the stock reaches zero, the remaining buyers only read and get `409`, and how fast that happens dominates the number.
- `pessimistic` is the slowest because all 200 buyers stand in the same line, including the 190 that will only find the product sold out.
- `serializable` and `optimistic` do not line up to read, so the sold-out answers return quickly. Their cost is the retries of the losers, which grows with the number of units really disputed.
- The spread between rounds is large (see the ± column). A difference smaller than it is not a result.

The workload is one hot row. With many products and little contention, the picture changes: optimistic control almost never retries, and pessimistic locks are rarely waited for.

## Load test rules

k6 runs from the pinned image `grafana/k6:2.3.0` on the internal docker-compose network. No port is published, the default target is the `api` service, and the script throws before sending anything when `BASE_URL` is not `localhost`, `127.0.0.1` or `api`. Raw k6 output goes to `k6-results/`, which is git-ignored.

## Acceptance criteria

| Item | How it is verified |
| --- | --- |
| MP-TX-2.1 naive checkout sells more than 10 under 200 concurrent buyers | `./load-test-unix.sh` (or `.ps1`): the report step fails unless every `naive` round oversold. Also `tests/checkout.test.ts` |
| MP-TX-2.2 each fix sells exactly 10 | Same command: the report step fails unless every round of every fix ends with 10 orders and stock 0. Also `tests/checkout.test.ts` |
| MP-TX-2.3 table with requests per second and rejected requests | `results/results.md`, written by the report step |

## Run

```sh
cd projects/transactions/overselling-checkout
./setup-unix-overselling-checkout.sh     # tests
./load-test-unix.sh                      # k6 and the results table
```
