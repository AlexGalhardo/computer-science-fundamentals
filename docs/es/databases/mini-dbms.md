# Mini SGBD relacional (MP-DB-1)

> English version: [docs/en/databases/mini-dbms.md](../../en/databases/mini-dbms.md) · Versão em português: [docs/pt/databases/mini-dbms.md](../../pt/databases/mini-dbms.md)

Código: [projects/databases/mini-dbms](../../../projects/databases/mini-dbms). Lenguajes: Rust y Python.

## Qué enseña

Un SGBD relacional responde a una consulta combinando unos pocos operadores. Este miniproyecto implementa los tres que aparecen en casi toda consulta y muestra que el *mismo* operador puede calcularse con algoritmos muy distintos.

| Operador | Álgebra | SQL | Qué hace |
| --- | --- | --- | --- |
| Selección (restricción) | σ | `WHERE` | conserva las filas que cumplen una condición, con todas las columnas |
| Proyección | π | la lista del `SELECT` | conserva algunas columnas de cada fila |
| Join | ⋈ | `JOIN ... ON` | combina filas de dos tablas que tienen la misma clave |

## Selección y proyección

Una tabla es un encabezado (nombres de las columnas) y una lista de filas. La selección lee cada fila una vez y conserva aquellas donde `columna op constante` es verdadero. Sin índice no hay atajo, así que el costo es O(n).

La proyección conserva las columnas pedidas. Descartar columnas puede volver iguales filas que eran distintas, y aquí el modelo relacional y SQL discrepan:

- en el álgebra relacional una relación es un **conjunto**, así que los duplicados desaparecen;
- en SQL una tabla es un **multiconjunto**, así que se quedan, a menos que se escriba `DISTINCT`.

`project(columns, distinct)` implementa ambos, y las pruebas verifican cada uno contra SQLite (`SELECT` y `SELECT DISTINCT`).

## Tres formas de calcular un join

Los tres reciben dos tablas y una columna de cada una, y devuelven los pares de filas cuyas claves son iguales.

```text
bucles anidados      hash join                    sort-merge join

para r en R:         construcción: para s en S:   ordena R por la clave
  para s en S:         cubeta[s.clave].add(s)     ordena S por la clave
    si r.k == s.k:   sondeo: para r en R:         recorre las dos listas juntas,
      emite(r, s)      emite(r, cada s en           avanzando la clave menor
                       cubeta[r.clave])
n * m comparaciones  unos n + m pasos             n log n + m log m, luego n + m
```

- **Bucles anidados** (nested loop) compara cada fila de R con cada fila de S. Es el único que funciona con cualquier condición (`<`, `<>`, una función), y el único cuyo costo es el *producto* de los tamaños.
- **Hash join** se apoya en un hecho: las claves iguales tienen el mismo hash, así que caen en la misma cubeta. Lee cada tabla una vez. Necesita memoria para la tabla hash y solo funciona para igualdad.
- **Sort-merge join** se apoya en el orden: con los dos lados ordenados, las claves que coinciden se encuentran en un solo recorrido. Las claves repetidas forman un tramo en cada lado, y toda fila de un tramo coincide con toda fila del otro. Si las entradas ya están ordenadas (por ejemplo, leídas a través de un índice ordenado), el paso de ordenamiento sale gratis.

Un optimizador de consultas elige entre ellos usando los tamaños de las tablas y el tipo de condición. Esa elección es invisible en SQL, que solo dice *qué* unir.

## Cómo se verifican las respuestas

SQLite es el árbitro.

- **Python** carga las mismas filas aleatorias en una base de datos SQLite en memoria (módulo `sqlite3` de la biblioteca estándar) y compara el motor con `SELECT ... WHERE ...`, `SELECT DISTINCT` y `JOIN ... ON`. Los resultados se comparan ordenados, porque una consulta sin `ORDER BY` no promete ningún orden.
- **Rust** no tiene SQLite en su biblioteca estándar, y el crate no tiene dependencias. `python/make_fixtures.py` ejecuta una lista fija de consultas en SQLite y escribe las tablas, las consultas y las filas que SQLite devolvió en `fixtures/sqlite_cases.tsv`. Las pruebas en Rust ejecutan las mismas consultas y comparan. Una prueba en Python regenera el archivo en memoria y falla si la copia versionada es distinta, así que las filas esperadas son siempre las de SQLite.
- **Ambos** ejecutan los tres joins en 200 tablas aleatorias con claves repetidas y ausentes, y exigen los mismos pares.

## Benchmark

Carga: `R(id, k)` y `S(k, v)` con n filas cada una. `R.k` es aleatorio, `S.k` contiene cada valor de 0 a n-1 una vez en orden mezclado, así que el join devuelve exactamente n filas. Un generador pseudoaleatorio escrito a mano, con las mismas constantes en los dos lenguajes, hace que las tablas sean idénticas, y cada ejecución imprime un checksum (cantidad de pares y la suma de `R.id * S.v`). El checksum es el mismo para los tres algoritmos y para los dos lenguajes.

```sh
bun run bench -- --project projects/databases/mini-dbms
```

Resultados versionados: [results.md](../../../projects/databases/mini-dbms/results/results.md), que también muestra `dashboard/index.html`. Tramo medido (solo el join), de la ejecución versionada:

| n | nested loop (Rust) | hash (Rust) | sort-merge (Rust) |
| ---: | ---: | ---: | ---: |
| 1,000 | 4.24 ms | 0.25 ms | 0.20 ms |
| 10,000 | 332 ms | 3.05 ms | 2.63 ms |
| 100,000 | no se ejecutó | 53.9 ms | 107 ms |
| 1,000,000 | no se ejecutó | 983 ms | 1,597 ms |

Cómo leerlo:

- Diez veces más filas le cuestan al nested loop unas 80 veces más tiempo. Esa es la firma de un algoritmo cuadrático (el factor teórico es 100).
- Hash y sort-merge crecen de forma casi lineal, y sort-merge pierde terreno en los tamaños grandes por el ordenamiento `n log n`.
- Rust y Python muestran la misma *forma* con constantes distintas: el algoritmo decide el crecimiento, el lenguaje decide la constante.

El nested loop está limitado a 10,000 filas en `bench.json`. Una ejecución manual en Rust con 100,000 filas tardó 27.4 s, y 1,000,000 de filas tardaría unos 45 minutos por ejecución, así que los tamaños mayores se dejaron fuera en un equipo compartido. Los números dependen del equipo registrado en `results.md`.

## Temas del quiz relacionados

`databases` / `relational-algebra`, `databases` / `query-optimisation-and-indexes`, `databases` / `relational-calculus-and-sql`.

## Límites

Sin NULLs, índices, lenguaje de consulta ni almacenamiento en disco, y los joins son por igualdad en una sola columna. Fuente de las ideas: C. J. Date, *An Introduction to Database Systems*, capítulos 7 (Relational Algebra) y 18 (Optimization).
