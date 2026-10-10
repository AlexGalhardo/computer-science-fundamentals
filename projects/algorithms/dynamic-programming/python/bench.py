"""Benchmark entry point: `python python/bench.py <problem>-<version> <n>`.

EN: Solves one instance and prints one JSON line in the benchmark contract.
PT: Resolve uma instância e imprime uma linha JSON no contrato de benchmark.
ES: Resuelve una instancia e imprime una línea JSON en el contrato de benchmark.
"""

import json
import resource
import sys
import time

import dp
from problems import PROBLEMS, VERSIONS

MAX_N = 5000


def main() -> None:
    problem, _, version = (sys.argv[1] if len(sys.argv) == 3 else "").rpartition("-")
    size = sys.argv[2] if len(sys.argv) == 3 else ""
    if problem not in PROBLEMS or version not in VERSIONS or not size.isdigit():
        sys.exit(f"usage: bench.py <{'|'.join(PROBLEMS)}>-<{'|'.join(VERSIONS)}> <n>")
    n = int(size)
    if n > MAX_N:
        sys.exit(f"n must be at most {MAX_N}")

    # EN: The memoised versions recurse as deep as the input is long. Python's default limit
    #     of 1000 frames is a safety net, not a law, so it is raised for the larger sizes.
    # PT: As versões memoizadas descem tão fundo quanto o tamanho da entrada. O limite padrão de
    #     1000 quadros do Python é uma rede de segurança, não uma lei, então ele é aumentado
    #     para os tamanhos maiores.
    # ES: Las versiones memoizadas descienden tan hondo como el largo de la entrada. El límite
    #     por defecto de 1000 marcos de Python es una red de seguridad, no una ley, así que se
    #     aumenta para los tamaños mayores.
    sys.setrecursionlimit(4 * MAX_N + 1000)

    start = time.perf_counter()
    answer = PROBLEMS[problem][version](n, dp.Counter(), 1)
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": elapsed_ms,
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": f"{problem}-{version}",
                "checksum": str(answer),
            }
        )
    )


if __name__ == "__main__":
    main()
