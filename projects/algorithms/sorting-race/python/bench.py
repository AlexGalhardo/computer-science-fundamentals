"""Benchmark entry point: `python python/bench.py <algorithm> <variant> <n>`.

EN: Reads `data/<variant>-<n>.txt`, sorts it and prints one JSON line in the benchmark
    contract. Only the sort is timed, not the start of the interpreter nor the file parsing.
PT: Lê `data/<variante>-<n>.txt`, ordena e imprime uma linha JSON no contrato de benchmark. Só a
    ordenação é cronometrada, não a subida do interpretador nem a leitura do arquivo.
"""

import json
import resource
import sys
import time
from pathlib import Path

from sorts import SORTS

VARIANTS = ("random", "sorted", "reversed")
MAX_VALUE = 2**31 - 1


def read_values(path: Path, expected: int) -> list[int]:
    # EN: The file is external input: reject anything that is not an integer in range.
    # PT: O arquivo é entrada externa: rejeita o que não for um inteiro dentro da faixa.
    values = [int(line) for line in path.read_text().split()]
    if len(values) != expected:
        raise ValueError(f"{path}: expected {expected} values, found {len(values)}")
    if any(value < 0 or value > MAX_VALUE for value in values):
        raise ValueError(f"{path}: values must be between 0 and {MAX_VALUE}")
    return values


def checksum(values: list[int]) -> str:
    # EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
    # PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
    digest = 0
    for value in values:
        digest = (digest * 31 + value) % 1_000_000_007
    return str(digest)


def main() -> None:
    if len(sys.argv) != 4 or sys.argv[1] not in SORTS or sys.argv[2] not in VARIANTS:
        sys.exit(f"usage: bench.py <{'|'.join(SORTS)}> <{'|'.join(VARIANTS)}> <n>")
    implementation, variant, n = sys.argv[1], sys.argv[2], int(sys.argv[3])
    values = read_values(Path("data") / f"{variant}-{n}.txt", n)

    # EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is reported: the
    #     minimum is the measurement least disturbed by other programs on the machine.
    # PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é informada: o
    #     mínimo é a medida menos perturbada por outros programas na máquina.
    result: list[int] = []
    elapsed_ms = float("inf")
    spent_ms = 0.0
    for repetition in range(5):
        if repetition > 0 and spent_ms >= 300:
            break
        start = time.perf_counter()
        result = SORTS[implementation](values)
        elapsed = (time.perf_counter() - start) * 1000
        elapsed_ms = min(elapsed_ms, elapsed)
        spent_ms += elapsed

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": elapsed_ms,
                # EN: On Linux, ru_maxrss is the peak resident memory in kibibytes.
                # PT: No Linux, ru_maxrss é o pico de memória residente em kibibytes.
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": checksum(result),
            }
        )
    )


if __name__ == "__main__":
    main()
