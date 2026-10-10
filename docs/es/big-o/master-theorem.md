# Teorema maestro interactivo

> English version: [docs/en/big-o/master-theorem.md](../../en/big-o/master-theorem.md) · Versão em português: [docs/pt/big-o/master-theorem.md](../../pt/big-o/master-theorem.md)

Miniproyecto MP-BIGO-2, en [`projects/big-o/master-theorem`](../../../projects/big-o/master-theorem). Enseña cómo los tres casos del teorema maestro deciden el costo de una recurrencia.

## La recurrencia

Un algoritmo de divide y vencerás parte un problema de tamaño n en `a` subproblemas de tamaño `n/b`, y hace `f(n)` de trabajo fuera de las llamadas recursivas (dividir y combinar):

```text
T(n) = a·T(n/b) + f(n)        a ≥ 1, b > 1
```

Merge sort es `2T(n/2) + n`, la búsqueda binaria es `T(n/2) + 1`, y la multiplicación de matrices de Strassen es `7T(n/2) + n²`.

## Una comparación, tres casos

El árbol de recursión tiene `a^i` llamadas a profundidad `i`, cada una sobre una entrada de tamaño `n/b^i`. Sus hojas son `n^(log_b a)`. El teorema compara `f(n)` con ese número:

| Caso | Condición | Quién paga la cuenta | Solución |
| --- | --- | --- | --- |
| 1 | f(n) es polinomialmente menor que n^(log_b a) | las hojas | Θ(n^(log_b a)) |
| 2 | f(n) tiene el mismo orden que n^(log_b a) | cada nivel, por igual | Θ(n^(log_b a) · log n) |
| 3 | f(n) es polinomialmente mayor que n^(log_b a) | la raíz | Θ(f(n)) |

"Polinomialmente" significa por un factor `n^ε` para algún ε > 0. El caso 3 también necesita la condición de regularidad `a·f(n/b) ≤ c·f(n)` con `c < 1`, que siempre se cumple para las funciones que se usan aquí.

## Cuando el teorema no se aplica

El clasificador reporta dos situaciones en lugar de inventar una respuesta:

- **Fuera de las hipótesis**: `a < 1` o `b ≤ 1`, por ejemplo una recurrencia que resta en lugar de dividir. La entrada se rechaza indicando la hipótesis que rompe.
- **En la brecha entre los casos**: `f(n)` difiere de `n^(log_b a)` solo por un factor logarítmico, como en `2T(n/2) + n log n`. Los tres casos básicos no dicen nada. Para una potencia positiva del logaritmo, la herramienta también muestra lo que da el caso 2 extendido (un factor log más, aquí Θ(n log² n)). Para `n / log n` no da ninguna solución.

`f(n)` se restringe a `n^d · (log n)^k`, que cubre las recurrencias habituales de los libros de texto.

## La comprobación empírica

Una predicción vale más cuando puede fallar. `ts/src/empirical.ts` genera la función recursiva que describe una recurrencia, la ejecuta sin memoización y cuenta sus llamadas y su trabajo total `W(n)`. Si el teorema predice Θ(g(n)), la razón `W(n) / g(n)` debe estabilizarse en una constante.

La comprobación mide la **deriva** de esa razón entre los dos tamaños más grandes, para la clase predicha y para sus dos vecinas (un factor log menos, uno más). El crecimiento medido concuerda cuando la clase predicha tiene una deriva menor al 5% y menor que las de ambas vecinas. Resultados, de [`results/results.md`](../../../projects/big-o/master-theorem/results/results.md):

| Recurrencia | Predicha | n más grande | Llamadas | Deriva predicha / un log menos / un log más |
| --- | --- | ---: | ---: | --- |
| merge sort, 2T(n/2) + n | Θ(n log n) | 65,536 | 131,071 | 0.0039 / 0.0625 / 0.0662 |
| búsqueda binaria, T(n/2) + 1 | Θ(log n) | 16,777,216 | 25 | 0.0017 / 0.0417 / 0.0433 |
| división en 7, 7T(n/2) + n² | Θ(n^2.81) | 128 | 960,800 | 0.0087 / 0.1768 / 0.1354 |

Son conteos, no tiempos, así que son iguales en todas las máquinas.

## El árbol de recursión

`bun run classify` imprime el árbol como texto, y la página estática lo dibuja: las llamadas de cada nivel a la izquierda, y una barra con el costo total del nivel a la derecha. Las barras que crecen hacia abajo son el caso 1, las barras iguales son el caso 2, y las barras que se encogen son el caso 3. El último nivel son los casos base, que cuestan 1 cada uno.

La página ofrece `a` de 1 a 9, `b` de 2 a 4 y ocho funciones de trabajo. Cada combinación fue clasificada por el código TypeScript probado y guardada en `results/results.js`, así que la página nunca reimplementa el teorema.

## Cómo ejecutarlo

```sh
cd projects/big-o/master-theorem
docker compose run --rm ts-test                          # pruebas
docker compose run --rm ts-demo                          # bun run demo
docker compose run --rm ts-demo bun run classify 7 2 2   # una recurrencia
```

Luego abre `dashboard/index.html` desde el disco.

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-BIGO-2.1 | las pruebas unitarias cubren una recurrencia por caso y una que no encaja | `ts/tests/classify.test.ts` |
| MP-BIGO-2.2 | el crecimiento medido concuerda con la clase predicha para merge sort, búsqueda binaria y una división en 7 | `ts/tests/empirical.test.ts`, `results/results.md` |
| MP-BIGO-2.3 | un comando imprime el caso y la página dibuja el árbol para los a, b elegidos | `bun run classify`, `dashboard/index.html` |

## Temas del quiz relacionados

`big-o` / `recurrences-master-theorem`.
