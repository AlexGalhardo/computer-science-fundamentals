# overselling-checkout

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un producto tiene 10 unidades y 200 personas hacen clic en "comprar" en el mismo instante. Un checkout escrito como "leer el stock, verificarlo, escribirlo" vende mucho más que 10, incluso dentro de una transacción. Este mini-proyecto reproduce el bug con una prueba de carga local de k6 contra una API ElysiaJS sobre PostgreSQL, y luego lo corrige de tres maneras: una columna de versión optimista, `SELECT ... FOR UPDATE` y `SERIALIZABLE` con reintento.

Código: MP-TX-2. Explicación completa: [docs/es/transactions/overselling-checkout.md](../../../docs/es/transactions/overselling-checkout.md).

## Resultados

200 compradores concurrentes, 10 unidades, medido con k6. Generado por la prueba de carga. No lo edites a mano.

<!-- results:start -->
| Estrategia | Rondas | Pedidos creados | Solicitudes/s (media ± ds) | Rechazadas: agotado (media) | Rechazadas: desistió tras conflictos (media) | Proporción rechazada | Latencia p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `naive` | 3 | **150 a 180** | 252 ± 76 | 35.0 | 0.0 | 17.5% | 767 |
| `optimistic` | 3 | 10 | 445 ± 72 | 190.0 | 0.0 | 95.0% | 417 |
| `pessimistic` | 3 | 10 | 260 ± 36 | 190.0 | 0.0 | 95.0% | 694 |
| `serializable` | 3 | 10 | 821 ± 67 | 190.0 | 0.0 | 95.0% | 229 |
<!-- results:end -->

`naive` crea más pedidos que unidades existen. Cada corrección crea exactamente 10. La máquina, las versiones y la definición de cada columna están en [results/results.md](results/results.md).

## Temas del quiz que demuestra

- `transactions` / `locking`: bloqueo optimista contra pesimista, `SELECT ... FOR UPDATE`, qué bloquea un bloqueo de fila
- `transactions` / `isolation-levels-anomalies`: la actualización perdida en `READ COMMITTED`, y `SERIALIZABLE` con reintento ante SQLSTATE `40001`
- `transactions` / `acid-properties`: una transacción da atomicidad, que no es aislamiento
- `transactions` / `mvcc`: los lectores no son bloqueados por los escritores, que es exactamente por lo que la lectura ingenua queda desactualizada

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-overselling-checkout.sh        # Linux y macOS
./setup-windows-overselling-checkout.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas contra un contenedor de PostgreSQL en una red interna y elimina los contenedores al final.

## Prueba de carga (la demo)

```sh
./load-test-unix.sh            # Linux y macOS
./load-test-windows.ps1        # Windows
```

Un solo comando: inicia la API, ejecuta k6 tres veces por estrategia (200 usuarios virtuales, una compra cada uno), verifica que `naive` vendió de más y que cada corrección vendió exactamente 10, y reescribe `results/` y la tabla de arriba. Falla cuando alguna de estas verificaciones falla.

k6 solo apunta al servicio `api` de este archivo compose: la red es interna, no se publica ningún puerto, y el script rechaza un `BASE_URL` que no sea local.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v
```

El contenedor ejecuta la verificación de tipos de TypeScript y luego `bun test`. Las pruebas disparan las mismas 200 compras concurrentes dentro del proceso y verifican el mismo resultado que la prueba de carga.

## API

| Ruta | Qué hace |
| --- | --- |
| `POST /checkout/:strategy` | Compra una unidad. `strategy` es `naive`, `optimistic`, `pessimistic` o `serializable`. Cuerpo: `{ "buyerId": "..." }`. Responde `201` vendido, `409` agotado, `503` desistió tras demasiados conflictos |
| `POST /admin/reset` | Cuerpo `{ "stock": 10 }`. Elimina los pedidos y fija el stock |
| `GET /stats` | `{ "stock": ..., "orders": ... }` |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/checkout.ts` | Las cuatro estrategias y el bucle de reintentos |
| `ts/src/app.ts` | Las rutas de ElysiaJS, con validación Zod |
| `ts/src/db.ts` | Schema, reinicio y estadísticas |
| `ts/src/report.ts` | Agrega los resúmenes de k6 y verifica los criterios de aceptación |
| `k6/checkout.js` | La prueba de carga |
| `results/` | La tabla de resultados versionada |

## Versiones

| Componente | Versión |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| k6 | `grafana/k6:2.3.0` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
