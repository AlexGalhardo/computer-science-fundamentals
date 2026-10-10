# Sobreventa en el checkout (MP-TX-2)

> English version: [docs/en/transactions/overselling-checkout.md](../../en/transactions/overselling-checkout.md) · Versão em português: [docs/pt/transactions/overselling-checkout.md](../../pt/transactions/overselling-checkout.md)

Mini-proyecto: [`projects/transactions/overselling-checkout`](../../../projects/transactions/overselling-checkout/README.es.md). Temas del quiz: `locking`, `isolation-levels-anomalies`, `acid-properties`, `mvcc`.

## El bug

```text
buyer A: SELECT stock  -> 10
buyer B: SELECT stock  -> 10      (A has not written yet)
buyer A: UPDATE stock = 9, INSERT order
buyer B: UPDATE stock = 9, INSERT order     <- two orders, one unit gone
```

Esto es una **actualización perdida** causada por una lectura, una decisión en la aplicación y una escritura basada en la lectura vieja. Envolverlo en `BEGIN ... COMMIT` no ayuda: en `READ COMMITTED`, el valor por defecto de PostgreSQL, un `SELECT` simple no toma ningún bloqueo de fila y cada transacción es libre de leer el mismo stock. Una transacción da atomicidad (la actualización del stock y el pedido van juntos), que es una promesa distinta del aislamiento.

La columna de stock nunca queda negativa, porque cada comprador escribe un valor absoluto. El daño solo se ve en la tabla `orders`, y por eso este bug sobrevive a una mirada rápida al producto.

## Tres correcciones

| Corrección | Idea | Qué paga el comprador |
| --- | --- | --- |
| Optimista, columna de versión | Lee `stock` y `version`. Escribe con `WHERE version = <la que leí>`. Cero filas actualizadas significa que otro ganó: lee de nuevo y reintenta | Trabajo desperdiciado y reintentos cuando muchos compiten por la misma fila |
| Pesimista, `SELECT ... FOR UPDATE` | Bloquea la fila en la lectura. El siguiente comprador espera en su propio `SELECT` y luego ve el stock nuevo | Esperar en la fila. El bloqueo se mantiene mientras la aplicación piensa |
| `SERIALIZABLE` con reintento | El mismo código del bug, un nivel de aislamiento más fuerte. PostgreSQL aborta con SQLSTATE `40001` las transacciones que no habrían podido ejecutarse una después de la otra | La aplicación debe capturar `40001` y ejecutar de nuevo toda la transacción |

Todos los reintentos usan una pausa aleatoria corta (jitter), para que los perdedores no vuelvan en el mismo instante, y se detienen tras un número máximo de intentos con un `503` honesto.

Una sola sentencia SQL, `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`, también corrige este caso particular, porque la verificación y la escritura ocurren dentro de la base de datos sobre la fila actual. El mini-proyecto mantiene la lectura y la escritura separadas a propósito: los checkouts reales hacen trabajo entre ellas (precios, cupones, pago), y ahí es donde se necesitan las tres correcciones de arriba.

## Resultados

La tabla versionada está en el [README](../../../projects/transactions/overselling-checkout/README.es.md#resultados) y en `results/results.md`, con la máquina y las versiones. En la ejecución medida, `naive` creó de 150 a 180 pedidos para 10 unidades, y cada corrección creó exactamente 10 en todas las rondas.

Cómo leer la columna de rendimiento sin engañarte:

- Solo 10 de las 200 peticiones pueden tener éxito. Cuando el stock llega a cero, los compradores restantes solo leen y reciben `409`, y la rapidez con que eso ocurre domina el número.
- `pessimistic` es la más lenta porque los 200 compradores esperan en la misma fila, incluidos los 190 que solo encontrarán el producto agotado.
- `serializable` y `optimistic` no hacen fila para leer, así que las respuestas de agotado vuelven rápido. Su costo son los reintentos de los perdedores, que crece con el número de unidades realmente disputadas.
- La dispersión entre rondas es grande (ver la columna ±). Una diferencia menor que ella no es un resultado.

La carga de trabajo es una fila caliente. Con muchos productos y poca contención, el panorama cambia: el control optimista casi nunca reintenta, y casi nunca se espera por los bloqueos pesimistas.

## Reglas de la prueba de carga

k6 se ejecuta desde la imagen fijada `grafana/k6:2.3.0` en la red interna de docker-compose. No se publica ningún puerto, el objetivo por defecto es el servicio `api`, y el script lanza un error antes de enviar nada cuando `BASE_URL` no es `localhost`, `127.0.0.1` ni `api`. La salida cruda de k6 va a `k6-results/`, que git ignora.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-TX-2.1 el checkout ingenuo vende más de 10 con 200 compradores concurrentes | `./load-test-unix.sh` (o `.ps1`): el paso de informe falla a menos que toda ronda de `naive` haya vendido de más. También `tests/checkout.test.ts` |
| MP-TX-2.2 cada corrección vende exactamente 10 | El mismo comando: el paso de informe falla a menos que toda ronda de cada corrección termine con 10 pedidos y stock 0. También `tests/checkout.test.ts` |
| MP-TX-2.3 tabla con solicitudes por segundo y solicitudes rechazadas | `results/results.md`, escrito por el paso de informe |

## Ejecución

```sh
cd projects/transactions/overselling-checkout
./setup-unix-overselling-checkout.sh     # pruebas
./load-test-unix.sh                      # k6 y la tabla de resultados
```
