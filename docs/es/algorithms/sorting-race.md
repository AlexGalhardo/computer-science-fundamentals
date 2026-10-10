# Carrera de ordenación

> English version: [docs/en/algorithms/sorting-race.md](../../en/algorithms/sorting-race.md) · Versão em português: [docs/pt/algorithms/sorting-race.md](../../pt/algorithms/sorting-race.md)

Mini-proyecto: [`projects/algorithms/sorting-race`](../../../projects/algorithms/sorting-race/README.es.md) (MP-ALG-1). Lenguajes: TypeScript (referencia), C++, Python, Java, Elixir, Rust y Go. Quiz: área `algorithms`, temas `elementary-sorts`, `merge-sort`, `quicksort`, `heapsort`, `linear-time-sorts` y `sorting-properties`.

## La pregunta

¿Un programa es lento por el lenguaje o por el algoritmo? La carrera responde fijando una sola cosa a la vez: seis algoritmos, siete lenguajes, los mismos archivos de entrada.

## Los seis algoritmos

| Algoritmo | Idea | Mejor | Peor | Memoria extra | Estable |
| --- | --- | --- | --- | --- | --- |
| Bubble | intercambiar vecinos desordenados, detenerse tras una pasada sin intercambios | `O(n)` | `O(n²)` | `O(1)` | sí |
| Insertion | insertar cada valor en el prefijo ordenado | `O(n)` | `O(n²)` | `O(1)` | sí |
| Merge | dividir a la mitad, ordenar las mitades, mezclar | `O(n log n)` | `O(n log n)` | `O(n)` | sí |
| Quick | particionar alrededor de la mediana de tres, ordenar cada lado | `O(n log n)` | `O(n²)` | `O(log n)` de pila | no |
| Heap | construir un max-heap en el arreglo, mover el máximo al final | `O(n log n)` | `O(n log n)` | `O(1)` | no |
| Radix (LSD, base 256) | cuatro pasadas de conteo estables, una por byte | `O(n)` | `O(n)` | `O(n)` | sí |

Cada implementación es una función pura escrita desde cero, sin llamar a ningún ordenamiento de biblioteca. El radix sort está escrito para enteros de 0 a 2^31 - 1, así que los archivos de entrada se mantienen en ese rango.

## Cómo se mantiene justa la carrera

- **Misma entrada.** Un generador con semilla fija escribe un entero por línea. Cada lenguaje lee el mismo archivo.
- **Misma respuesta.** Cada programa imprime un checksum de su salida, `h = (h · 31 + v) mod 1,000,000,007`, que depende del orden. El verificador falla si dos filas del mismo archivo discrepan.
- **Mismos casos de prueba.** Vacío, un solo elemento, ordenado, invertido, con duplicados y aleatorio, en las pruebas de los siete lenguajes.
- **Solo se cronometra la ordenación.** La columna `section` excluye el arranque del runtime y el análisis del archivo. La columna `process` los incluye.

## Qué mirar en los resultados

1. **Algoritmo contra lenguaje.** Con 10,000 valores, el merge sort en Python tardó 32.7 ms y el bubble sort en C++ tardó 69.0 ms. El lenguaje más lento con un buen algoritmo superó al lenguaje más rápido con uno malo.
2. **La prueba de duplicación.** De 100,000 a 200,000 valores, el merge sort tardó entre 1.76 y 2.45 veces más en seis lenguajes. `n log n` predice cerca de 2.1 y un algoritmo cuadrático daría 4.
3. **La excepción de Elixir.** Elixir midió 3.51 en la ejecución versionada y de 2.1 a 2.6 en una tranquila. Sus listas son inmutables, así que ordenar asigna celdas nuevas todo el tiempo y el recolector de basura copia las vivas. El algoritmo sigue siendo `n log n`, pero el runtime añade un costo que crece más rápido.
4. **Dónde cambia la lección.** En Elixir no hay intercambio ni índice. El heapsort se convierte en un leftist heap, un árbol cuya única operación es "mezclar dos heaps", y el quicksort construye tres listas nuevas por partición.
5. **Forma de la entrada.** `results/shapes.md` compara entrada aleatoria, ordenada e invertida en TypeScript: el bubble y el insertion sort pasan de cientos de milisegundos a una fracción de milisegundo con entrada ordenada, mientras que el heap y el radix sort no reaccionan.

Los números vienen de una sola máquina que ejecutaba otras cargas. Lee la dispersión y confía más en las razones que en los tiempos absolutos.

## Reproducir

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

Resultados: [`results/results.md`](../../../projects/algorithms/sorting-race/results/results.md). Dashboard: abre `projects/algorithms/sorting-race/dashboard/index.html` desde el disco. Los límites del benchmark están listados en el README del mini-proyecto.

## Para experimentar

- Añade selection sort y cuenta sus intercambios frente al bubble sort.
- Reemplaza la mediana de tres en el quicksort por el primer elemento y ejecuta la forma ordenada.
- Añade 1,000,000 a `sizes` en `bench.json` y mira qué lenguajes todavía terminan en un segundo.
