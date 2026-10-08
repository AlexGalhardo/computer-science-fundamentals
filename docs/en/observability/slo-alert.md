# SLO and alert (MP-OBS-3)

> Versão em português: [docs/pt/observability/slo-alert.md](../../pt/observability/slo-alert.md)

Mini-project: [`projects/observability/slo-alert`](../../../projects/observability/slo-alert/README.md). Quiz topics: `sli-slo-error-budgets`, `alerting`, `metric-types-cardinality`, `prometheus-grafana-loki-tempo`.

## The problem

"Alert when CPU is above 90%" pages people for things users never notice and stays silent while users suffer. An alert should say that **users are being hurt, faster than was agreed to be acceptable**. To write that as a rule, four things have to be defined in order.

## 1. SLI: what is measured

A service level indicator is a ratio: good events over valid events.

| Objective | Good event | Valid event |
| --- | --- | --- |
| Availability | a request that did not fail (no 5xx) | every request |
| Latency | a successful request that took 100 ms or less | every successful request |

The latency indicator is a share of requests under a threshold, not an average: an average of 60 ms can hide one request in ten taking 400 ms. With a Prometheus histogram the share is one division, because buckets are cumulative: `le="0.1"` already counts every request of 100 ms or less. The threshold of the objective therefore has to be one of the bucket limits.

Failed requests are left out of the latency histogram. A 503 is refused in under a millisecond, and counting it would make latency look better exactly when the service is failing.

## 2. SLO and error budget

The objective is a target for the indicator over a window: 99% over 30 days. The **error budget** is what the objective leaves over: 1% of requests may fail. It is a budget because it is meant to be spent, on releases, experiments and unplanned failures. An objective of 100% would leave nothing, and no change could ever be made safely.

## 3. Burn rate

```
burn rate = share of bad events / error budget
```

| Burn rate | Meaning for a 30-day window (720 hours) |
| --- | --- |
| 1 | The budget lasts exactly 30 days |
| 6 | Gone in 720 / 6 = 120 hours (5 days) |
| 14.4 | Gone in 720 / 14.4 = 50 hours. One hour spends 14.4 / 720 = 2% |

Burn rate turns "how bad is it" into "how long until the budget is gone", which is what decides between a page and a ticket.

## 4. From PromQL to rules

A **recording rule** stores the result of an expression as a new series. The indicator:

```yaml
- record: job:slo_errors_per_request:ratio_rate5m
  expr: |
    sum by (job) (rate(http_requests_total{code=~"5.."}[5m]))
    /
    sum by (job) (rate(http_requests_total[5m]))
```

`rate()` of a counter is requests per second; dividing two rates gives a share from 0 to 1. One detail matters: the series `code="503"` must exist with value 0 before the first failure. A series that does not exist is not zero, it is missing, and the ratio would have no value.

The burn rate is the indicator divided by the budget, and the alert compares it with a threshold in **two windows**:

```yaml
- alert: AvailabilityBudgetBurn
  expr: |
    job:slo_availability_burn_rate:ratio_rate5m > 14.4
    and
    job:slo_availability_burn_rate:ratio_rate1m > 14.4
  for: 10s
  labels:
    severity: page
```

- The **long window** proves that a real part of the budget went. One failed request in a quiet minute does not page.
- The **short window** proves that it is still happening. When the problem ends, the short window empties quickly and the `and` becomes false, although the long window still remembers.
- **`for`** asks the condition to hold before firing. Until then the alert is `pending`.

The lab uses 5 minutes and 1 minute. Production uses 1 hour and 5 minutes with the same thresholds.

## 5. Testing rules without a service

`promtool test rules` feeds invented samples to the rules and checks the series and alerts that come out at chosen moments:

```yaml
input_series:
  - series: 'http_requests_total{job="shop", code="200"}'
    values: "0+135x121"          # +135 every 15 s = 9 requests per second
  - series: 'http_requests_total{job="shop", code="503"}'
    values: "0x40 60+60x39 2400x40"   # nothing, then 4 per second for 10 minutes, then nothing
alert_rule_test:
  - eval_time: 16m
    alertname: AvailabilityBudgetBurn
    exp_alerts: [ ... ]          # firing: 4 of 13 fail, burn rate 30.77
  - eval_time: 21m30s
    alertname: AvailabilityBudgetBurn
    exp_alerts: []               # resolved 90 s after the end; the 5 m window still burns at 23.3
```

Thirty minutes of history run in milliseconds, and a mistake in a threshold is found before any incident.

## 6. The real incident

The shop serves 8 requests at a time; each request in flight slows the others, and beyond 8 it answers 503. k6 with 30 virtual users is enough to break both objectives. Measured in the lab:

| Moment | Seconds |
| --- | --- |
| Load starts → availability alert pending | 4 |
| Load starts → firing, receiver notified | 14 |
| Load stops → alert resolved | 53 |
| Burn rate of the 5 m window at that moment | 77.7 (threshold 14.4) |

Prometheus decides when an alert fires. **Alertmanager** decides who hears about it: it groups alerts (`group_by`), waits a little for related ones (`group_wait`), and sends a `resolved` notification when they end. Here the receiver is a local webhook.

## What to remember

- An SLI is good events over valid events. A latency SLI is a share under a threshold, not an average.
- The error budget is 1 minus the objective, and it exists to be spent.
- Burn rate = bad share / budget. 14.4 spends 2% of a 30-day budget in one hour.
- Two windows: the long one avoids noise, the short one makes the alert stop when the problem stops.
- Rules are code. They have unit tests.
- A load test targets only a service you own. Here k6 refuses anything that is not local.

## Sources

- Majors, Fong-Jones and Miranda, *Observability Engineering*, chapters 12 and 13.
- Google, *The Site Reliability Workbook*, chapter 5 (alerting on SLOs).
- Prometheus documentation: recording rules, alerting rules, unit testing for rules, histograms, Alertmanager.
