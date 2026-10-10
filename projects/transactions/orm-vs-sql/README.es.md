# orm-vs-sql

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cuánto cuesta un ORM y qué SQL envía realmente? Este mini-proyecto escribe las mismas cinco consultas tres veces, con SQL puro (node-postgres), Prisma y Drizzle, sobre un único esquema de PostgreSQL. Las pruebas demuestran que las tres devuelven filas idénticas, capturan el SQL que genera cada una y lo versionan junto a la consulta, y un benchmark mide la latencia de cada enfoque y el costo del patrón N+1.

Código: MP-TX-3. Explicación completa: [docs/es/transactions/orm-vs-sql.md](../../../docs/es/transactions/orm-vs-sql.md).

## Las cinco consultas

| Consulta | Qué ejercita | Código | SQL capturado |
| --- | --- | --- | --- |
| `author-by-id` | Búsqueda por clave primaria | [ts](ts/src/queries/author-by-id.ts) | [sql](ts/src/queries/author-by-id.captured.sql) |
| `top-posts` | Filtrar, ordenar, limitar | [ts](ts/src/queries/top-posts.ts) | [sql](ts/src/queries/top-posts.captured.sql) |
| `posts-with-author` | Join | [ts](ts/src/queries/posts-with-author.ts) | [sql](ts/src/queries/posts-with-author.captured.sql) |
| `post-count-by-author` | Agregación con `GROUP BY` | [ts](ts/src/queries/post-count-by-author.ts) | [sql](ts/src/queries/post-count-by-author.captured.sql) |
| `add-post-with-comment` | Transacción con dos inserts | [ts](ts/src/queries/add-post-with-comment.ts) | [sql](ts/src/queries/add-post-with-comment.captured.sql) |

El ejemplo de N+1 y su corrección están en [n-plus-one.ts](ts/src/queries/n-plus-one.ts), con el SQL capturado de la versión [ingenua](ts/src/queries/n-plus-one-naive.captured.sql) y de la [corregida](ts/src/queries/n-plus-one-fixed.captured.sql).

## Latencia por enfoque

Generada por el benchmark. No la edites a mano.

<!-- latency:start -->
| Consulta | Enfoque | Media (ms) | ± entre rondas | p50 (ms) | p95 (ms) | Veces el SQL puro |
| --- | --- | --- | --- | --- | --- | --- |
| `author-by-id` | raw | 0.307 | 0.018 | 0.292 | 0.373 | 1.00x |
| `author-by-id` | prisma | 0.426 | 0.032 | 0.405 | 0.528 | 1.39x |
| `author-by-id` | drizzle | 0.365 | 0.017 | 0.346 | 0.445 | 1.19x |
| `top-posts` | raw | 0.352 | 0.026 | 0.325 | 0.449 | 1.00x |
| `top-posts` | prisma | 0.453 | 0.028 | 0.421 | 0.573 | 1.29x |
| `top-posts` | drizzle | 0.426 | 0.028 | 0.393 | 0.545 | 1.21x |
| `posts-with-author` | raw | 0.586 | 0.061 | 0.550 | 0.804 | 1.00x |
| `posts-with-author` | prisma | 1.107 | 0.083 | 1.049 | 1.431 | 1.89x |
| `posts-with-author` | drizzle | 0.712 | 0.053 | 0.660 | 0.956 | 1.22x |
| `post-count-by-author` | raw | 0.867 | 0.095 | 0.780 | 1.187 | 1.00x |
| `post-count-by-author` | prisma | 1.225 | 0.129 | 1.097 | 1.665 | 1.41x |
| `post-count-by-author` | drizzle | 1.001 | 0.104 | 0.909 | 1.347 | 1.15x |
<!-- latency:end -->

## N+1 y su corrección

Listado de 150 autores con sus posts. Generada por el benchmark.

<!-- n-plus-one:start -->
| Enfoque | Sentencias, N+1 | Sentencias, corrección | Tiempo, N+1 (ms) | Tiempo, corrección (ms) | Mejora |
| --- | --- | --- | --- | --- | --- |
| raw | 151 | 2 | 51.8 | 1.6 | 32.8x |
| prisma | 151 | 2 | 67.3 | 2.8 | 24.5x |
| drizzle | 151 | 2 | 49.5 | 1.7 | 28.8x |
<!-- n-plus-one:end -->

La máquina, las versiones y el método están en [results/results.md](results/results.md).

## Temas del quiz que demuestra

- `transactions` / `acid-properties`: la atomicidad de una transacción con varias sentencias, y por qué toda sentencia debe pasar por el manejador de la transacción (`tx`)

Las demás lecciones de este mini-proyecto (SQL generado, N+1, costo de una abstracción) pertenecen a las áreas `databases` y `performance` del quiz.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-orm-vs-sql.sh        # Linux y macOS
./setup-windows-orm-vs-sql.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas contra un contenedor de PostgreSQL en una red interna y elimina los contenedores al final. Las pruebas reescriben los archivos `*.captured.sql`.

## Benchmark (la demo)

```sh
docker compose run --rm bench
docker compose down -v
```

Reescribe `results/` y las dos tablas de arriba.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v
```

El contenedor ejecuta la verificación de tipos de TypeScript y luego `bun test`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/sql/schema.sql` | El esquema y los datos de ejemplo, compartidos por los tres enfoques |
| `ts/prisma/schema.prisma`, `ts/src/drizzle-schema.ts` | Cómo Prisma y Drizzle describen las mismas tablas |
| `ts/src/context.ts` | Los tres clientes, cada uno con un registrador del SQL que envía |
| `ts/src/queries/` | Un archivo por consulta con las tres implementaciones, y el SQL capturado junto a él |
| `ts/src/bench.ts` | El benchmark |
| `results/` | Los resultados versionados |

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| pg (node-postgres) | 8.23.1 |
| Prisma (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) | 7.10.0 |
| Drizzle ORM | 0.45.3 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
