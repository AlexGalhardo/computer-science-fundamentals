# isolation-levels

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Qué anomalía permite cada nivel de aislamiento? Este mini-proyecto responde con un experimento. Un arnés de dos sesiones conduce dos transacciones contra un PostgreSQL local en un orden fijo y registrado, reproduce cinco anomalías (lectura sucia, lectura no repetible, fantasma, actualización perdida, write skew) en cada uno de los cuatro niveles de aislamiento y escribe la matriz de resultados que aparece abajo.

Código: MP-TX-1. Explicación completa: [docs/es/transactions/isolation-levels.md](../../../docs/es/transactions/isolation-levels.md).

## Matriz de resultados

Generada por las pruebas. No la edites a mano: `docker compose run --rm ts-test` reescribe todo lo que está entre los marcadores.

<!-- matrix:start -->
| Anomalía | READ UNCOMMITTED | READ COMMITTED | REPEATABLE READ | SERIALIZABLE |
| --- | --- | --- | --- | --- |
| Lectura sucia | evitada | evitada | evitada | evitada |
| Lectura no repetible | **ocurre** | **ocurre** | evitada | evitada |
| Lectura fantasma | **ocurre** | **ocurre** | evitada | evitada |
| Actualización perdida | **ocurre** | **ocurre** | evitada (error 40001) | evitada (error 40001) |
| Write skew | **ocurre** | **ocurre** | **ocurre** | evitada (error 40001) |
<!-- matrix:end -->

Cómo leerla:

- **ocurre**: la anomalía se observó en ese nivel.
- **evitada**: la transacción siguió leyendo su propio snapshot, sin error.
- **evitada (error 40001)**: PostgreSQL abortó una transacción con un fallo de serialización, y la aplicación debe ejecutarla de nuevo.

Esto es PostgreSQL, no el estándar SQL. El estándar permite lecturas sucias en `READ UNCOMMITTED` y fantasmas en `REPEATABLE READ`. PostgreSQL trata `READ UNCOMMITTED` como `READ COMMITTED`, así que **no tiene ningún nivel que muestre una lectura sucia**, y su `REPEATABLE READ` es snapshot isolation, que no muestra fantasmas pero sigue permitiendo write skew.

El registro de marcas de tiempo de cada intercalación está en [results/timeline.md](results/timeline.md).

## Temas del quiz que demuestra

- `transactions` / `isolation-levels-anomalies`: las cinco anomalías y el nivel que detiene a cada una
- `transactions` / `mvcc`: los snapshots, y por qué un lector nunca bloquea a un escritor
- `transactions` / `locking`: el bloqueo de fila que hace esperar al segundo escritor
- `transactions` / `acid-properties`: lo que la I de ACID promete y lo que no

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-isolation-levels.sh        # Linux y macOS
./setup-windows-isolation-levels.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas contra un contenedor de PostgreSQL en una red interna y elimina los contenedores al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Imprime la matriz y, para cada anomalía, el registro paso a paso con marcas de tiempo en el nivel donde ocurre y en el nivel donde se detiene.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v
```

El contenedor ejecuta la verificación de tipos de TypeScript y luego `bun test`. Las pruebas demuestran que los pasos se ejecutaron en el orden planeado (a partir de las marcas de tiempo), que cada anomalía ocurre en el nivel más fuerte que la permite y se evita en el siguiente, y regeneran `results/` y la matriz de arriba.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/harness.ts` | El arnés de dos sesiones: orden fijo, detección de espera de bloqueo, registro de marcas de tiempo |
| `ts/src/anomalies.ts` | Las cinco anomalías como guiones de pasos |
| `ts/src/matrix.ts` | Ejecuta anomalía contra nivel, genera la matriz y las líneas de tiempo |
| `ts/src/demo.ts` | La demo en CLI |
| `ts/tests/` | Pruebas del arnés y de la matriz |
| `results/` | Matriz y registro de marcas de tiempo de la última ejecución |

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
