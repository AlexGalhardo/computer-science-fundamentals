# Niveles de aislamiento en PostgreSQL (MP-TX-1)

> English version: [docs/en/transactions/isolation-levels.md](../../en/transactions/isolation-levels.md) · Versão em português: [docs/pt/transactions/isolation-levels.md](../../pt/transactions/isolation-levels.md)

Mini-proyecto: [`projects/transactions/isolation-levels`](../../../projects/transactions/isolation-levels/README.es.md). Temas del quiz: `isolation-levels-anomalies`, `mvcc`, `locking`, `acid-properties`.

## La pregunta

El aislamiento es la I de ACID: las transacciones concurrentes no deberían pisarse entre sí. El aislamiento total es caro, así que las bases de datos ofrecen niveles, y cada nivel deja pasar algunas anomalías. La tabla habitual de nivel contra anomalía se memoriza y rara vez se prueba. Este mini-proyecto la prueba.

## Las cinco anomalías

| Anomalía | Qué sale mal |
| --- | --- |
| Lectura sucia | B lee un valor que A escribió y no confirmó. Si A hace rollback, B usó datos que nunca existieron |
| Lectura no repetible | A lee la misma fila dos veces y obtiene dos valores, porque B confirmó una actualización en medio |
| Fantasma | A ejecuta la misma búsqueda dos veces y aparece una fila nueva, insertada y confirmada por B |
| Actualización perdida | A y B leen el mismo valor, cada uno calcula uno nuevo en la aplicación y lo escribe. La última escritura borra la otra |
| Write skew | A y B verifican la misma regla y luego escriben filas **distintas**. Cada escritura está bien por separado, juntas rompen la regla |

## Estándar contra PostgreSQL

El estándar SQL define los niveles por los tres fenómenos que prohíbe:

| Nivel (estándar SQL) | Lectura sucia | Lectura no repetible | Fantasma |
| --- | --- | --- | --- |
| READ UNCOMMITTED | posible | posible | posible |
| READ COMMITTED | no posible | posible | posible |
| REPEATABLE READ | no posible | no posible | posible |
| SERIALIZABLE | no posible | no posible | no posible |

"Posible" es un permiso, no una obligación, y PostgreSQL es más estricto que el estándar:

- `READ UNCOMMITTED` se comporta como `READ COMMITTED`. No hay ningún nivel que muestre una lectura sucia.
- `REPEATABLE READ` es snapshot isolation: la transacción ve la base de datos como estaba en su primera sentencia, así que tampoco aparecen fantasmas.
- `SERIALIZABLE` es serializable snapshot isolation (SSI): el snapshot, más el seguimiento de las dependencias de lectura/escritura entre transacciones.

La tabla del estándar no dice nada sobre la actualización perdida ni el write skew. La matriz medida, generada por las pruebas, está en el [README](../../../projects/transactions/isolation-levels/README.es.md#matriz-de-resultados).

## Qué enseña la matriz

- **READ COMMITTED** (el valor por defecto de PostgreSQL) toma un snapshot nuevo para cada sentencia. Dos sentencias de la misma transacción pueden ver datos diferentes: ocurren lecturas no repetibles, fantasmas y actualizaciones perdidas.
- **REPEATABLE READ** mantiene un solo snapshot durante toda la transacción. Las lecturas son estables. Una escritura sobre una fila que cambió después del snapshot falla con SQLSTATE `40001` ("could not serialize access due to concurrent update"), que es lo que detiene la actualización perdida. El write skew pasa, porque las dos transacciones escriben filas distintas.
- **SERIALIZABLE** además detecta el patrón peligroso "cada una leyó lo que la otra escribió" y aborta una de ellas con `40001`. Es el único nivel que detiene el write skew.

En la matriz aparecen dos formas de evitar una anomalía: en silencio (el snapshot oculta el cambio) o con un error. Un error `40001` no es un bug. Es el contrato de estos niveles: **la aplicación debe reintentar la transacción**.

## Cómo funciona el arnés

Una carrera normalmente es cuestión de sincronización. El arnés elimina la sincronización:

1. Se abren tres conexiones: las sesiones A y B, y un observador fuera de ambas transacciones.
2. Un escenario es una lista de pasos. Cada paso nombra su sesión. El arnés envía un paso y espera a que termine antes de enviar el siguiente.
3. Algunos pasos no pueden terminar: un `UPDATE` sobre una fila bloqueada por la otra sesión espera. El arnés no adivina con un sleep. El observador lee `pg_stat_activity` hasta que el servidor informa `wait_event_type = 'Lock'` para esa sesión, registra el momento y pasa al paso que libera el bloqueo.
4. Cada paso se registra con una hora de reloj y tiempos monotónicos de inicio, bloqueo y fin. Las pruebas verifican que cada paso empezó después de que el anterior terminó o fue confirmado como bloqueado.

El registro de la última ejecución está en `results/timeline.md`.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-TX-1.1 orden fijo, demostrado por un registro de marcas de tiempo | `tests/harness.test.ts`, y `results/timeline.md` |
| MP-TX-1.2 cada anomalía reproducida en el nivel más débil que la permite y bloqueada en el siguiente | `tests/matrix.test.ts`, "each anomaly is reproduced at the strongest level that allows it and blocked at the next" |
| MP-TX-1.3 matriz del README generada por las pruebas | `tests/matrix.test.ts`, "result matrix" |

Una parte de MP-TX-1.2 no se puede cumplir en PostgreSQL: una lectura sucia no se puede reproducir en ningún nivel. La prueba demuestra lo contrario, que `READ UNCOMMITTED` no muestra datos no confirmados.

## Ejecución

```sh
cd projects/transactions/isolation-levels
./setup-unix-isolation-levels.sh        # o ./setup-windows-isolation-levels.ps1
docker compose run --rm demo && docker compose down -v
```
