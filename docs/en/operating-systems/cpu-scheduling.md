# CPU scheduling simulator

> Versão em português: [docs/pt/operating-systems/cpu-scheduling.md](../../pt/operating-systems/cpu-scheduling.md)

Mini-project: [`projects/operating-systems/cpu-scheduling`](../../../projects/operating-systems/cpu-scheduling/). Plan item: MP-OS-1. Quiz topic: `operating-systems` / `scheduling`.

## What it teaches

When several processes are ready and there is one CPU, the scheduler decides who runs. The decision is a trade: a policy that minimises the average waiting time can leave one process waiting for a very long time, and a policy that answers every process quickly makes all of them finish later. The simulator makes the trade visible by running the same processes under five policies.

## The three times

| Metric | Definition | Who cares |
| --- | --- | --- |
| Turnaround | completion minus arrival | batch jobs |
| Waiting | turnaround minus CPU burst, the time spent in the ready queue | everyone |
| Response | first time on the CPU minus arrival | interactive users |

The tables also show the **longest wait** of any process, a simple indicator of fairness and of starvation.

## The policies

| Policy | Rule | Strength | Weakness |
| --- | --- | --- | --- |
| FCFS | arrival order, runs to completion | simple, no starvation | a long job delays every short one behind it (convoy effect) |
| SJF | shortest burst first, runs to completion | lowest average waiting when jobs are available together | needs the bursts in advance, long jobs can starve |
| Round-robin | each runs at most one quantum, then goes to the tail | good response time | more context switches, longer turnaround |
| Priority | lowest priority number first, runs to completion | important work first | low priority can starve (fixed with aging) |
| Multilevel feedback | starts at the top level with a short quantum, is demoted when it uses the whole quantum, each level doubles the quantum | short and interactive work finishes first with no knowledge of the bursts | CPU-bound work waits the longest |

Conventions of this simulator: time is an integer unit, a context switch costs nothing, ties are broken by time in the queue, and a process that arrives while another runs enters the queue before the running one goes back to the tail. In the multilevel feedback queue a running process is not interrupted in the middle of its quantum by an arrival.

## Worked examples checked by the tests

All processes arrive at time 0 unless stated.

| Policy | Bursts | Schedule | Result |
| --- | --- | --- | --- |
| FCFS | 24, 3, 3 | P1 0-24, P2 24-27, P3 27-30 | waits 0, 24, 27: average 17 |
| FCFS | 6, 3, 3 | P1 0-6, P2 6-9, P3 9-12 | average waiting 5, turnaround 9 |
| SJF | 8, 4, 2, 6 | P3 0-2, P2 2-6, P4 6-12, P1 12-20 | average waiting 5, turnaround 10 |
| Round-robin, q = 4 | 24, 3, 3 | P1 0-4, P2 4-7, P3 7-10, P1 10-30 | waits 6, 4, 7 |
| Round-robin, q = 2 | 3, 5, 2 | P1 0-2, P2 2-4, P3 4-6, P1 6-7, P2 7-10 | completions 7, 10, 6 |
| Priority | 10, 1, 2, 1, 5 with priorities 3, 1, 4, 5, 2 | P2 0-1, P5 1-6, P1 6-16, P3 16-18, P4 18-19 | waits 6, 0, 16, 18, 1: average 8.2 |
| Multilevel feedback, quanta 1, 2, 4, ... | one job of 40 | 1 + 2 + 4 + 8 + 16 + 9 | dispatched 6 times |
| Multilevel feedback, quanta 2, 4, 8 | A(arrival 0, burst 8), B(arrival 1, burst 2) | A 0-2, B 2-4, A 4-10 | B turnaround 3, A turnaround 10 |

## Gantt chart

A Gantt chart draws the schedule on a time line. The CLI prints it as text, and the static page `dashboard/index.html` draws it as coloured bars, one colour per process, so the same process can be followed across the policies.

```
SJF
|           A           |  E  |     B     |      D       |            C             |
0                       8     10          14             19                         28
```

## Comparison on generated workloads

Three workloads of 200 processes come from a linear congruential generator with a fixed seed: `interactive` (bursts 1 to 8), `cpu-bound` (20 to 60) and `mixed` (80% of bursts 1 to 6, 20% of 30 to 80). Arrival gaps keep the CPU busy about 90% of the time. The full table is in [`results/results.md`](../../../projects/operating-systems/cpu-scheduling/results/results.md). The mixed workload:

| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 120.56 | 134.04 | 120.56 | 338 |
| SJF | 40.93 | 54.41 | 40.93 | 942 |
| RR(q=4) | 67.38 | 80.86 | 15.47 | 658 |
| Priority | 102.35 | 115.83 | 102.35 | 892 |
| MLFQ(q=2,levels=3) | 56.34 | 69.81 | 2.56 | 718 |

How to read it:

- SJF has the lowest average waiting time and the worst longest wait: the long jobs pay for the average.
- FCFS has the worst average and the best longest wait: nobody is overtaken.
- Round-robin and the multilevel feedback queue cut the response time by an order of magnitude, without knowing the bursts.
- The multilevel feedback queue beats round-robin here because it lets short jobs finish at the top level.

## Run it

```sh
cd projects/operating-systems/cpu-scheduling
./setup-unix-cpu-scheduling.sh          # or setup-windows-cpu-scheduling.ps1
docker compose run --rm demo            # charts, tables and results/
docker compose run --rm python-demo     # the same output from Python
```

## Two languages

TypeScript is the reference implementation. The Python version is the same algorithm with dataclasses and small policy classes. Both use the same generator and the same seed, and their outputs are identical, which is a cheap and strong cross-check of the two implementations.

## Source

Tanenbaum, Modern Operating Systems (4th edition), chapter 2, section 2.4.
