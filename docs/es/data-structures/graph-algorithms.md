# Algoritmos en grafos

> English version: [docs/en/data-structures/graph-algorithms.md](../../en/data-structures/graph-algorithms.md) · Versão em português: [docs/pt/data-structures/graph-algorithms.md](../../pt/data-structures/graph-algorithms.md)

Mini-proyecto: [projects/data-structures/graph-algorithms](../../../projects/data-structures/graph-algorithms). Lenguajes: C++, Go. Tema del quiz: `data-structures` / `graphs`.

## La idea

Un grafo es un conjunto de vértices y un conjunto de aristas entre ellos. Antes de cualquier algoritmo, hay una decisión de diseño: cómo almacenarlo. Este mini-proyecto define una pequeña interfaz (`vertex count`, `add arc`, `has arc`, `neighbours`), la implementa dos veces y escribe cada algoritmo contra la interfaz. La misma suite de pruebas corre entonces sobre las dos implementaciones.

## Dos representaciones

```text
arcos: 0->1 (4), 0->2 (1), 2->1 (2)

lista de adyacencia          matriz de adyacencia
0: (1, 4) (2, 1)                  0    1    2
1:                           0    -    4    1
2: (1, 2)                    1    -    -    -
                             2    -    2    -
```

| Operación | Lista de adyacencia | Matriz de adyacencia |
| --- | --- | --- |
| Memoria | O(V + E) | O(V^2) |
| ¿Existe el arco (u, v)? | O(grado de u) | O(1) |
| Vecinos de u | O(grado de u) | O(V) |
| Visitar todos los arcos | O(V + E) | O(V^2) |
| Arcos paralelos | se guardan todos | solo el más liviano |

La lista sirve para grafos dispersos, que son el caso común. La matriz compensa cuando el grafo es denso o cuando la prueba de arco domina. Su límite de vértices aquí es 4,096: una matriz para los 100,000 vértices de los casos de referencia 4 y 5 necesitaría 10^10 celdas.

## Los algoritmos

| Algoritmo | Problema | Idea | Costo con lista |
| --- | --- | --- | --- |
| Dijkstra | caminos mínimos desde un origen, sin pesos negativos | finalizar el vértice no finalizado más cercano, tomado de un heap de mínimo | O((V + E) log V) |
| Bellman-Ford | caminos mínimos con pesos negativos | relajar cada arco V - 1 veces | O(V E) |
| Ordenamiento topológico (Kahn) | un orden donde cada arco va hacia adelante | listar un vértice cuando su cuenta de entrada llega a cero | O((V + E) log V) con el heap |
| Caminos mínimos en DAG | caminos mínimos en un grafo acíclico | relajar en orden topológico, una sola vez | O(V + E) |
| Prim | árbol generador mínimo | hacer crecer un árbol con la arista más liviana que sale de él | O(E log V) |
| Kruskal | árbol generador mínimo | tomar aristas de la más liviana a la más pesada, saltar las que cierran un ciclo (union-find) | O(E log E) |

### Qué significa "reportar"

- **Dijkstra** rechaza un grafo con un peso negativo, porque su elección voraz ya no sería segura.
- **Bellman-Ford** marca `negative cycle` cuando una ronda más de relajación aún mejora una distancia. Con un ciclo así, "camino mínimo" no tiene sentido.
- **El ordenamiento topológico** marca `has cycle` cuando pudieron listarse menos de V vértices. Un vértice en un ciclo, o uno que depende de un ciclo, nunca llega a una cuenta de entrada de cero. El orden parcial igual se devuelve.
- **Prim y Kruskal** marcan `connected` en false cuando el grafo tiene más de un componente.

## Los diez casos de referencia

Los casos vienen de una tarea de curso y tienen dos tipos de problema.

1. **Menor orden topológico** (casos 1 a 5). Los vértices listos esperan en un heap de mínimo, así que la menor etiqueta sale siempre primero. Los casos 4 y 5 son grafos aleatorios con 100,000 vértices que sí contienen ciclos: 79 y 28 vértices respectivamente no pueden ordenarse, y la salida esperada lista solo los demás. La biblioteca reporta el ciclo e imprime el orden parcial, que coincide con los archivos esperados.
2. **Empacar objetos en cajas** (casos 6 a 10). n objetos, en orden, van a exactamente k cajas de volumen V, y el costo es la suma del sobrante al cuadrado de cada caja. Esto se resuelve como un camino mínimo en un grafo acíclico por capas: el vértice (j, i) significa "j cajas cerradas, i objetos empacados". Es el mismo cálculo que la tabla de programación dinámica, visto como un grafo.

Ambos lenguajes pasan los 10 casos con la lista de adyacencia. La matriz pasa los 6 casos que caben en su límite de vértices.

## Qué muestra el benchmark

`bun run bench -- --project graph-algorithms` corre cada algoritmo en grafos generados con 1,000 y 4,000 vértices y cerca de 8 arcos por vértice. La tabla versionada es [results/results.md](../../../projects/data-structures/graph-algorithms/results/results.md).

En la ejecución versionada, con 4,000 vértices, Dijkstra en la matriz tardó cerca de 15 veces más que en la lista en ambos lenguajes (la columna `section`), y el proceso usó cerca de 129 MiB en lugar de 5 MiB. El grafo y la respuesta son los mismos: la columna checksum es idéntica para lista y matriz, y para C++ y Go. Los tiempos de unos pocos milisegundos son ruidosos en una máquina compartida, así que solo las razones grandes como esta son conclusiones.

## Cómo ejecutar

```sh
cd projects/data-structures/graph-algorithms
./setup-unix-graph-algorithms.sh          # o ./setup-windows-graph-algorithms.ps1
docker compose run --rm cpp-test graph_cli case /cases/1.in
```
