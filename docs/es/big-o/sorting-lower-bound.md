# La cota inferior de la ordenación por comparación

> English version: [docs/en/big-o/sorting-lower-bound.md](../../en/big-o/sorting-lower-bound.md) · Versão em português: [docs/pt/big-o/sorting-lower-bound.md](../../pt/big-o/sorting-lower-bound.md)

Miniproyecto MP-BIGO-3, en [`projects/big-o/sorting-lower-bound`](../../../projects/big-o/sorting-lower-bound). Enseña por qué ninguna ordenación por comparación supera Ω(n lg n) y cómo las ordenaciones por conteo escapan de ese límite.

## El argumento

Una ordenación por comparación aprende sobre su entrada solo preguntando "¿a es menor que b?". Cada ejecución es un camino en un **árbol de decisión**: cada comparación es un nodo, cada respuesta es una rama, y el orden final es una hoja.

1. n elementos distintos pueden llegar en n! órdenes, y cada orden necesita un reordenamiento distinto. Así que el árbol necesita al menos **n! hojas**.
2. Un árbol binario de altura h tiene como máximo 2^h hojas.
3. Por lo tanto 2^h ≥ n!, es decir, **h ≥ lg(n!)**. La altura es el número de comparaciones del peor caso, y es un número entero, así que el peor caso es al menos ⌈lg(n!)⌉.
4. lg(n!) = lg 1 + lg 2 + ... + lg n es Θ(n lg n).

La cota es una afirmación sobre el problema, no sobre un algoritmo.

## El generador de árboles de decisión

`ts/src/decision-tree.ts` no dibuja un árbol a mano: descubre el árbol de una ordenación real. El algoritmo se ejecuta sobre elementos cuyo orden se desconoce, y el comparador repite una lista de respuestas. Cuando el algoritmo hace una pregunta más, la ejecución se detiene, la pregunta se vuelve un nodo, y el algoritmo se ejecuta de nuevo para "sí" y para "no". Una rama que ningún orden de entrada puede alcanzar se deja vacía.

| Algoritmo | n | hojas | altura | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 3 | 6 | 3 | 3 |
| merge sort | 4 | 24 | 5 | 5 |
| heapsort | 4 | 24 | 7 | 5 |
| quicksort | 4 | 24 | 6 | 5 |

Toda ordenación correcta tiene exactamente n! hojas alcanzables. Merge sort alcanza la altura mínima para n = 3 y n = 4. Heapsort y quicksort son correctos pero más altos, y el propio merge sort deja de ser óptimo en n = 5 (8 comparaciones en el peor caso frente a una cota de 7): la cota dice lo que es imposible, no que un algoritmo dado la alcance.

## Lo que promete la cota, y lo que no

Revisar todas las permutaciones para n hasta 8 muestra los tres casos lado a lado:

| Algoritmo | n | mejor | promedio | peor | lg n! | ⌈lg n!⌉ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| merge sort | 5 | 5 | 7.17 | 8 | 6.91 | 7 |
| heapsort | 5 | 9 | 10.95 | 12 | 6.91 | 7 |
| quicksort | 5 | 6 | 7.40 | 10 | 6.91 | 7 |

El **peor caso** nunca queda por debajo de ⌈lg n!⌉ y el **promedio** nunca queda por debajo de lg n!. El **mejor caso** sí puede: merge sort ordena algunas entradas de 5 elementos con 5 comparaciones. En Python, `sorted` sobre 1,000 claves ya ordenadas hace 999 comparaciones, frente a lg(1000!) ≈ 8,529.

Esto importa para leer el criterio de aceptación "las comparaciones contadas nunca quedan por debajo de lg(n!) en 1,000 entradas aleatorias". Se cumple, y las pruebas lo verifican, pero como una observación sobre entradas aleatorias de n = 1,000, donde el conteo se concentra cerca de su promedio. No es una consecuencia del teorema para cada entrada individual.

## 1,000 entradas aleatorias de n = 1,000

Permutaciones aleatorias de 0..999 a partir de una semilla fija, lg(1000!) = 8,529.40:

| Algoritmo | comparaciones mín. | media | máx. | mín. / lg n! |
| --- | ---: | ---: | ---: | ---: |
| merge sort | 8,654 | 8,708.4 | 8,762 | 1.015 |
| heapsort | 16,758 | 16,854.7 | 16,945 | 1.965 |
| quicksort | 9,664 | 11,003.2 | 13,515 | 1.133 |
| counting sort | 0 | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 | 0 |

Merge sort se mantiene a menos del 2% de la cota. Heapsort hace cerca del doble de comparaciones, porque hundir un elemento cuesta dos por nivel. Los cinco algoritmos ordenaron las 1,000 entradas.

## Cómo escapan counting sort y radix sort

Nunca comparan dos elementos. Counting sort usa la clave como índice de un arreglo de contadores, en Θ(n + k) para claves en [0, k). Radix sort aplica un counting sort estable a cada dígito, en Θ(d·(n + k)). Un algoritmo que no funciona por comparaciones no lo describe un árbol de decisión, así que el teorema no dice nada sobre él. El precio es la generalidad: estas ordenaciones solo sirven para claves que son enteros pequeños o que se pueden cortar en dígitos.

## Por qué hay una versión en Python

En TypeScript la comparación es una función que se pasa a nuestras propias ordenaciones, y counting sort hace cero comparaciones por construcción. Python permite un experimento más fuerte. `python/lower_bound.py` define una clase `Key` que sobrecarga `<`, `<=`, `>`, `>=` y `==`, de modo que **toda** comparación entre dos claves se cuenta, incluidas las hechas dentro del `sorted` integrado (Timsort). Counting sort y radix sort se ejecutan sobre las mismas claves y su contador se queda en cero: la afirmación se mide, no se supone. Los enteros ilimitados de Python también dan ⌈lg n!⌉ exactamente, como la longitud en bits de n! − 1.

| Algoritmo (Python, n = 1,000, 1,000 entradas) | comparaciones mín. | media | máx. |
| --- | ---: | ---: | ---: |
| merge sort | 8,650 | 8,708.14 | 8,756 |
| sorted() (Timsort) | 8,620 | 8,657.43 | 8,701 |
| counting sort | 0 | 0 | 0 |
| radix sort | 0 | 0 | 0 |

Las entradas difieren de las de TypeScript porque cada lenguaje usa su propio generador con semilla.

## Cómo ejecutarlo

```sh
cd projects/big-o/sorting-lower-bound
docker compose run --rm ts-test
docker compose run --rm python-test
docker compose run --rm ts-demo        # results/results.md y results.json
docker compose run --rm python-demo    # results/results-python.md
```

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-BIGO-3.1 | el árbol tiene n! hojas y su altura es igual a ⌈lg(n!)⌉, para n = 3 y 4 | `ts/tests/decision-tree.test.ts` (merge sort) |
| MP-BIGO-3.2 | las comparaciones contadas nunca quedan por debajo de lg(n!) en 1,000 entradas aleatorias | `ts/tests/experiment.test.ts`, `results/results.md` |
| MP-BIGO-3.3 | counting y radix sort ordenan las mismas entradas con cero comparaciones entre elementos, en la misma tabla | `ts/tests/experiment.test.ts`, `python/test_lower_bound.py`, `results/` |

## Temas del quiz relacionados

`big-o` / `sorting-lower-bound`, `asymptotic-notation` y `best-worst-average-case`.
