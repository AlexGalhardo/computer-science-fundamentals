# Outbox and saga: scenario results

Generated at 2026-10-07T22:45:58.578Z by `docker compose run --rm demo`, on `postgres:18.6-alpine`, `rabbitmq:4.3.6-alpine` and `oven/bun:1.4.2`.

| Scenario | Mode | Client got an answer | Order | Payment | Event reached the payment service |
| --- | --- | --- | --- | --- | --- |
| happy path | `dual-write` | yes | PAID | COMPLETED | yes |
| happy path | `outbox` | yes | PAID | COMPLETED | yes |
| crash between the write and the publish | `dual-write` | no (connection lost) | PENDING | none | **no, lost** |
| crash between the write and the publish | `outbox` | no (connection lost) | PAID | COMPLETED | yes |
| payment fails | `outbox` | yes | CANCELLED | FAILED | yes |

- **crash between the write and the publish**: the order service is killed (`process.exit(1)`) right after the order is committed, and Docker restarts it. With `dual-write` the order stays `PENDING` and no payment exists: the event was lost. With `outbox` the relay finds the event row after the restart and the saga finishes.
- **payment fails**: the amount is above the fake card limit, the payment service answers `PaymentFailed`, and the order service compensates by cancelling the order.
