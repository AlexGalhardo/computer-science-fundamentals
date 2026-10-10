# test-pyramid

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una tiendita (un catálogo, un carrito, 10% de descuento desde 100.00) probada en cada nivel de la pirámide de pruebas: unitaria, integración, extremo a extremo con Playwright, más una suite de humo y una suite de regresión. En cada nivel se siembra un bug a propósito, y una matriz muestra qué suite nota qué bug y cuánto cuesta cada suite. La lección: cada nivel ve algo que los otros no pueden, y el precio de una prueba crece a medida que sube.

Código: MP-TEST-1. Explicación completa: [docs/es/testing/test-pyramid.md](../../../docs/es/testing/test-pyramid.md).

## Temas del quiz que demuestra

- `testing` / `test-pyramid-levels`: qué verifica cada nivel, cuánto cuesta, por qué la base es ancha
- `testing` / `unit-tests-isolation`: un módulo puro probado solo, valores límite
- `testing` / `integration-tests`: handler HTTP, repositorio y un SQLite real juntos, una base de datos nueva por prueba
- `testing` / `e2e-playwright`: localizadores por rol, aserciones web-first, reinicio del estado antes de cada prueba
- `testing` / `smoke-regression`: comprobaciones superficiales sobre el servicio en ejecución, una prueba por cada reporte de bug pasado
- `testing` / `ci-test-strategy`: ejecutar primero las suites baratas

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-test-pyramid.sh        # Linux and macOS
./setup-windows-test-pyramid.ps1    # Windows
```

El script construye las imágenes, ejecuta la verificación de tipos, las cinco suites y la matriz de bugs, y elimina los contenedores al final.

## Las cinco suites, un comando cada una

```sh
docker compose run --rm unit           # bun test, pure functions
docker compose run --rm integration    # bun test, handler + repository + SQLite in memory
docker compose run --rm regression     # bun test, one test per past bug report
docker compose run --rm smoke          # bun test, against the running `shop` service
docker compose run --rm e2e            # Playwright (Chromium), against the running `shop` service
docker compose down -v --remove-orphans
```

`SEEDED_BUG=<name>` delante de cualquier comando planta un bug: `unit`, `integration`, `e2e`, `smoke` o `regression`. Para `smoke` y `e2e` el bug vive en el servicio `shop`, así que vuelve a crearlo: primero `docker compose down`.

## Demo: la matriz de bugs

```sh
docker compose run --rm matrix
```

Ejecuta las 5 suites contra el código correcto y contra cada uno de los 5 bugs sembrados (30 ejecuciones, cerca de un minuto), imprime la tabla y la escribe en [`results/bug-matrix.md`](results/bug-matrix.md). El comando falla si una suite no detecta el bug de su propio nivel.

| Bug sembrado | Dónde está | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- | --- |
| none | | pass | pass | pass | pass | pass |
| `unit` | `pricing.ts`: `>` en lugar de `>=` en el umbral del descuento | **FAIL** | pass | pass | pass | pass |
| `integration` | `cart-repository.ts`: el upsert SQL reemplaza la cantidad en lugar de sumar | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e` | `public/app.js`: la página no redibuja el carrito después de un clic | pass | pass | pass | pass | **FAIL** |
| `smoke` | `server.ts`: el servicio arranca sin ejecutar la migración | pass | pass | pass | **FAIL** | **FAIL** |
| `regression` | `pricing.ts`: se quita el redondeo que corrigió el reporte de bug #17 | pass | pass | **FAIL** | pass | pass |

Cómo leerlo:

- La suite de extremo a extremo atrapa tres de los cinco bugs, pero no detecta los dos que necesitan un valor preciso (exactamente 100.00, y 100.05). Cubrir cada valor a través de un navegador sería demasiado lento, por eso esos casos viven en la base.
- La suite unitaria no puede ver el SQL, el script del navegador ni la forma en que se inició el servicio.
- Cuando `integration` y `e2e` fallan ambas, la prueba de integración nombra el método del repositorio. La prueba de extremo a extremo solo dice que un texto no apareció en la pantalla.

## Cantidad y duración de cada suite

Medido por la matriz sobre el código correcto, dentro de Docker (Docker Desktop en Windows 11, AMD64, Bun 1.4.2, Playwright 1.63.0 con Chromium). La duración es la del comando completo, incluyendo el inicio del ejecutor de pruebas.

| Suite | Pruebas | Duración | Por prueba |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3.6 ms |
| integration | 8 | 61 ms | 7.6 ms |
| regression | 2 | 52 ms | 26.0 ms |
| smoke | 3 | 9 ms | 3.0 ms |
| e2e | 3 | 2070 ms | 690 ms |

Una prueba de extremo a extremo cuesta cerca de lo mismo que 200 pruebas unitarias, sin contar la imagen de Chromium (cerca de 2 GB contra cerca de 250 MB de la imagen de Bun) y un servicio en ejecución. Los números cambian de una ejecución a otra y de una máquina a otra. El orden de magnitud no.

## Estructura

```text
ts/src/pricing.ts            pure rules (unit level)
ts/src/cart-repository.ts    SQL on SQLite (integration level)
ts/src/app.ts                HTTP handler, input validated with Zod
ts/src/server.ts             starts the service (what smoke checks)
ts/public/                   the page and its script (what only e2e runs)
ts/src/seeded-bugs.ts        the SEEDED_BUG switch
ts/tests/{unit,integration,regression,smoke,e2e}/
ts/scripts/bug-matrix.ts     the demo
```

Dependencias, fijadas: `zod` 4.6.5, `@playwright/test` 1.63.0 (imagen `mcr.microsoft.com/playwright:v1.63.0-noble`), `typescript` 7.0.2, `@types/bun` 1.4.2, sobre `oven/bun:1.4.2`. La base de datos es el SQLite integrado en Bun.

## Seguridad

Ningún puerto se publica y la única red es `internal`. Las suites de humo y de extremo a extremo rechazan un `BASE_URL` que no sea `localhost`, `127.0.0.1` o el servicio compose `shop`.
