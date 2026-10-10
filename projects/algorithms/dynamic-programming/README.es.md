# dynamic-programming

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Tres problemas clásicos (mochila 0-1, subsecuencia común más larga y cambio de monedas), cada uno resuelto tres veces: con recursión pura, con la misma recursión más un caché (memoización) y con bucles que llenan una tabla (tabulación). Las tres versiones calculan la misma recurrencia. Lo que cambia es cuántas veces se resuelve el mismo subproblema, y un contador de llamadas lo hace visible.

Ítem del plan: MP-ALG-2. Lenguajes: TypeScript (referencia) y Python. Texto completo: [docs/es/algorithms/dynamic-programming.md](../../../docs/es/algorithms/dynamic-programming.md).

## Qué enseña

- La programación dinámica se aplica cuando los subproblemas se superponen y la respuesta óptima se construye a partir de respuestas óptimas de subproblemas.
- La memoización mantiene el código recursivo y añade un caché. La tabulación elimina la recursión y llena la tabla en un orden en el que cada valor necesario ya está allí.
- El costo pasa a ser "número de subproblemas distintos por el trabajo de cada uno": `n * W` en la mochila, `m * n` en la LCS, `monto * monedas` en el cambio.
- Una regla voraz no basta para el cambio de monedas: con monedas 1, 3 y 4 paga 6 con tres monedas, y la tabla encuentra dos.

## Temas del quiz que demuestra

Área `algorithms`:

- `dynamic-programming` (subproblemas superpuestos, memoización y tabulación, mochila, LCS, cambio de monedas, conteo de llamadas)
- `greedy` (el sistema de monedas en el que el voraz falla, y por qué la mochila 0-1 necesita una tabla)
- `divide-and-conquer` (por qué los subproblemas superpuestos hacen exponencial la recursión ingenua)

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-dynamic-programming.sh        # Linux y macOS
./setup-windows-dynamic-programming.ps1    # Windows
```

## Demo

Un comando imprime la tabla de cada problema mientras se llena, y después los conteos de llamadas:

```sh
docker compose run --rm demo
```

```text
== 0-1 knapsack / mochila 0-1 ==
items (value, weight) / itens (valor, peso): (3,2) (4,3) (5,4) (6,5), capacity / capacidade 5
capacity w         0   1   2   3   4   5
no items           0   0   0   0   0   0
+ item (3,2)       0   0   3   3   3   3
+ item (4,3)       0   0   3   4   4   7
+ item (5,4)       0   0   3   4   5   7
+ item (6,5)       0   0   3   4   5   7
answer / resposta: 7 (items 1 and 2 / itens 1 e 2)

== longest common subsequence / maior subsequência comum ==
a = BANANA, b = ATANA
                       A   T   A   N   A
""                 0   0   0   0   0   0
+ B                0   0   0   0   0   0
+ A                0   1   1   1   1   1
+ N                0   1   1   1   2   2
+ A                0   1   1   2   2   3
+ N                0   1   1   2   3   3
+ A                0   1   1   2   3   4
answer / resposta: 4 (AANA)

== coin change / troco ==
coins / moedas: 1, 3, 4, amount / valor 6
amount v           0   1   2   3   4   5   6
after dp[0]        0
after dp[1]        0   1
after dp[2]        0   1   2
after dp[3]        0   1   2   1
after dp[4]        0   1   2   1   1
after dp[5]        0   1   2   1   1   2
after dp[6]        0   1   2   1   1   2   2
answer / resposta: 2 (3 + 3), greedy / guloso: 3 (4 + 1 + 1)

== calls of the recursive versions / chamadas das versões recursivas ==
problem      n       naive    memo     ratio
knapsack    20      734544    2380      309x
lcs         12      117808     198      595x
coins       30     2550408      86    29656x
```

Cada fila de una tabla es un paso: se calcula solo a partir de las filas de arriba (o de las celdas a su izquierda). `docker compose run --rm python-demo` imprime los mismos conteos de llamadas desde la implementación en Python.

## Contador de llamadas

Las versiones recursivas reciben un contador que se incrementa en cada llamada, incluidas las que solo consultan el caché. Los tamaños de entrada documentados son 20 ítems para la mochila, dos cadenas de 12 letras para la LCS y el monto 30 para el cambio de monedas. En esos tamaños la versión ingenua hace 309, 595 y 29,656 veces más llamadas que la memoizada. Una prueba en cada lenguaje exige que la razón sea de al menos 100, y la prueba de Python también exige los conteos exactos de la referencia en TypeScript.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/knapsack.ts`, `lcs.ts`, `coin-change.ts` | Un archivo por problema, con las versiones ingenua, memoizada y tabulada |
| `ts/src/problems.ts` | Instancias construidas a partir de un tamaño `n` y una semilla, compartidas por benchmark, demo y pruebas |
| `ts/src/demo.ts`, `ts/src/bench.ts` | Demo y entrada del benchmark |
| `python/dp.py`, `problems.py`, `demo.py`, `bench.py` | Lo mismo en Python |
| `bench.json`, `results/` | Cuadrícula del benchmark y resultados versionados |
| `dashboard/` | Página estática que grafica `results/results.js` |

Instancias: la mochila tiene `n` ítems con pesos de 1 a 20, valores de 1 a 100 y capacidad `5n`. La LCS compara dos cadenas de `n` letras sobre A, C, G, T. El cambio de monedas forma el monto `n` con monedas 1, 3 y 4. Un generador de Lehmer con semilla fija las construye, de forma idéntica en ambos lenguajes.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

Cada lenguaje comprueba respuestas conocidas, que las tres versiones coinciden en 200 casos aleatorios de cada problema, y la razón entre los conteos de llamadas. Formateadores y linters:

```sh
./lint.sh                                                    # ruff, en la imagen base de Python
bunx biome check projects/algorithms/dynamic-programming     # TypeScript, desde la raíz del repositorio
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/dynamic-programming
```

La cuadrícula ejecuta las nueve implementaciones con `n` = 8, 12, 16, 20, 100 y 500 en ambos lenguajes, 3 ejecuciones medidas tras 1 de calentamiento, y escribe `results/`. Abre `dashboard/index.html` directamente desde el disco para ver el gráfico.

Límites, para que toda la ejecución tarde pocos minutos: `knapsack-naive` y `coins-naive` se detienen en `n` = 20 y `lcs-naive` en `n` = 12, porque su número de llamadas crece de forma exponencial. Las versiones memoizada y tabulada siguen hasta 500.

En `results/results.md`, compara la columna `section` de las tres versiones de un problema con el mismo `n`. La columna `checksum` es la propia respuesta, así que checksums iguales en una fila de TypeScript y en una de Python muestran que ambos lenguajes coinciden.
