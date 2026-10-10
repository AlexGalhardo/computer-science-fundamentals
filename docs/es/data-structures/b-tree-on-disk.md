# Árbol B en disco

> English version: [docs/en/data-structures/b-tree-on-disk.md](../../en/data-structures/b-tree-on-disk.md) · Versão em português: [docs/pt/data-structures/b-tree-on-disk.md](../../pt/data-structures/b-tree-on-disk.md)

Mini-proyecto: [projects/data-structures/b-tree-on-disk](../../../projects/data-structures/b-tree-on-disk). Lenguajes: C++, Rust. Temas del quiz: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## El problema

En memoria, seguir un puntero cuesta nanosegundos, así que el costo de un árbol de búsqueda es el número de comparaciones. En disco, los datos se leen en **páginas** (aquí de 4096 bytes), y traer una página cuesta miles de veces más que comparar claves que ya están en memoria. El costo de una búsqueda pasa a ser el número de páginas que lee.

Un árbol binario balanceado con un millón de claves tiene unos 20 niveles de altura. Si cada nodo vive en una página distinta, una búsqueda lee unas 20 páginas. El árbol B lo arregla haciendo cada nodo tan grande como una página.

## La estructura

Un nodo guarda muchas claves en orden, y un hijo entre cada par de claves:

```text
                  [ 30 | 60 ]
                 /     |     \
     [ 10 | 20 ]   [ 40 | 50 ]   [ 70 | 80 | 90 ]
```

Con grado mínimo t:

- todo nodo salvo la raíz tiene entre t - 1 y 2t - 1 claves,
- un nodo interno con k claves tiene k + 1 hijos,
- las claves de un nodo están ordenadas, y el hijo i guarda solo claves entre la clave i - 1 y la clave i,
- **todas las hojas están a la misma profundidad**.

En este mini-proyecto una página cabe 169 claves, 169 valores y 170 números de página de hijos, así que t = 85. Un millón de claves caben en 3 niveles.

## El archivo

| Página | Contenido |
| --- | --- |
| 0 | encabezado: número mágico, grado mínimo, página de la raíz, cuenta de claves, altura, cabeza de la lista de páginas libres |
| cualquier otra | un nodo, o una página libre que guarda el número de la siguiente página libre |

Los hijos son **números de página**, no direcciones de memoria. Un puntero no significa nada después de que el programa termina, un número de página es válido mientras el archivo exista. El **pager** es el único código que toca el archivo, y cuenta cada página leída y escrita. No tiene caché a propósito: un nodo visitado es una página leída.

## Las operaciones

**Búsqueda** lee una página por nivel, hace búsqueda binaria de las claves dentro de ella y sigue un hijo.

**Inserción** baja una sola vez. Antes de entrar a un hijo lleno lo **divide**: la clave del medio sube al padre y la mitad de las claves se mueve a una página nueva.

```text
antes:   padre [ 50 ]            hijo [ 10 | 20 | 30 ]  (lleno, t = 2)
después: padre [ 20 | 50 ]       hijos [ 10 ] y [ 30 ]
```

Cuando la propia raíz está llena, se divide bajo una raíz nueva. Esta es la única forma en que el árbol crece en altura, y hace que todas las hojas queden un nivel más hondas a la vez.

**Eliminación** también baja una sola vez. Antes de entrar a un hijo con solo t - 1 claves, lo reabastece:

- **redistribución**: un hermano con claves de sobra presta una por medio del padre (la clave del padre baja, la clave del hermano sube),
- **fusión**: cuando ningún hermano puede prestar, el hijo, un hermano y la clave del padre entre ellos se vuelven un solo nodo, y se libera una página.

Una clave hallada en un nodo interno se reemplaza por su antecesor o sucesor, que está en una hoja, y ese es el que se elimina. Cuando la raíz se queda sin claves, su único hijo pasa a ser la raíz y el árbol queda un nivel más bajo.

Las páginas liberadas van a una lista enlazada dentro del archivo y se reutilizan antes de que el archivo crezca.

## Qué demuestran las pruebas

- 100,000 operaciones aleatorias con grado mínimo 2, 3 y 85 dan las mismas respuestas que el mapa ordenado del lenguaje, y después de ellas las invariantes valen: número de claves por nodo, orden, profundidad de hojas igual.
- Con 1,000,000 de claves el árbol tiene 3 niveles y ninguna búsqueda, exitosa o no, lee más de 3 páginas.

## La comparación

Las mismas claves entran a un árbol binario de búsqueda guardado en el mismo tipo de archivo (128 nodos por página, en orden de llegada). Resultado versionado: [results/page-reads.md](../../../projects/data-structures/b-tree-on-disk/results/page-reads.md).

| Claves | Niveles del árbol B | Páginas por búsqueda del árbol B (prom. / máx.) | Altura del ABB (nodos) | Páginas por búsqueda del ABB (prom. / máx.) |
| ---: | ---: | ---: | ---: | ---: |
| 1,000 | 2 | 1.99 / 2 | 25 | 3.26 / 7 |
| 10,000 | 2 | 1.99 / 2 | 33 | 7.33 / 18 |
| 100,000 | 3 | 2.99 / 3 | 41 | 11.90 / 26 |
| 1,000,000 | 3 | 2.99 / 3 | 50 | 16.46 / 34 |

Estos son conteos, no tiempos, y los programas en C++ y en Rust imprimen la misma tabla. El árbol binario de aquí no está balanceado (altura 50 para un millón de claves aleatorias). Uno perfectamente balanceado aún tendría unos 20 nodos de altura, y ahorraría solo los primeros niveles, que comparten una página. La ganancia del árbol B viene del ancho del nodo, no de un mejor balanceo.

## Límites de esta implementación

- El archivo del ABB se construye en memoria y se escribe una vez. Solo sus búsquedas corren contra el archivo.
- No hay caché, ni write-ahead log, ni control de concurrencia. Una caída en medio de una división puede dejar el archivo inconsistente. Las bases de datos reales agregan esas capas sobre la misma estructura.

## Cómo ejecutar

```sh
cd projects/data-structures/b-tree-on-disk
./setup-unix-b-tree-on-disk.sh          # o ./setup-windows-b-tree-on-disk.ps1
docker compose run --rm cpp-test btree_demo
```
