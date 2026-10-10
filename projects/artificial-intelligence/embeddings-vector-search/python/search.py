"""EN: Two ways of finding the stored vector most similar to a query.
Brute force compares the query with every vector: always right, cost = n comparisons.
The index (random-hyperplane LSH, "locality-sensitive hashing") compares the query only with the
vectors that fell in the same bucket: far fewer comparisons, sometimes wrong.
This is where Python changes the lesson. With NumPy, brute force is ONE matrix-vector product,
`vectors @ query`: n dot products computed by optimised native code. That line is what a vector
database runs when it does an exact search, and it is why brute force stays the right choice up
to a surprisingly large number of vectors.

PT: Duas formas de achar o vetor guardado mais parecido com uma consulta.
A força bruta compara a consulta com todos os vetores: sempre certa, custo = n comparações.
O índice (LSH de hiperplanos aleatórios, "locality-sensitive hashing") compara a consulta só com
os vetores que caíram no mesmo balde: muito menos comparações, às vezes errado.
É aqui que o Python muda a lição. Com NumPy, a força bruta é UM produto matriz-vetor,
`vectors @ query`: n produtos escalares calculados por código nativo otimizado. Essa linha é o
que um banco de dados vetorial roda quando faz uma busca exata, e é por isso que a força bruta
continua sendo a escolha certa até um número surpreendentemente grande de vetores.

ES: Dos formas de encontrar el vector guardado más parecido a una consulta.
La fuerza bruta compara la consulta con todos los vectores: siempre acierta, costo = n
comparaciones.
El índice (LSH de hiperplanos aleatorios, "locality-sensitive hashing") compara la consulta solo
con los vectores que cayeron en la misma cubeta: muchas menos comparaciones, a veces se equivoca.
Aquí es donde Python cambia la lección. Con NumPy, la fuerza bruta es UN producto matriz-vector,
`vectors @ query`: n productos punto calculados por código nativo optimizado. Esa línea es lo que
ejecuta una base de datos vectorial cuando hace una búsqueda exacta, y por eso la fuerza bruta
sigue siendo la elección correcta hasta un número sorprendentemente grande de vectores.
"""

from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

from embeddings import Matrix
from rng import bell_random, mulberry32

Sides = npt.NDArray[np.bool_]


@dataclass(frozen=True)
class SearchResult:
    # Position of the best vector, or -1 when the index found no candidate at all.
    best: int
    similarity: float
    # How many stored vectors were compared with the query.
    comparisons: int


def brute_force(vectors: Matrix, query: Matrix) -> SearchResult:
    """EN: Every row has length 1, so `vectors @ query` is the cosine similarity of the query
    with every stored vector. `argmax` returns the first best position, the same tie rule as the
    TypeScript loop.

    PT: Toda linha tem comprimento 1, então `vectors @ query` é a similaridade do cosseno da
    consulta com cada vetor guardado. `argmax` devolve a primeira melhor posição, a mesma regra
    de desempate do laço em TypeScript.

    ES: Toda fila tiene longitud 1, así que `vectors @ query` es la similitud del coseno de la
    consulta con cada vector guardado. `argmax` devuelve la primera mejor posición, la misma regla
    de desempate del bucle en TypeScript.
    """
    scores = vectors @ query
    best = int(scores.argmax())
    return SearchResult(best, float(scores[best]), len(vectors))


@dataclass(frozen=True)
class Planes:
    tables: int
    bits: int
    # tables * bits rows, table after table. Each row is the vector perpendicular to a plane.
    normals: Matrix


def make_planes(seed: int, tables: int, bits: int, dimensions: int) -> Planes:
    """EN: A random plane through the origin cuts the space in two halves. It is stored as its
    normal vector r, and the side of a vector v is the sign of dot(r, v). Two vectors separated
    by a small angle are rarely cut apart: the chance that they fall on the same side is
    1 - angle/180 degrees. The numbers are drawn in the same order as in TypeScript.

    PT: Um plano aleatório que passa pela origem corta o espaço em duas metades. Ele é guardado
    como o seu vetor normal r, e o lado de um vetor v é o sinal de dot(r, v). Dois vetores
    separados por um ângulo pequeno raramente são separados: a chance de caírem do mesmo lado é
    1 - ângulo/180 graus. Os números são sorteados na mesma ordem que em TypeScript.

    ES: Un plano aleatorio que pasa por el origen corta el espacio en dos mitades. Se guarda como
    su vector normal r, y el lado de un vector v es el signo de dot(r, v). Dos vectores separados
    por un ángulo pequeño rara vez quedan separados: la probabilidad de caer del mismo lado es
    1 - ángulo/180 grados. Los números se sortean en el mismo orden que en TypeScript.
    """
    rng = mulberry32(seed)
    values = [bell_random(rng) for _ in range(tables * bits * dimensions)]
    return Planes(tables, bits, np.array(values).reshape(tables * bits, dimensions))


def sides(planes: Planes, vectors: Matrix) -> Sides:
    """EN: One True/False per vector and per plane: on which side of each plane the vector falls.
    One matrix product answers it for all vectors and all planes at once.

    PT: Um True/False por vetor e por plano: de que lado de cada plano o vetor cai. Um produto de
    matrizes responde para todos os vetores e todos os planos de uma vez.

    ES: Un True/False por vector y por plano: de qué lado de cada plano cae el vector. Un producto
    de matrices responde para todos los vectores y todos los planos a la vez.
    """
    return (vectors @ planes.normals.T) > 0


def bucket_keys(
    planes: Planes, vector_sides: Sides, table: int, bits: int
) -> npt.NDArray[np.int64]:
    """EN: `bits` sides in a row form a binary number, the bucket key: with 3 planes, "above,
    below, above" is 101 = bucket 5. More bits = more and smaller buckets = fewer comparisons, but
    a higher chance that the true neighbour is cut away by one of the planes.

    PT: `bits` lados em sequência formam um número binário, a chave do balde: com 3 planos,
    "acima, abaixo, acima" é 101 = balde 5. Mais bits = mais baldes e menores = menos comparações,
    mas uma chance maior de o vizinho verdadeiro ser separado por um dos planos.

    ES: `bits` lados seguidos forman un número binario, la clave de la cubeta: con 3 planos,
    "arriba, abajo, arriba" es 101 = cubeta 5. Más bits = más cubetas y más pequeñas = menos
    comparaciones, pero una mayor probabilidad de que el vecino verdadero quede separado por uno
    de los planos.
    """
    start = table * planes.bits
    return vector_sides[:, start : start + bits].astype(np.int64) @ (1 << np.arange(bits))


@dataclass(frozen=True)
class LshSettings:
    tables: int
    bits: int
    # 0 = look only at the bucket of the query. 1 = also at the buckets that differ in one bit.
    probes: int


class LshIndex:
    """EN: One table can miss: the neighbour may sit just across one plane. So the index keeps
    several independent tables, each with its own planes, and a query collects the candidates of
    all of them. More tables = fewer misses and more comparisons.

    PT: Uma tabela pode errar: o vizinho pode estar logo do outro lado de um plano. Por isso o
    índice mantém várias tabelas independentes, cada uma com os seus planos, e uma consulta junta
    os candidatos de todas. Mais tabelas = menos erros e mais comparações.

    ES: Una tabla puede equivocarse: el vecino puede estar justo al otro lado de un plano. Por eso
    el índice mantiene varias tablas independientes, cada una con sus planos, y una consulta junta
    los candidatos de todas. Más tablas = menos errores y más comparaciones.
    """

    def __init__(
        self, planes: Planes, vectors: Matrix, vector_sides: Sides, settings: LshSettings
    ) -> None:
        if settings.tables > planes.tables or settings.bits > planes.bits:
            raise ValueError("the settings ask for more tables or bits than the planes have")
        self.planes = planes
        self.vectors = vectors
        self.settings = settings
        self.buckets: list[dict[int, list[int]]] = []
        for table in range(settings.tables):
            buckets: dict[int, list[int]] = {}
            keys = bucket_keys(planes, vector_sides, table, settings.bits)
            for position, key in enumerate(keys.tolist()):
                buckets.setdefault(key, []).append(position)
            self.buckets.append(buckets)

    def candidates(self, query_sides: Sides) -> list[int]:
        """The positions of the vectors that share a bucket with the query, each one once."""
        seen: set[int] = set()
        one_query = query_sides.reshape(1, -1)
        for table in range(self.settings.tables):
            key = int(bucket_keys(self.planes, one_query, table, self.settings.bits)[0])
            keys = [key]
            # EN: Multi-probe: the most likely miss is a neighbour that differs in exactly one
            #     side. Flipping one bit of the key at a time visits those buckets too.
            # PT: Multi-sonda: o erro mais provável é um vizinho que difere em exatamente um
            #     lado. Inverter um bit da chave por vez visita esses baldes também.
            # ES: Multi-sonda: el error más probable es un vecino que difiere en exactamente un
            #     lado. Invertir un bit de la clave a la vez visita esas cubetas también.
            if self.settings.probes == 1:
                keys += [key ^ (1 << bit) for bit in range(self.settings.bits)]
            for probe in keys:
                seen.update(self.buckets[table].get(probe, []))
        return sorted(seen)

    def search(self, query: Matrix, query_sides: Sides) -> SearchResult:
        positions = self.candidates(query_sides)
        if not positions:
            return SearchResult(-1, float("-inf"), 0)
        # EN: The same matrix-vector product as brute force, on the few candidate rows only.
        # PT: O mesmo produto matriz-vetor da força bruta, só nas poucas linhas candidatas.
        # ES: El mismo producto matriz-vector de la fuerza bruta, solo en las pocas filas
        #     candidatas.
        scores = self.vectors[positions] @ query
        best = int(scores.argmax())
        return SearchResult(positions[best], float(scores[best]), len(positions))


@dataclass(frozen=True)
class TradeOffRow:
    tables: int
    bits: int
    probes: int
    # Share of the queries whose top result is the same as the brute-force one.
    agreement: float
    # Average number of stored vectors compared with the query.
    comparisons: float
    # Dot products spent computing the bucket keys of one query: tables * bits.
    hashing: int


PLANES_SEED = 42
MAX_TABLES = 8
MAX_BITS = 12

# EN: The settings of the trade-off table. The first one is the fastest and far below the 95%
#     target on purpose: it shows what is given up.
# PT: As configurações da tabela de troca. A primeira é a mais rápida e fica bem abaixo da meta
#     de 95% de propósito: mostra o que se perde.
# ES: Las configuraciones de la tabla de intercambio. La primera es la más rápida y queda muy por
#     debajo de la meta de 95% a propósito: muestra lo que se pierde.
SETTINGS = [
    LshSettings(1, 12, 0),
    LshSettings(4, 12, 0),
    LshSettings(8, 12, 0),
    LshSettings(8, 10, 0),
    LshSettings(2, 10, 1),
    LshSettings(4, 12, 1),
    LshSettings(8, 12, 1),
]
# The fastest setting of the table, kept to show the price of speed.
FAST = LshSettings(1, 12, 0)
# The setting the README recommends and the test of MP-AI-3.2 asserts.
CHOSEN = LshSettings(4, 12, 1)


def trade_off(
    vectors: Matrix,
    queries: Matrix,
    settings_list: list[LshSettings] | None = None,
    planes: Planes | None = None,
) -> list[TradeOffRow]:
    """EN: For every query, ask brute force (the truth) and ask the index, then count how often
    the two top results are the same vector and how many comparisons the index made. The truth
    for all queries is one matrix product: queries @ vectors.T has one row of scores per query.

    PT: Para cada consulta, pergunta à força bruta (a verdade) e pergunta ao índice, depois conta
    em quantas vezes os dois primeiros resultados são o mesmo vetor e quantas comparações o
    índice fez. A verdade de todas as consultas é um produto de matrizes: queries @ vectors.T tem
    uma linha de notas por consulta.

    ES: Para cada consulta, pregunta a la fuerza bruta (la verdad) y pregunta al índice, luego
    cuenta en cuántas ocasiones los dos primeros resultados son el mismo vector y cuántas
    comparaciones hizo el índice. La verdad de todas las consultas es un producto de matrices:
    queries @ vectors.T tiene una fila de puntuaciones por consulta.
    """
    planes = planes or make_planes(PLANES_SEED, MAX_TABLES, MAX_BITS, vectors.shape[1])
    vector_sides = sides(planes, vectors)
    query_sides = sides(planes, queries)
    truth = (queries @ vectors.T).argmax(axis=1)
    rows = []
    for settings in settings_list or SETTINGS:
        index = LshIndex(planes, vectors, vector_sides, settings)
        results = [index.search(query, query_sides[q]) for q, query in enumerate(queries)]
        agreed = sum(result.best == truth[q] for q, result in enumerate(results))
        compared = sum(result.comparisons for result in results)
        rows.append(
            TradeOffRow(
                settings.tables,
                settings.bits,
                settings.probes,
                agreed / len(queries),
                compared / len(queries),
                settings.tables * settings.bits,
            )
        )
    return rows
