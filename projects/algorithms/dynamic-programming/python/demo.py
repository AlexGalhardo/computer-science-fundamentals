"""Demo: `python python/demo.py` prints the call counts of the recursive versions.

EN: The step-by-step tables are printed by the TypeScript demo (`ts/src/demo.ts`). This script
    shows the other half of the lesson in Python: how many calls plain recursion makes compared
    with the same recursion plus a cache.
PT: As tabelas passo a passo são impressas pela demo em TypeScript (`ts/src/demo.ts`). Este
    script mostra a outra metade da lição em Python: quantas chamadas a recursão pura faz em
    comparação com a mesma recursão mais um cache.
"""

import dp
from problems import DOCUMENTED_SIZE, PROBLEMS


def main() -> None:
    print(f"{'problem':<10}{'n':>4}{'naive':>12}{'memo':>8}{'ratio':>10}")
    for name, versions in PROBLEMS.items():
        n = DOCUMENTED_SIZE[name]
        naive, memo = dp.Counter(), dp.Counter()
        versions["naive"](n, naive, 1)
        versions["memo"](n, memo, 1)
        ratio = round(naive.calls / memo.calls)
        print(f"{name:<10}{n:>4}{naive.calls:>12}{memo.calls:>8}{ratio:>9}x")


if __name__ == "__main__":
    main()
