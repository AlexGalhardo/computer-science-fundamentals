"""Smallest Python program that honours the benchmark contract.

EN: Sums 1..n in two ways and prints one JSON line. Only the work is timed.
PT: Soma 1..n de duas formas e imprime uma linha JSON. Só o trabalho é cronometrado.
"""

import json
import resource
import sys
import time


def sum_loop(limit: int) -> int:
    total = 0
    for i in range(1, limit + 1):
        total += i
    return total


def sum_formula(limit: int) -> int:
    return limit * (limit + 1) // 2


def main() -> None:
    implementation = sys.argv[1] if len(sys.argv) > 1 else "sum-loop"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

    start = time.perf_counter()
    total = sum_formula(n) if implementation == "sum-formula" else sum_loop(n)
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": elapsed_ms,
                # EN: On Linux, ru_maxrss is already in kibibytes.
                # PT: No Linux, ru_maxrss já vem em kibibytes.
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": str(total),
            }
        )
    )


if __name__ == "__main__":
    main()
