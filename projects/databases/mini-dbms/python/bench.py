"""EN: Benchmark entry point: `python bench.py <nested-loop|hash|sort-merge> <n>`.

Building the tables is outside the timed section: only the join is measured. The last line
printed is the JSON object of the repository's benchmark contract.

PT: Ponto de entrada do benchmark: `python bench.py <nested-loop|hash|sort-merge> <n>`.

A montagem das tabelas fica fora do trecho cronometrado: só a junção é medida. A última linha
impressa é o objeto JSON do contrato de benchmark do repositório.

ES: Punto de entrada del benchmark: `python bench.py <nested-loop|hash|sort-merge> <n>`.

El armado de las tablas queda fuera del tramo cronometrado: solo se mide el join. La última
línea impresa es el objeto JSON del contrato de benchmark del repositorio.
"""

import json
import resource
import sys
import time

from joins import JOINS
from workload import bench_tables, checksum


def main() -> int:
    if len(sys.argv) != 3 or sys.argv[1] not in JOINS:
        print("usage: bench.py <nested-loop|hash|sort-merge> <n>", file=sys.stderr)
        return 2
    implementation = sys.argv[1]
    n = int(sys.argv[2])

    r, s = bench_tables(n)
    start = time.perf_counter()
    pairs = JOINS[implementation](r, "k", s, "k")
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": round(elapsed_ms, 3),
                # EN: On Linux, ru_maxrss is already in kibibytes.
                # PT: No Linux, ru_maxrss já vem em kibibytes.
                # ES: En Linux, ru_maxrss ya viene en kibibytes.
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": checksum(r, s, pairs),
            }
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
