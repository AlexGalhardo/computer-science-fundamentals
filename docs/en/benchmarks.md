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
