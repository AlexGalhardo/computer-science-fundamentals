"""Memory workload in Python: `binary-trees` and `idle`.

EN: Python model: reference counting plus a cycle collector. Every object stores how many
    references point to it, and it is freed at the moment that count reaches zero, so a
    discarded tree is released at once, without waiting for a collector. The cost is paid on
    every assignment (the count is updated each time) and in memory (every node is a full
    object with a header). A separate collector looks only for reference cycles.
PT: Modelo do Python: contagem de referências mais um coletor de ciclos. Todo objeto guarda
    quantas referências apontam para ele, e é liberado no momento em que essa contagem chega a
    zero, então uma árvore descartada é liberada na hora, sem esperar um coletor. O custo é
    pago em toda atribuição (a contagem é atualizada a cada vez) e em memória (cada nó é um
    objeto completo com cabeçalho). Um coletor separado procura só ciclos de referências.
"""

import json
import resource
import sys
import time

Node = tuple["Node", "Node"] | None


def make(depth: int) -> tuple[Node, Node]:
    if depth == 0:
        return (None, None)
    return (make(depth - 1), make(depth - 1))


def check(node: tuple[Node, Node]) -> int:
    # EN: Walks the whole tree and counts its nodes.
    # PT: Percorre a árvore inteira e conta os nós.
    left, right = node
    if left is None or right is None:
        return 1
    return 1 + check(left) + check(right)


def binary_trees(n: int) -> int:
    min_depth = 4
    max_depth = max(min_depth + 2, n)
    total = check(make(max_depth + 1))
    long_lived = make(max_depth)
    for depth in range(min_depth, max_depth + 1, 2):
        iterations = 1 << (max_depth - depth + min_depth)
        for _ in range(iterations):
            total += check(make(depth))
    return total + check(long_lived)


def main() -> None:
    implementation = sys.argv[1] if len(sys.argv) > 1 else "binary-trees"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    start = time.perf_counter()
    checksum = "idle" if implementation == "idle" else str(binary_trees(n))
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": round(elapsed_ms, 3),
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": checksum,
            }
        )
    )


if __name__ == "__main__":
    main()
