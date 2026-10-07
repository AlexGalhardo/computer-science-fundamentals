"""EN: The benchmark workload, identical to the Rust one so checksums can be compared.

PT: A carga do benchmark, idêntica à do Rust para que os checksums possam ser comparados.
"""

from table import Table

SEED = 42
MULTIPLIER = 6_364_136_223_846_793_005
INCREMENT = 1_442_695_040_888_963_407
MASK = (1 << 64) - 1
STEP = 7919
OFFSET = 13
MODULUS = 1_000_000_007


class Lcg:
    """EN: A linear congruential generator: a tiny pseudo-random number generator. It is written
    by hand, with the same constants as the Rust version, so both languages build exactly the
    same tables from the same seed. Python integers never overflow, so the result is cut back to
    64 bits with a mask, which is what Rust does implicitly with wrapping arithmetic.

    PT: Um gerador congruente linear: um gerador de números pseudoaleatórios minúsculo. Ele é
    escrito à mão, com as mesmas constantes da versão em Rust, para que as duas linguagens
    montem exatamente as mesmas tabelas a partir da mesma semente. Inteiros em Python nunca
    estouram, então o resultado é cortado para 64 bits com uma máscara, que é o que o Rust faz
    implicitamente com aritmética de estouro circular.
    """

    def __init__(self, seed: int) -> None:
        self.state = seed

    def next_below(self, bound: int) -> int:
        self.state = (self.state * MULTIPLIER + INCREMENT) & MASK
        return (self.state >> 33) % bound


def bench_tables(n: int) -> tuple[Table, Table]:
    # EN: R(id, k) and S(k, v), both with n rows. R.k is random in [0, n), so some keys repeat
    #     and some never appear. S.k takes each value of [0, n) exactly once, in a scrambled
    #     order (i * 7919 + 13 mod n is a permutation because 7919 is prime and does not divide
    #     a power of ten). Every row of R matches exactly one row of S, so the join returns n
    #     rows. S is scrambled so that sort-merge really has to sort.
    # PT: R(id, k) e S(k, v), ambas com n linhas. R.k é aleatório em [0, n), então algumas
    #     chaves se repetem e outras nunca aparecem. S.k assume cada valor de [0, n) exatamente
    #     uma vez, em ordem embaralhada (i * 7919 + 13 mod n é uma permutação porque 7919 é
    #     primo e não divide uma potência de dez). Cada linha de R casa com exatamente uma linha
    #     de S, então a junção devolve n linhas. S é embaralhada para que a junção por ordenação
    #     realmente precise ordenar.
    random = Lcg(SEED)
    r = Table(["id", "k"], [(row_id, random.next_below(n)) for row_id in range(n)])
    s = Table(
        ["k", "v"],
        [((position * STEP + OFFSET) % n, random.next_below(1000)) for position in range(n)],
    )
    return r, s


def checksum(r: Table, s: Table, pairs: list[tuple[int, int]]) -> str:
    # EN: A digest that does not depend on the order of the pairs: the number of pairs and the
    #     sum of R.id * S.v. Two implementations that print the same checksum found the same
    #     matches, whatever order they found them in.
    # PT: Um resumo que não depende da ordem dos pares: a quantidade de pares e a soma de
    #     R.id * S.v. Duas implementações que imprimem o mesmo checksum acharam os mesmos
    #     casamentos, seja qual for a ordem em que os acharam.
    total = 0
    for i, j in pairs:
        total = (total + r.rows[i][0] * s.rows[j][1]) % MODULUS
    return f"{len(pairs)}:{total}"
