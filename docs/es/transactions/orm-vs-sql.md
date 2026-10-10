# Prisma, Drizzle y SQL puro (MP-TX-3)

> English version: [docs/en/transactions/orm-vs-sql.md](../../en/transactions/orm-vs-sql.md) · Versão em português: [docs/pt/transactions/orm-vs-sql.md](../../pt/transactions/orm-vs-sql.md)

Mini-proyecto: [`projects/transactions/orm-vs-sql`](../../../projects/transactions/orm-vs-sql/README.es.md). Tema del quiz: `acid-properties` (transacciones a través de un ORM).

## La pregunta

Un ORM te permite escribir `post.findMany(...)` en lugar de SQL. Eso ahorra tecleo y da tipos, y también esconde dos cosas que aún necesitas saber: **qué SQL se envía** y **cuántas sentencias se envían**. Este mini-proyecto hace visibles ambas.

## Tres niveles de abstracción

| Enfoque | Tú escribes | Obtienes |
| --- | --- | --- |
| SQL puro (`pg`) | El texto SQL, con parámetros `$1` | Control total. Sin verificación de tipos entre el SQL y el código: los tipos de las filas son una promesa que tú haces |
| Drizzle | Un query builder que refleja el SQL (`select().from().innerJoin()`) | Tipos derivados del esquema, y un SQL casi exactamente igual a lo que escribiste |
| Prisma | Lo que quieres (`select`, `where`, relaciones) | El nivel más alto. Prisma decide cómo obtener los datos, así que el SQL puede sorprenderte |

El esquema se crea una sola vez, con `ts/sql/schema.sql`. Prisma y Drizzle solo describen las tablas existentes, así que la comparación trata de consultar.

## Qué muestra el SQL capturado

Las pruebas registran cada sentencia que envía cada enfoque y la escriben junto a la consulta (`ts/src/queries/*.captured.sql`). Cosas que vale la pena abrir:

- **Los tres enlazan parámetros** (`$1`, `$2`). Ninguno escribe el valor en el texto SQL, que es la defensa contra la inyección SQL.
- **`posts-with-author`**: el SQL puro y Drizzle envían un solo `JOIN`. Prisma envía **dos sentencias**: los posts, y luego `SELECT ... FROM authors WHERE id IN (...)`, y une las filas en la aplicación. Mismas filas, plan distinto, y la razón por la que esta consulta tiene la mayor brecha en la tabla de latencia.
- **`add-post-with-comment`**: los dos inserts viajan entre un `BEGIN` y un `COMMIT` en los tres. El registro de consultas de Prisma muestra el `COMMIT` pero no el `BEGIN`, un recordatorio de que el log de un ORM no siempre es la conversación completa.
- **`n-plus-one-naive`**: 151 sentencias casi idénticas. Verlas en un archivo convence más que cualquier explicación.

## Transacciones a través de un ORM

`add-post-with-comment` inserta un post y un comentario de forma atómica. La regla es la misma en los tres enfoques: dentro de la transacción, **toda sentencia pasa por el manejador de la transacción** (`tx`), que está ligado a una conexión. Una sentencia enviada por el cliente global se ejecuta en otra conexión, fuera de la transacción, y sobrevive a un rollback. Las pruebas fuerzan que el segundo insert falle (un `CHECK` sobre la longitud del comentario) y verifican que el post desaparece en los tres.

## N+1

Para listar N autores con sus posts, el código ingenuo ejecuta 1 consulta para los autores y 1 consulta por autor: N + 1 viajes de ida y vuelta. Cada uno es rápido. La suma no. La corrección es obtener todos los posts en una sola sentencia (`WHERE author_id = ANY(...)` o `IN (...)`), 2 sentencias en total, y agruparlos en memoria. Con Prisma la corrección es pedir la relación en la misma llamada.

En la ejecución medida, 150 autores costaron 151 sentencias contra 2, y la corrección fue entre 25 y 33 veces más rápida, **con la base de datos en la misma máquina**. Con una red real entre la aplicación y la base de datos cada viaje de ida y vuelta cuesta mucho más, y también el N+1.

## Cómo leer la tabla de latencia

Los números versionados están en el [README](../../../projects/transactions/orm-vs-sql/README.es.md#latencia-por-enfoque) y en `results/results.md`.

- Drizzle quedó entre 15 y 22% por encima del SQL puro, y Prisma entre 29 y 89% por encima, en esta ejecución.
- La diferencia absoluta es una fracción de milisegundo por consulta. Importa en una ruta caliente que se ejecuta miles de veces, y es irrelevante frente a un solo N+1 evitable.
- La base de datos es local, así que la consulta en sí es barata y el sobrecosto de la biblioteca es lo más visible posible. Sobre una red real la diferencia relativa se reduce.
- Es una máquina, un tamaño de datos (200 autores, unos 800 posts) y una versión de cada biblioteca. No es un ranking de herramientas.

El runner de benchmarks del repositorio (`bun run bench`, hyperfine) mide procesos completos sin red, así que no sirve para un benchmark que necesita una base de datos. Este mide dentro del proceso, con el calentamiento descartado, varias rondas y la dispersión informada, y registra la máquina, las versiones y el comando.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-TX-3.1 los tres enfoques devuelven filas idénticas | `tests/queries.test.ts`, "the same five queries in the three approaches" |
| MP-TX-3.2 SQL generado versionado junto a cada consulta | `tests/queries.test.ts`, "captured SQL", que escribe `ts/src/queries/*.captured.sql` |
| MP-TX-3.3 tabla de latencia, N+1 por encima de 100 sentencias, corrección con 2 | `docker compose run --rm bench` escribe las tablas. `tests/queries.test.ts`, "N+1", verifica 151 y 2 |

## Ejecución

```sh
cd projects/transactions/orm-vs-sql
./setup-unix-orm-vs-sql.sh        # o ./setup-windows-orm-vs-sql.ps1
docker compose run --rm bench && docker compose down -v
```
