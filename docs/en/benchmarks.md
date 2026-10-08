# Benchmarks

> Versão em português: [docs/pt/benchmarks.md](../pt/benchmarks.md)

One contract and one runner for every benchmark of the repository, so a result in C++ and a result in Python can sit in the same table. Rules: [.claude/rules/load-tests.md](../../.claude/rules/load-tests.md).

## The contract

Every implementation reads its input, does the work, and prints **one JSON object on its last line of output**:

```json
{ "n": 100000, "elapsedMs": 4.59, "memoryKb": 10040, "language": "python", "implementation": "sum-loop", "checksum": "5000050000" }
```

| Field | Meaning |
| --- | --- |
| `n` | size of the input |
| `elapsedMs` | time of the measured section only, without runtime start-up and input parsing |
| `memoryKb` | peak resident memory of the process, in KiB |
| `language` | `ts`, `python`, `go`, `rust`, `cpp`, `java` or `elixir` |
| `implementation` | name of the algorithm or variant |
| `checksum` | optional digest of the output, to prove that implementations agree |

The JSON Schema is `tools/bench/schema.json`, generated from the Zod schema in `tools/bench/src/contract.ts`. Unknown fields are rejected.

## `bench.json`

Each mini-project with a benchmark has a `bench.json` describing a grid: every target (language and image) runs every implementation at every size, once per variant.

```json
{
	"project": "sample",
	"runs": 3,
	"warmup": 1,
	"sizes": [1000, 100000],
	"variants": ["default"],
	"maxN": { "bubble": 10000 },
	"targets": [
		{
			"language": "ts",
			"image": "oven/bun:1.4.2",
			"version": "bun --version",
			"implementations": ["sum-loop", "sum-formula"],
			"command": "bun run ts/bench.ts {implementation} {n}"
		}
	]
}
```

- `image` is a pinned image. Use `dockerfile` instead to build one from the project.
- `build` is an optional command run once in the container before measuring, for example a compile step.
- `maxN` caps an implementation, which is how quadratic algorithms are kept out of the largest sizes.
- `{implementation}`, `{n}` and `{variant}` are replaced in `command`.

## Running

```sh
bun run bench -- --project <name or path>
```

For each row the runner starts a container of the language image **with no network**, and inside it [hyperfine](https://github.com/sharkdp/hyperfine) runs the command `runs` times after `warmup` discarded runs. Measuring inside the container keeps the cost of starting Docker out of the numbers.

It writes, in `results/` of the mini-project:

| File | Use |
| --- | --- |
| `results.md` | the table for people, with machine, runtime versions and the exact commands |
| `results.json` | the same data for tools |
| `results.js` | the same data as a script, so the static dashboard works when opened from disk |

Each row has the whole process measured by hyperfine (mean, standard deviation, range, CPU time and peak memory) and the measured section reported by the program. CPU time above the wall-clock time means that more than one core worked.

## Reading the numbers

- Compare like with like: same workload, same size, same machine.
- Report the spread, not only the best run. A difference smaller than the standard deviation is not a difference.
- `process` includes the start-up of the runtime, which dominates small inputs. `section` does not.
- Results depend on the machine. The committed tables record where they were measured.

## Language benchmarks

`benchmarks/`, at the root, is the largest user of this contract: the same eight workloads in the seven languages, with a static dashboard at `benchmarks/dashboard/index.html`. Details, results tables and limits: [benchmarks/README.md](../../benchmarks/README.md).

| Workload | What it measures | How it is measured |
| --- | --- | --- |
| `cpu-single` | n-body and prime sieve on one thread | shared runner |
| `parallelism` | the same job with 1, 2, 4, 8 and 16 workers: speed-up, efficiency, CPU time | runner, plus `scripts/collect-sections.ts` for speed-up |
| `concurrency` | 100,000 waiting tasks: total time, peak memory, memory per task | runner |
| `memory` | binary trees (peak memory, time) and an idle process (start-up, baseline memory) | runner |
| `http` | the same two endpoints in 7 servers under local k6: requests per second, p50, p95, p99, CPU and memory | `http/collect.ts` |
| `build-time` | cold and warm build time, or the step that exists instead | `build-time/collect.ts` |
| `binary-size` | size of the artifact and of the runtime it needs | `binary-size/collect.ts` |
| `database` | the same operations against one local PostgreSQL, with and without a pool | `database/collect.ts` |

```sh
cd benchmarks
bun run bench -- --project cpu-single   # one runner workload
bun run all                              # everything, in order, retrying a step that fails
bun run data                             # dashboard data and README tables
./setup-unix-benchmarks.sh               # the full path, with the tests
```

What each workload does **not** measure, and why numbers across languages need care:

- The programs are small and written the plain way. They measure the runtime on a narrow task, not real applications or the libraries people use to go faster.
- Whole-process times include the start-up of the runtime, which dominates the short runs of the compiled languages.
- `http` and `database` compare stacks (server, driver), not only languages, and client and server share the machine.
- Everything was measured on one machine, on one day, with default settings and other workloads running next to it. A difference smaller than the reported spread is not a difference.

Four things the runner does not do live in collectors inside `benchmarks/`, with no change to `tools/`: several samples of the measured section, a step before each timed run, long-running services, and sizes on disk. All of them write the same `results.md`, `results.json` and `results.js`.
