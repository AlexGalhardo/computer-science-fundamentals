# cpu-scheduling

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A CPU scheduling simulator. It runs the same set of processes under five policies (FCFS, shortest job first, round-robin, priority and multilevel feedback queue), draws the Gantt chart of each one and compares average waiting, turnaround and response time. It teaches that no policy wins every metric: what is best for the average is unfair to someone, and what answers fast finishes late.

Full explanation: [docs/en/operating-systems/cpu-scheduling.md](../../../docs/en/operating-systems/cpu-scheduling.md).

## Quiz topics it demonstrates

- `operating-systems` / `scheduling`: FCFS, SJF, round-robin and the quantum, priority and starvation, multilevel feedback queues, waiting, turnaround and response time.

## Run

The only requirement is Docker.

```sh
./setup-unix-cpu-scheduling.sh        # Linux and macOS
./setup-windows-cpu-scheduling.ps1    # Windows
```

The script builds the images, runs the tests of both languages and runs the demo.

## Demo

```sh
docker compose run --rm demo
```

It prints the Gantt chart of a five-process example under every policy and the comparison table on three generated workloads, and writes `results/results.md`, `results/results.json` and `results/results.js`. Then open `dashboard/index.html` straight from disk: the page draws the same Gantt charts and the tables, with no server and no network.

```text
RR(q=4)
|     A     |     B     |     C     |     D     |     A     |  E  |     C     |D |C |
0           4           8           12          16          20    22          26 27 28
average waiting 13.00, turnaround 18.60, response 6.40
```

`docker compose run --rm python-demo` prints the same text from the Python implementation.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/scheduler.ts` | the engine and the five policies (reference implementation) |
| `ts/src/gantt.ts` | the text Gantt chart |
| `ts/src/workload.ts` | reproducible workload generator |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tables and result files |
| `python/scheduler.py`, `python/cli.py` | the same simulator in Python |
| `dashboard/` | static page (HTML, built Tailwind CSS v4, no CDN) |
| `results/` | committed tables |

Each language folder has its own Dockerfile on a pinned image (`oven/bun:1.4.2`, `python:3.14.8-slim-trixie`) and no dependency beyond the test and lint tools.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

The tests check the textbook examples documented in the docs page, the Gantt output, and that every policy gives each process exactly its burst with no overlap.

## Results

The committed table is [results/results.md](results/results.md). The simulation uses abstract time units and a seeded generator, so the numbers are the same on any machine.
