# Laboratorio de Big O

> English version: [docs/en/big-o/big-o-lab.md](../../en/big-o/big-o-lab.md) · Versão em português: [docs/pt/big-o/big-o-lab.md](../../pt/big-o/big-o-lab.md)

Miniproyecto MP-BIGO-1, en [`projects/big-o/big-o-lab`](../../../projects/big-o/big-o-lab). Enseña a medir una función y a reconocer su curva de crecimiento.

## La idea

Big O describe cómo crece el costo de un algoritmo con el tamaño de la entrada. El laboratorio convierte esa frase en un experimento de tres pasos:

1. **Contar.** Cada algoritmo incrementa un contador en su operación básica, el paso que más se repite. Un conteo, a diferencia de un tiempo, es igual en todas las máquinas.
2. **Duplicar.** El tamaño de la entrada se duplica en cada ejecución. Cómo reacciona el conteo a la duplicación es la firma de la clase.
3. **Ajustar.** Los conteos se comparan con seis curvas candidatas, y la más cercana nombra la clase.

## Las seis muestras

| Clase | Algoritmo | Operación contada | Fórmula cerrada | Cuando n se duplica |
| --- | --- | --- | --- | --- |
| O(1) | leer el elemento central de un arreglo | lecturas del arreglo | 1 | nada cambia |
| O(log n) | búsqueda binaria de un valor ausente | divisiones a la mitad del intervalo | floor(log₂ n) + 1 | un paso más |
| O(n) | suma de todos los elementos | sumas | n | el conteo se duplica |
| O(n log n) | merge sort | elementos escritos durante la mezcla | n·ceil(log₂ n) − 2^ceil(log₂ n) + n | un poco más del doble |
| O(n²) | contar inversiones comparando cada par | comparaciones | n(n − 1)/2 | unas cuatro veces |
| O(2ⁿ) | enumerar cada subconjunto | subconjuntos visitados | 2ⁿ | el conteo se eleva al cuadrado |

La fórmula de merge sort resuelve T(n) = T(⌊n/2⌋) + T(⌈n/2⌉) + n con T(1) = 0, y es igual a n·log₂ n cuando n es una potencia de dos. La muestra exponencial usa n = 1, 2, 4, 8, 16: una duplicación más significaría más de cuatro mil millones de subconjuntos, que es la lección sobre los costos intratables.

## Ajuste de curvas

Para cada candidata g(n), la herramienta encuentra, por mínimos cuadrados ordinarios, la recta `y = a + c·g(n)` más cercana a los puntos medidos, y reporta el error cuadrático medio dividido por la media de y. Gana la candidata con el menor error relativo, y un empate se lo lleva la curva de crecimiento más lento.

Dos cosas vale la pena notar en los resultados:

- La constante `c` que encuentra el ajuste es la constante que Big O esconde. Para la muestra cuadrática sale de aproximadamente 0.4999, porque el conteo es n(n − 1)/2.
- La muestra cuadrática es la única cuyo mejor ajuste no es exacto (error relativo de aproximadamente 1.4 × 10⁻⁴). El conteo tiene un término de menor orden, −n/2, que una curva n² pura no puede seguir. El error es diminuto y el veredicto no cambia: los términos de menor orden no cambian la clase.

## Conteos frente al tiempo

La demo también registra el tiempo de cada ejecución (mediana de 5). El tiempo sigue la misma curva solo de forma aproximada: con entradas pequeñas lo dominan el ruido, el compilador JIT y la caché. Por eso la clase se decide con los conteos, y el tiempo se muestra junto a ellos para comparar.

## Cómo ejecutarlo

```sh
cd projects/big-o/big-o-lab
docker compose run --rm ts-test    # pruebas
docker compose run --rm ts-demo    # bun run demo: imprime las tablas y reescribe results/
```

Luego abre `dashboard/index.html` directo desde el disco. Los resultados versionados están en [`results/results.md`](../../../projects/big-o/big-o-lab/results/results.md).

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-BIGO-1.1 | los conteos de operaciones coinciden con la fórmula cerrada de cada muestra | `ts/tests/samples.test.ts` |
| MP-BIGO-1.2 | la herramienta nombra la clase correcta para las seis muestras | `ts/tests/fit.test.ts` |
| MP-BIGO-1.3 | `bun run demo` imprime la tabla y el dashboard grafica los resultados versionados | `docker compose run --rm ts-demo`, `dashboard/index.html` |

## Temas del quiz relacionados

`big-o` / `growth-of-functions`, `counting-operations` y `asymptotic-notation`.
