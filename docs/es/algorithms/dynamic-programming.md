# Programación dinámica

> English version: [docs/en/algorithms/dynamic-programming.md](../../en/algorithms/dynamic-programming.md) · Versão em português: [docs/pt/algorithms/dynamic-programming.md](../../pt/algorithms/dynamic-programming.md)

Mini-proyecto: [`projects/algorithms/dynamic-programming`](../../../projects/algorithms/dynamic-programming/README.es.md) (MP-ALG-2). Lenguajes: TypeScript y Python. Quiz: área `algorithms`, tema `dynamic-programming`.

## La idea

Algunos problemas se descomponen en problemas más pequeños que se repiten. La recursión pura resuelve cada repetición de nuevo, y el número de llamadas explota. La programación dinámica resuelve cada subproblema distinto una vez y guarda la respuesta. Necesita dos propiedades:

- **Subproblemas superpuestos**: el mismo subproblema se alcanza por muchos caminos.
- **Subestructura óptima**: la mejor respuesta se construye a partir de las mejores respuestas de subproblemas.

Hay dos formas de escribirla, y ambas calculan la misma recurrencia:

| | Memoización | Tabulación |
| --- | --- | --- |
| Dirección | de arriba hacia abajo | de abajo hacia arriba |
| Código | la recursión, más un caché | bucles que llenan una tabla |
| Subproblemas resueltos | solo los alcanzados | todos |
| Riesgo | recursión profunda | elegir un orden de llenado equivocado |
| Truco de memoria | ninguno | guardar solo las filas que aún se necesitan |

## Los tres problemas

| Problema | Subproblema | Recurrencia | Costo |
| --- | --- | --- | --- |
| Mochila 0-1 | `best(i, w)`: mejor valor con los ítems `i..` y capacidad `w` | `max(omitir, valor[i] + best(i + 1, w - peso[i]))` | `O(n · W)` |
| Subsecuencia común más larga | `lcs(i, j)`: respuesta para los sufijos `a[i..]`, `b[j..]` | coinciden: `1 + lcs(i + 1, j + 1)`, si no `max(lcs(i + 1, j), lcs(i, j + 1))` | `O(m · n)` |
| Cambio de monedas | `coins(v)`: menor número de monedas para el monto `v` | `1 + min(coins(v - c))` sobre las monedas `c ≤ v` | `O(monto · monedas)` |

Cada uno se implementa tres veces: ingenua (recursión pura), memoizada y tabulada. La versión ingenua es la especificación. Las pruebas exigen que las otras dos devuelvan la misma respuesta en 200 casos aleatorios por problema.

## Qué muestra el contador de llamadas

El tiempo depende de la máquina. El número de llamadas depende solo del algoritmo, así que es la evidencia más limpia de trabajo repetido. En los tamaños documentados:

| Problema | Tamaño | Llamadas de la ingenua | Llamadas de la memoizada | Razón |
| --- | ---: | ---: | ---: | ---: |
| Mochila | 20 ítems | 734,544 | 2,380 | 309 |
| LCS | 12 letras cada una | 117,808 | 198 | 595 |
| Cambio de monedas | monto 30 | 2,550,408 | 86 | 29,656 |

El conteo de la memoizada incluye las llamadas que solo consultan el caché. TypeScript y Python imprimen exactamente los mismos conteos, porque ambos construyen las mismas instancias a partir de la misma semilla.

## La tabla, paso a paso

`docker compose run --rm demo` imprime cada tabla mientras se llena. Para el cambio de monedas con monedas 1, 3 y 4 y monto 6:

```text
amount v           0   1   2   3   4   5   6
after dp[6]        0   1   2   1   1   2   2
```

`dp[6] = 1 + min(dp[5], dp[3], dp[2]) = 1 + min(2, 1, 2) = 2`, la respuesta `3 + 3`. La regla voraz "la moneda más grande primero" paga `4 + 1 + 1`, tres monedas. La tabla no cae en esa trampa, porque prueba todas las monedas para cada monto.

## Benchmark

`bun run bench -- --project projects/algorithms/dynamic-programming` ejecuta las nueve implementaciones en ambos lenguajes. Resultados: [`results/results.md`](../../../projects/algorithms/dynamic-programming/results/results.md).

Sección medida en milisegundos, de la ejecución versionada (92 filas):

| Implementación | n | TypeScript | Python |
| --- | ---: | ---: | ---: |
| `knapsack-naive` | 20 | 12.3 | 183 |
| `knapsack-memo` | 20 | 3.69 | 1.56 |
| `knapsack-tab` | 20 | 1.48 | 0.36 |
| `knapsack-memo` | 500 | 30.9 | 2,116 |
| `knapsack-tab` | 500 | 24.6 | 377 |
| `lcs-naive` | 12 | 5.74 | 45.7 |
| `lcs-memo` | 500 | 8.50 | 261 |
| `lcs-tab` | 500 | 15.2 | 57.6 |
| `coins-naive` | 20 | 8.28 | 9.77 |
| `coins-tab` | 500 | 0.45 | 0.13 |

Cómo leerlo:

- Las versiones ingenuas ya son las más lentas con `n` = 20 o 12, y se detienen ahí. Las versiones memoizada y tabulada llegan a 500 porque su costo es polinomial.
- En Python, la tabulación es 5 veces más rápida que la memoización en la mochila con 500 ítems (377 ms contra 2,116 ms): el mismo número de subproblemas, sin una llamada de función y una consulta a un diccionario para cada uno.
- Cada fila es una ejecución en frío. TypeScript corre sobre un compilador JIT, así que en entradas que tardan un milisegundo todavía está calentando y puede ser más lento que Python. En las entradas mayores es varias veces más rápido.
- La columna `checksum` es la respuesta. Las 92 filas coinciden: para cada problema y tamaño, las tres versiones y los dos lenguajes imprimen el mismo valor.

## Para experimentar

- Cambia la mochila para que guarde solo una fila y recorra las capacidades en orden ascendente. Un ítem pasa a contarse más de una vez: la tabla se convirtió en la mochila con repetición.
- Aumenta el tamaño de la LCS de la versión ingenua de 12 a 16 y observa el número de llamadas.
- Usa monedas 2 y 4 con un monto impar: las tres versiones deben responder `-1`.
