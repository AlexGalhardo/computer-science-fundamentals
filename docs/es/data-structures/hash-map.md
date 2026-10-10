# Mapa de dispersión desde cero

> English version: [docs/en/data-structures/hash-map.md](../../en/data-structures/hash-map.md) · Versão em português: [docs/pt/data-structures/hash-map.md](../../pt/data-structures/hash-map.md)

Mini-proyecto: [projects/data-structures/hash-map](../../../projects/data-structures/hash-map). Lenguajes: C++, Rust, TypeScript. Tema del quiz: `data-structures` / `hash-tables`.

## La idea

Un mapa de dispersión transforma la clave en un índice de arreglo con una función de dispersión (hash), así que la búsqueda va directo a una posición en lugar de buscar. Existen muchas más claves posibles que posiciones, así que dos claves distintas a veces reciben el mismo índice. Eso es una **colisión**, y las dos formas clásicas de resolverla son las dos implementaciones de este mini-proyecto.

## Encadenamiento separado

Cada posición (cubeta) guarda una lista enlazada con todas las entradas que cayeron ahí.

```text
cubeta 0: (8, h) -> (4, d)
cubeta 1: (5, e)
cubeta 2: vacía
cubeta 3: (7, g) -> (3, c)
```

- `put` recorre la lista buscando la clave y, cuando es nueva, enlaza un nodo al inicio.
- `get` recorre la misma lista.
- `remove` desenlaza un nodo.

Una colisión solo alarga una lista. El costo de una operación es el tamaño de la lista, que en promedio es el factor de carga.

## Direccionamiento abierto con sondeo lineal

Toda entrada vive en el propio arreglo. Cuando la posición que da el hash está ocupada, se prueba la siguiente, luego la siguiente, dando la vuelta al final.

```text
h(k) = k mod 7        insertar 10, 17, 24, 3

índice:  0    1    2    3    4    5    6
       [  ] [  ] [  ] [10] [17] [24] [ 3]
```

La búsqueda sigue la misma secuencia y se detiene cuando encuentra la clave o una posición **vacía**.

### Por qué la eliminación necesita lápidas

Posición vacía significa "ninguna clave pasó por aquí". Si eliminar el 10 simplemente vaciara el índice 3, una búsqueda del 17 empezaría en el índice 3, lo encontraría vacío y respondería, erróneamente, "no existe". Por eso la eliminación graba una **lápida** (tombstone): las búsquedas pasan por encima de ella, y una inserción puede reutilizarla.

Las lápidas siguen alargando todo sondeo. Las implementaciones cuentan las lápidas junto con las entradas vivas, y reconstruir la tabla (rehash) las descarta todas.

## Factor de carga y rehashing

El factor de carga es el número de entradas dividido por el número de posiciones. Cuando pasa de un límite (por defecto, 0.75 en el encadenamiento y 0.5 en el sondeo) la tabla se duplica, y todas las entradas se insertan de nuevo, porque el índice `hash % capacidad` depende de la capacidad. Un rehash cuesta O(n), pero duplicar lo vuelve lo bastante raro para que la inserción siga siendo O(1) amortizado.

Para una búsqueda que falla, el trabajo esperado es:

| Factor de carga | Encadenamiento (entradas examinadas) | Sondeo lineal (posiciones examinadas) |
| ---: | ---: | ---: |
| 0.25 | 0.25 | 1.4 |
| 0.5 | 0.5 | 2.5 |
| 0.75 | 0.75 | 8.5 |
| 0.9 | 0.9 | 50.5 |

El encadenamiento crece de forma lineal. El sondeo lineal sigue aproximadamente (1 + 1/(1 - a)^2) / 2, porque las posiciones ocupadas se juntan en bloques largos (**agrupamiento primario**): una clave que cae en cualquier punto de un bloque tiene que caminar hasta el final de él, y lo hace más grande.

## Qué demuestran las pruebas

- Las **pruebas de propiedad** ejecutan 20,000 operaciones aleatorias por semilla en nuestro mapa y en el mapa del lenguaje, y comparan cada respuesta. Un hash débil (`clave % 4`) fuerza colisiones en casi toda operación.
- **Redimensionamiento**: el factor de carga nunca pasa del límite durante 10,000 inserciones.
- **Lápidas**: con tres claves que colisionan, un `get` después de eliminar e insertar devuelve el valor correcto.

## Qué muestra el benchmark

`bun run bench -- --project hash-map` arma tablas con cargas 0.25, 0.5, 0.75 y 0.9 con 200,000 claves y cronometra 400,000 búsquedas, la mitad de ellas de claves ausentes. La tabla versionada es [results/results.md](../../../projects/data-structures/hash-map/results/results.md).

En la ejecución versionada, las búsquedas del sondeo lineal con carga 0.9 tardaron entre 3 y 4.5 veces más que con carga 0.5 en los tres lenguajes, mientras que el encadenamiento quedó dentro del ruido de la máquina. Las diferencias menores que la desviación estándar, que es grande por debajo de la carga 0.75 en una máquina compartida, no son conclusiones. Con cargas bajas, la tabla más grande cuesta más fallos de caché, y por eso "más vacía" no siempre es más rápida.

## Cómo ejecutar

```sh
cd projects/data-structures/hash-map
./setup-unix-hash-map.sh          # o ./setup-windows-hash-map.ps1
```
