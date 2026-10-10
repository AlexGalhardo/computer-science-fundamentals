# Viajante de comercio

> English version: [docs/en/algorithms/travelling-salesman.md](../../en/algorithms/travelling-salesman.md) · Versão em português: [docs/pt/algorithms/travelling-salesman.md](../../pt/algorithms/travelling-salesman.md)

Mini-proyecto: [`projects/algorithms/travelling-salesman`](../../../projects/algorithms/travelling-salesman/README.es.md) (MP-ALG-3). Lenguajes: TypeScript y Rust. Quiz: área `algorithms`, temas `backtracking`, `dynamic-programming` y `greedy`.

## El problema

Dadas `n` ciudades y la distancia entre cada par, hallar el recorrido más corto que visita cada ciudad una vez y vuelve al inicio. El problema es NP-difícil: no se conoce ningún algoritmo que siempre encuentre el mejor recorrido en tiempo polinomial. Eso lo convierte en un buen lugar para ver tres actitudes distintas ante un problema difícil.

| Enfoque | Idea | Tiempo | Respuesta |
| --- | --- | --- | --- |
| Fuerza bruta | probar todos los órdenes | `O(n!)` | óptima |
| Held-Karp | programación dinámica sobre subconjuntos de ciudades | `O(n² · 2^n)`, memoria `O(n · 2^n)` | óptima |
| Vecino más cercano | ir siempre a la ciudad no visitada más próxima | `O(n²)` | válida, sin garantía |
| 2-opt | intercambiar dos tramos mientras el recorrido se acorte | `O(n²)` por pasada | óptimo local |

## Dónde se detiene la fuerza bruta

Con el inicio fijo hay `(n - 1)!` órdenes. El crecimiento no es "el doble de lento por ciudad" sino "`n` veces más lento por ciudad":

| Ciudades | Órdenes |
| ---: | ---: |
| 8 | 5,040 |
| 10 | 362,880 |
| 12 | 39,916,800 |
| 13 | 479,001,600 |
| 14 | 6,227,020,800 |
| 16 | 1,307,674,368,000 |

Medido en el benchmark versionado (la máquina y los comandos exactos están en [`results/results.md`](../../../projects/algorithms/travelling-salesman/results/results.md)):

| Ciudades | Fuerza bruta, TypeScript (ms) | Fuerza bruta, Rust (ms) | Held-Karp, TypeScript (ms) | Held-Karp, Rust (ms) |
| ---: | ---: | ---: | ---: | ---: |
| 11 | 202 | 70.9 | 3.79 | 0.25 |
| 12 | 1,709 | 765 | 4.58 | 0.59 |
| 13 | más de 12,000 (detenida) | 7,351 | 5.69 | 1.37 |
| 14 | detenida | más de 12,000 (detenida) | 9.38 | 3.10 |
| 20 | no se ejecutó | no se ejecutó | 569 | 437 |

La fuerza bruta supera los 10 segundos con **13 ciudades en TypeScript** y con **14 ciudades en Rust**. De 11 a 12 ciudades el tiempo crece unas 10 veces en ambos lenguajes, como predice `11! / 10! = 11`. Un lenguaje de 2 a 3 veces más rápido compra una ciudad. El benchmark detiene la fuerza bruta después de 12 segundos, así que las filas marcadas "detenida" informan el plazo, no un resultado.

## Por qué Held-Karp es mucho más rápido

La fuerza bruta trata dos caminos parciales como distintos aunque hayan visitado las mismas ciudades y se hayan detenido en el mismo lugar. Para lo que viene después, son equivalentes: solo importan el conjunto de ciudades visitadas y la última ciudad. Held-Karp guarda un número por cada par (conjunto, última ciudad), la longitud del mejor camino con esa descripción, y construye conjuntos mayores a partir de menores. Los conjuntos son máscaras de bits, llenadas en orden numérico creciente, porque quitar una ciudad de un conjunto siempre da una máscara menor.

Sigue siendo exponencial. Para 20 ciudades la tabla tiene cerca de 20 millones de entradas, y para 30 tendría 16 mil millones. El límite pasó del tiempo a la memoria.

## A qué renuncia una heurística

El vecino más cercano es voraz: nunca revisa una elección, así que tramos baratos al principio pueden forzar tramos caros al final. El 2-opt repara lo peor de eso con búsqueda local: elimina cruces hasta que ningún intercambio de dos tramos ayuda. En las instancias aleatorias de este proyecto (5 a 12 ciudades, 64 instancias) el vecino más cercano estuvo en promedio un 8% por encima del óptimo y en el peor caso un 33%, y el 2-opt estuvo en promedio un 0.6% por encima y en el peor caso un 5.6%, encontrando el óptimo en 49 de 64. Las pruebas exigen los factores 1.6 y 1.2.

Esos números describen esta familia de instancias. En general, el vecino más cercano no tiene garantía constante, y el 2-opt se detiene en un óptimo local que puede no ser el mejor recorrido. Lo que las heurísticas dan a cambio es escala: 100 ciudades en bastante menos de un milisegundo, un tamaño donde los dos métodos exactos están fuera de alcance.

## Para experimentar

- Quita el plazo y mide la fuerza bruta con 13 y 14 ciudades.
- Añade poda a la fuerza bruta (detén una rama cuando su longitud parcial ya alcance el mejor recorrido) y cuenta cuántos órdenes se omiten.
- Inicia el 2-opt desde un recorrido aleatorio en lugar del recorrido del vecino más cercano y compara los resultados.
