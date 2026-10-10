# cache-strategies

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un caché es una segunda copia del dato, y toda la dificultad está en mantener las dos copias juntas. Este miniproyecto pone Redis delante de PostgreSQL, detrás de una API en ElysiaJS, y muestra dos cosas. Primero, cómo se comportan las tres estrategias clásicas en una escritura (cache-aside, write-through y write-behind), cada una con una prueba que dice qué garantiza y qué no garantiza. Segundo, el cache stampede (estampida de caché): 300 lectores de una clave popular envían cientos de consultas idénticas a la base de datos cada vez que la clave expira, y un bloqueo o una renovación anticipada lo reducen a una.

Código: MP-CACHE-1. Explicación completa: [docs/es/cache/cache-strategies.md](../../../docs/es/cache/cache-strategies.md).

## Resultados

Medido con k6 contra la API local. Generado por la prueba de carga. No lo edites a mano.

### Stampede: consultas a la base de datos por expiración

300 usuarios virtuales leen una clave caliente. La copia en caché vive 2 s y la consulta detrás de ella tarda 100 ms.

<!-- stampede:start -->
| Protección | Rondas | Expiraciones | Consultas a la base de datos | Consultas por expiración (mediana) | Consultas por expiración (rango) | Latencia p95, ms (media ± de) | Solicitud más lenta (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `none` | 3 | 9 | 2627 | **299** | 260 a 300 | 64 ± 51 | 1729 |
| `lock` | 3 | 15 | 15 | **1** | 1 | 107 ± 32 | 365 |
| `early` | 3 | 18 | 18 | **1** | 1 | 39 ± 23 | 289 |
<!-- stampede:end -->

Sin protección, cada expiración la paga toda la manada. Con `lock` o `early` se paga una vez. `early` además mantiene la latencia plana, porque nadie espera la recarga.

### Tasa de aciertos y latencia por estrategia y tiempo de vida

20 usuarios virtuales, 200 productos, 2% de escrituras. Cada lectura en la base de datos cuesta 5 ms más.

<!-- hit-rate:start -->
| Estrategia | Tiempo de vida | Rondas | Tasa de aciertos (media ± de) | Lectura, mediana (ms) | Lectura p95, ms (media ± de) | Escritura, mediana (ms) | Escritura p95 (ms) | Lecturas en la base de datos por 1000 solicitudes | Escrituras en la base de datos por 1000 solicitudes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cache-aside` | 250 ms | 3 | 59.2% ± 4.2 | 3.34 | 17.3 ± 10.7 | 23.12 | 493.4 | 403.2 | 20.3 |
| `cache-aside` | 1000 ms | 3 | 85.1% ± 1.7 | 1.40 | 9.9 ± 4.7 | 13.80 | 50.0 | 147.5 | 21.5 |
| `cache-aside` | 5000 ms | 3 | 95.2% ± 0.6 | 1.29 | 8.0 ± 7.0 | 43.64 | 442.2 | 47.7 | 19.7 |
| `write-through` | 250 ms | 3 | 62.9% ± 5.9 | 3.06 | 16.7 ± 16.6 | 19.19 | 60.4 | 360.7 | 21.4 |
| `write-through` | 1000 ms | 3 | 83.8% ± 3.2 | 3.46 | 20.9 ± 10.0 | 20.92 | 77.2 | 157.3 | 20.1 |
| `write-through` | 5000 ms | 3 | 96.7% ± 1.3 | 2.31 | 15.0 ± 9.2 | 48.52 | 236.9 | 30.1 | 21.5 |
| `write-behind` | 250 ms | 3 | 55.2% ± 2.3 | 8.02 | 36.6 ± 10.9 | 11.14 | 39.9 | 455.3 | 5.5 |
| `write-behind` | 1000 ms | 3 | 83.2% ± 3.8 | 3.25 | 27.5 ± 15.2 | 7.04 | 33.2 | 164.0 | 4.5 |
| `write-behind` | 5000 ms | 3 | 97.4% ± 0.8 | 1.71 | 9.8 ± 8.2 | 2.43 | 13.6 | 25.4 | 3.2 |
<!-- hit-rate:end -->

La máquina, las versiones y la definición de cada columna están en [results/results.md](results/results.md) (en inglés). Las ejecuciones son cortas y la máquina estaba compartida, así que las latencias tienen ruido. Los conteos de consultas de la tabla del stampede son la parte estable.

## Temas del quiz que demuestra

- `cache` / `caching-strategies`: quién escribe dónde y en qué orden en cache-aside, write-through y write-behind, y cuánto cuesta una escritura en cada uno
- `cache` / `consistency-trade-offs`: la lectura que vuelve a poblar el caché con un valor antiguo, la base de datos atrasada respecto al caché en write-behind, la escritura confirmada que se pierde
- `cache` / `stampede-penetration-avalanche`: el stampede, el bloqueo (`SET key token NX PX`) y la renovación anticipada
- `cache` / `invalidation-ttl`: el tiempo de vida como límite de la obsolescencia, y su efecto en la tasa de aciertos

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-cache-strategies.sh        # Linux y macOS
./setup-windows-cache-strategies.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas contra un contenedor de Redis y uno de PostgreSQL en una red interna, y elimina los contenedores al final.

## Prueba de carga (la demostración)

```sh
./load-test-unix.sh            # Linux y macOS
./load-test-windows.ps1        # Windows
```

Un comando, unos 6 minutos: levanta la API, ejecuta el experimento del stampede para `none`, `lock` y `early`, ejecuta el experimento de tasa de aciertos para 3 estrategias y 3 tiempos de vida, tres rondas de cada uno, y reescribe `results/` y las dos tablas de arriba. Falla cuando la ejecución sin protección no muestra al menos 100 consultas por expiración, o cuando una solución deja pasar más de 1. Pasa un número de rondas para cambiar el valor por defecto (`./load-test-unix.sh 1`, `.\load-test-windows.ps1 -Rounds 1`).

k6 solo apunta al servicio `api` de este compose: la red es interna, no se publica ningún puerto, y los dos scripts rechazan un `BASE_URL` que no sea local (`k6/guard.js`).

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v
```

El contenedor ejecuta la verificación de tipos de TypeScript y luego `bun test`, contra el Redis y el PostgreSQL de verdad.

| Estrategia | Garantía probada por una prueba | Límite probado por una prueba |
| --- | --- | --- |
| `cache-aside` | Después de que la escritura retorna, la copia en el caché desapareció y la siguiente lectura es fresca | Una lectura que corre junto con una escritura puede guardar el valor antiguo en el caché, y solo el tiempo de vida lo elimina |
| `write-through` | Cuando la escritura retorna, base de datos y caché tienen el valor nuevo, y la lectura siguiente es un acierto sin consulta. Una escritura que la base de datos rechaza nunca llega al caché | La copia en el caché sigue necesitando un tiempo de vida |
| `write-behind` | Los lectores del caché ven la escritura de inmediato. Muchas escrituras al mismo producto dentro de un intervalo se convierten en una escritura en la base de datos | La base de datos queda atrasada hasta el vaciado, y una escritura confirmada se pierde cuando el caché muere antes de él |

Las pruebas del stampede disparan 200 lecturas simultáneas dentro del proceso y verifican los mismos conteos de la prueba de carga: 200 consultas sin protección, 1 con el bloqueo, 1 con la renovación anticipada.

## API

| Ruta | Qué hace |
| --- | --- |
| `GET /products/:strategy/:id` | Lee un producto. `strategy` es `cache-aside`, `write-through` o `write-behind`. El encabezado `X-Cache` dice `hit` o `miss` |
| `PUT /products/:strategy/:id` | Cuerpo `{ "price": 1234 }` (centavos). Escribe con la estrategia elegida |
| `GET /hot/:mode` | Lee la clave caliente del experimento del stampede. `mode` es `none`, `lock` o `early` |
| `POST /admin/reset` | Vacía Redis, recrea los productos y aplica la configuración del siguiente experimento (`products`, `ttlMs`, `queryCostMs`, `slowQueryMs`, `earlyRefreshMs`) |
| `POST /admin/flush` | Ejecuta ahora el vaciado del write-behind |
| `POST /admin/counters/reset` | Pone en cero los contadores, para dejar un calentamiento fuera de la medición |
| `GET /stats` | Aciertos, fallos, lecturas y escrituras en la base de datos, y las consultas de cada expiración de la clave caliente |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/strategies.ts` | El camino de lectura común y las tres estrategias de escritura, con el vaciado del write-behind |
| `ts/src/stampede.ts` | La clave caliente: sin protección, bloqueo, renovación anticipada, y el conteo de consultas por expiración |
| `ts/src/cache.ts` | Los comandos de Redis usados, incluido el bloqueo y el script que lo libera |
| `ts/src/db.ts` | La tabla `products` y las consultas contadas |
| `ts/src/app.ts` | Las rutas en ElysiaJS, con validación en Zod |
| `ts/src/report.ts` | Agrega los resúmenes de k6 y verifica los criterios de aceptación |
| `k6/stampede.js`, `k6/hit-rate.js` | Las dos pruebas de carga. `k6/guard.js` rechaza destinos que no sean locales |
| `results/` | Las tablas de resultados versionadas |

No se importa nada de otro miniproyecto. La organización del compose, de los scripts y del reporte sigue `projects/transactions/overselling-checkout`, copiada y adaptada.

## Versiones

| Componente | Versión |
| --- | --- |
| Redis | `redis:8.10.2-alpine` |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2`, con el cliente Redis integrado |
| k6 | `grafana/k6:2.3.0` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
