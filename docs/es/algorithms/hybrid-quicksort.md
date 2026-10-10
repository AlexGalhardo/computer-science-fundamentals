# Quicksort híbrido

> English version: [docs/en/algorithms/hybrid-quicksort.md](../../en/algorithms/hybrid-quicksort.md) · Versão em português: [docs/pt/algorithms/hybrid-quicksort.md](../../pt/algorithms/hybrid-quicksort.md)

Mini-proyecto: [`projects/algorithms/hybrid-quicksort`](../../../projects/algorithms/hybrid-quicksort/README.es.md) (MP-ALG-4). Lenguajes: C++ y Rust. Quiz: área `algorithms`, tema `quicksort`.

## Dos decisiones dentro del quicksort

El quicksort particiona un rango alrededor de un pivote y ordena cada lado. Su análisis esconde dos decisiones prácticas, y este mini-proyecto convierte cada una en una perilla.

### 1. Qué valor es el pivote

El pivote ideal es la mediana, que divide el rango por la mitad y da `log n` niveles. El peor pivote es el mínimo o el máximo, que quita un valor por nivel y da `n` niveles y tiempo `O(n²)`.

| Estrategia | Entrada aleatoria | Entrada ordenada o invertida | Debilidad |
| --- | --- | --- | --- |
| Primer elemento | `O(n log n)` | `O(n²)`: el primer valor es un extremo | Los datos reales suelen estar ya ordenados |
| Aleatorio | `O(n log n)` esperado | `O(n log n)` esperado | Costo de un número aleatorio por partición, y una probabilidad minúscula de mala suerte |
| Mediana de tres | `O(n log n)` | `O(n log n)`: el valor del medio es la verdadera mediana | Entradas construidas a propósito aún pueden derrotarla |

El código siempre recurre sobre el lado menor y hace un bucle sobre el mayor. Ese detalle importa para el experimento: el caso cuadrático se vuelve lento, pero no desborda la pila, así que se puede medir.

### 2. Cuándo dejar de recurrir

La mayoría de las llamadas del quicksort manejan rangos diminutos: la mitad del árbol de recursión está en su último nivel. En un rango de diez valores, el costo de elegir un pivote, particionar y hacer dos llamadas es mayor que el trabajo en sí. El insertion sort es cuadrático, pero con diez valores eso significa unas pocas docenas de pasos simples y ninguna llamada. Un quicksort híbrido entrega al insertion sort todo rango de como máximo `k` valores.

El umbral no cambia el orden de crecimiento: hay como máximo `n / k` rangos pequeños, cada uno con costo `O(k²)`, lo que da `O(n · k)` en total, y los niveles por encima de ellos siguen costando `O(n log(n / k))`. Cambia la constante, y el `k` correcto solo se encuentra midiendo.

## Qué se midió

Del benchmark versionado ([`results/results.md`](../../../projects/algorithms/hybrid-quicksort/results/results.md)), tramo medido en milisegundos:

| Implementación | Forma | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4,000 | 3.81 | 14.9 |
| `first-k0` | sorted | 16,000 | 51.4 | 212 |
| `median3-k0` | sorted | 16,000 | 0.17 | 0.19 |
| `median3-k0` | random | 1,000,000 | 89.8 | 121 |
| `median3-k50` | random | 1,000,000 | 68.1 | 65.7 |

- Con el primer elemento como pivote, 4 veces más valores ordenados cuestan 13.5 veces más tiempo en C++ y 14.2 en Rust. El crecimiento cuadrático predice 16.
- El barrido del umbral sobre `k` = 0, 5, 10, 20 y 50 registró **k = 50** como el mejor valor en ambos lenguajes (`results/threshold-cpp.md` y `results/threshold-rust.md`). Las diferencias entre umbrales vecinos son menores que la dispersión de las ejecuciones, así que la lectura segura es que un umbral de unas pocas decenas de valores ayuda.

## Cómo leer el dashboard

Abre `projects/algorithms/hybrid-quicksort/dashboard/index.html` desde el disco y elige la variante `sorted`. En el gráfico log-log una recta de pendiente 1 es crecimiento lineal y de pendiente 2 es cuadrático. `first-k0` sigue la pendiente 2 y se detiene en 16,000 valores, el límite del benchmark. Todas las demás estrategias se mantienen cerca de la pendiente 1.

## Para experimentar

- Añade un pivote de "último elemento" y comprueba qué formas lo rompen.
- Alimenta un arreglo donde todos los valores sean iguales y observa las tres estrategias. Después implementa la partición en tres vías.
- Barre `k` hasta 500 y encuentra el punto en el que el híbrido se vuelve más lento que el quicksort puro.
