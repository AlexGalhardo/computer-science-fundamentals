# Load tests and benchmarks

- k6 and similar tools target **only local services** created in this repository (`localhost` or docker-compose service names). Never a third-party URL.
- The target comes from a variable that defaults to a local address. Scripts must refuse to run when the host is not local.
- Cross-language benchmarks follow one contract: every implementation reads the same input and prints JSON with at least `n`, elapsed time and memory. hyperfine measures the processes and a runner writes the comparison table.
- Every benchmark records the machine, runtime versions and the exact command, so results are reproducible.
- Compare like with like: same workload, same data size, warm-up excluded, several runs. Report the spread, not only the best run.
- Results are committed as text or Markdown tables. Raw output folders such as `k6-results/` stay git-ignored.
