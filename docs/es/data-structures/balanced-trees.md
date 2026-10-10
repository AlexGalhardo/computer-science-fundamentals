# Árboles de búsqueda balanceados

> English version: [docs/en/data-structures/balanced-trees.md](../../en/data-structures/balanced-trees.md) · Versão em português: [docs/pt/data-structures/balanced-trees.md](../../pt/data-structures/balanced-trees.md)

Mini-proyecto: [projects/data-structures/balanced-trees](../../../projects/data-structures/balanced-trees). Lenguajes: C++, Java. Temas del quiz: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## El problema

Un árbol binario de búsqueda responde "¿esta clave está aquí?" yendo a la izquierda o a la derecha en cada nodo, así que toda operación cuesta la altura del árbol. Con n claves la altura puede ser cualquier cosa entre cerca de log2(n) y n, y el árbol simple no hace nada para controlarla: una clave nueva se vuelve hoja donde termina la búsqueda de ella.

Cuando las claves llegan ya ordenadas, cada una es mayor que todas las demás y va a la derecha de la última. El árbol se vuelve una lista enlazada:

```text
insertar 10, 20, 30, 40        un árbol balanceado con las mismas claves

10                                   20
  \                                 /  \
   20                             10    30
     \                                    \
      30                                   40
        \
         40
```

## La herramienta: rotación

Una rotación intercambia los papeles de un nodo y de uno de sus hijos, cambiando tres punteros:

```text
      x                 y
     / \               / \
    A   y     -->     x   C        rotación a la izquierda en x
       / \           / \
      B   C         A   B
```

Leídos de izquierda a derecha, los dos árboles dicen A, x, B, y, C. El orden de las claves no cambia, así que el resultado sigue siendo un árbol de búsqueda, pero un lado quedó más bajo y el otro más alto. Los árboles balanceados son árboles de búsqueda comunes más una regla que dice cuándo girar.

## Árbol AVL

Regla: en todo nodo, las alturas de los dos subárboles difieren en como máximo 1.

Cada nodo guarda su altura. Después de una inserción o eliminación, se revisan los nodos del camino de vuelta a la raíz. El factor de balance es la altura derecha menos la altura izquierda, y un nodo en +2 o -2 se arregla:

- **caso de afuera** (el nieto alto está del lado de afuera): una rotación,
- **caso de adentro** (un zigzag): dos rotaciones, primero en el hijo, para alinear el camino, luego en el nodo.

La altura queda por debajo de cerca de 1.44 log2(n).

## Árbol rojo-negro

Reglas: todo nodo es rojo o negro, la raíz es negra, las hojas NIL son negras, un nodo rojo no tiene hijo rojo, y todo camino de un nodo hasta las hojas debajo de él tiene el mismo número de nodos negros. El camino más largo tiene entonces como máximo el doble del más corto, y la altura queda por debajo de 2 log2(n + 1).

Una clave nueva entra roja, lo que nunca altera una cuenta de negros. Si el padre también es rojo, el tío decide:

- **tío rojo**: solo cambian los colores (padre y tío negros, abuelo rojo) y la verificación sube dos niveles,
- **tío negro**: una o dos rotaciones con cambio de colores, y el arreglo termina.

La regla es más floja que la del AVL, así que el árbol puede ser más alto, y a cambio las actualizaciones reestructuran menos.

## Qué demuestran las pruebas

- En los tres árboles, la invariante vale después de cada una de 18,000 operaciones aleatorias, y toda respuesta coincide con el conjunto ordenado del lenguaje.
- Inserción ordenada de 100,000 claves: altura 100,000 en el árbol sin balanceo, 17 en el AVL y 31 en el rojo-negro.

## Las mediciones

Tabla versionada: [results/heights.md](../../../projects/data-structures/balanced-trees/results/heights.md).

| Claves | Orden | Altura del ABB | Altura del AVL | Rotaciones del AVL | Altura del rojo-negro | Rotaciones del rojo-negro |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 100,000 | ordenado | 100,000 | 17 | 99,983 | 31 | 99,969 |
| 100,000 | aleatorio | 41 | 20 | 70,164 | 20 | 58,528 |

Con claves aleatorias el árbol simple es solo cerca de dos veces más alto que los balanceados. El balanceo es un seguro contra el orden de llegada, que el árbol no elige. El precio es pequeño: cerca de una rotación por inserción en el peor caso, cada una en O(1).

## El visualizador

`dashboard/index.html` se abre directo desde el disco y reproduce la inserción de 10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45 en los tres árboles, un cambio por paso. Para esta secuencia el árbol sin balanceo termina con 7 niveles, y el AVL y el rojo-negro terminan con 4 niveles después de 8 rotaciones cada uno. Los nodos se quedan siempre en la misma columna (la posición en orden), así que una rotación aparece como dos nodos que cambian de nivel.

## Cómo ejecutar

```sh
cd projects/data-structures/balanced-trees
./setup-unix-balanced-trees.sh          # o ./setup-windows-balanced-trees.ps1
docker compose run --rm cpp-test tree_demo heights
```
