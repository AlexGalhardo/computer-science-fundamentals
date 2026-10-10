# mini-dbms

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un mini SGBD relacional lo bastante pequeño como para leerlo de una sola vez. Enseña cómo funcionan la **selección** y la **proyección** en una tabla en memoria, y cómo tres algoritmos responden al mismo join: **nested loop** (bucles anidados), **hash join** y **sort-merge join** (ordenamiento e intercalación). El mismo motor está escrito en Rust y en Python, cada respuesta se verifica contra SQLite, y un benchmark muestra a partir de qué tamaño de tabla el nested loop se queda atrás.

Explicación completa: [docs/es/databases/mini-dbms.md](../../../docs/es/databases/mini-dbms.md).

## Temas del quiz que demuestra

- `databases` / `relational-algebra`: selección, proyección (con y sin duplicados) y join natural.
- `databases` / `query-optimisation-and-indexes`: costo del join por bucles anidados, y qué algoritmo de join se aplica a qué condición.
- `databases` / `relational-calculus-and-sql`: una tabla SQL conserva las filas repetidas a menos que se escriba `DISTINCT`.

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-mini-dbms.sh        # Linux y macOS
./setup-windows-mini-dbms.ps1    # Windows
```

El script construye las dos imágenes fijadas y ejecuta, para cada lenguaje, la verificación del formateador, el linter y las pruebas.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `rust/src/table.rs`, `python/table.py` | tabla, selección, proyección |
| `rust/src/join.rs`, `python/joins.py` | join por bucles anidados, por hash y por ordenamiento e intercalación |
| `rust/src/workload.rs`, `python/workload.py` | las tablas del benchmark y el checksum, idénticos en los dos lenguajes |
| `rust/src/main.rs`, `python/bench.py` | puntos de entrada del benchmark (contrato de benchmark del repositorio) |
| `python/make_fixtures.py`, `fixtures/sqlite_cases.tsv` | consultas y las filas que SQLite devolvió para ellas |
| `python/demo.py` | un recorrido por los operadores en dos tablas diminutas |
| `bench.json`, `results/`, `dashboard/` | cuadrícula del benchmark, resultados versionados y dashboard estático |

El crate de Rust no tiene dependencias y el código de Python usa solo la biblioteca estándar (incluido `sqlite3`).

## Pruebas

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- Python compara la selección, la proyección y los tres joins con SQLite en tablas aleatorias.
- Rust no tiene SQLite en su biblioteca estándar, así que compara con `fixtures/sqlite_cases.tsv`, que fue escrito por SQLite. Una prueba en Python falla si ese archivo deja de coincidir con lo que SQLite responde.
- Los dos lenguajes verifican que los tres joins devuelvan las mismas filas en 200 tablas aleatorias.

Para regenerar el fixture después de cambiar las consultas (ejecútalo desde esta carpeta; en PowerShell de Windows usa `${PWD}` en lugar de `$PWD`):

```sh
docker compose run --rm -v "$PWD/fixtures:/app/fixtures" python-test python make_fixtures.py
```

## Demo

```sh
docker compose run --rm python-test python demo.py
```

## Benchmark

Desde la raíz del repositorio (necesita [Bun](https://bun.sh) en el equipo, y todo lo que se mide corre en Docker):

```sh
bun run bench -- --project projects/databases/mini-dbms
```

El comando reescribe `results/`. Abre `dashboard/index.html` para ver el gráfico, o lee [results/results.md](results/results.md). Resumen de la ejecución versionada (tramo medido, solo el join):

| n | nested loop (Rust) | hash (Rust) | sort-merge (Rust) | nested loop (Python) | hash (Python) | sort-merge (Python) |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1,000 | 4.24 ms | 0.25 ms | 0.20 ms | 44.8 ms | 0.42 ms | 1.10 ms |
| 10,000 | 332 ms | 3.05 ms | 2.63 ms | 4,113 ms | 23.9 ms | 25.4 ms |
| 100,000 | no se ejecutó | 53.9 ms | 107 ms | no se ejecutó | 112 ms | 307 ms |
| 1,000,000 | no se ejecutó | 983 ms | 1,597 ms | no se ejecutó | 2,161 ms | 2,652 ms |

**Dónde se queda atrás el nested loop:** de inmediato. Con 10 veces más filas tarda entre 80 y 90 veces más (cuadrático), mientras que los otros dos crecen de forma casi lineal (de 10 a 25 veces por paso en la mayoría de las filas; una fila de Python tiene más ruido, porque el equipo estaba compartido). Con 10,000 filas el nested loop en Rust ya es 100 veces más lento que el hash join en Rust.

**Límite, dicho con honestidad:** el nested loop se mide solo hasta 10,000 filas (`maxN` en `bench.json`). Una única ejecución manual en Rust con 100,000 filas tardó 27.4 s, y 1,000,000 de filas tardaría unas 100 veces más, alrededor de 45 minutos por ejecución. El equipo se comparte con otros contenedores, así que esos tamaños se dejaron fuera. Hash y sort-merge recorren todo el rango, de 10^3 a 10^6.

## Límites

Sin NULLs, sin índices, sin lenguaje de consulta y sin almacenamiento en disco: las tablas son listas de filas en memoria, y los joins son por igualdad en una columna. Son recortes deliberados para mantener los tres algoritmos a la vista.
