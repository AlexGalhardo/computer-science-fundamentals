# Estrategias de caché y stampede (MP-CACHE-1)

> English version: [docs/en/cache/cache-strategies.md](../../en/cache/cache-strategies.md) · Versão em português: [docs/pt/cache/cache-strategies.md](../../pt/cache/cache-strategies.md)

Miniproyecto: [`projects/cache/cache-strategies`](../../../projects/cache/cache-strategies/README.es.md). Temas del quiz: `caching-strategies`, `consistency-trade-offs`, `stampede-penetration-avalanche`, `invalidation-ttl`.

## El problema

Un caché es una segunda copia de un dato cuyo original vive en un lugar más lento, aquí Redis delante de PostgreSQL. Leer la copia es rápido. Lo difícil es que ahora hay dos lugares que cambiar en cada escritura, y ninguna transacción cubre a los dos: PostgreSQL puede confirmar y Redis fallar, o al revés, y dos solicitudes pueden llegar a los dos sistemas en órdenes distintos.

Toda estrategia de caché es una respuesta a una pregunta: **en una escritura, ¿quién se modifica, en qué orden, y cuándo se le dice al cliente "listo"?**

## El camino de lectura común

Las tres estrategias del miniproyecto leen de la misma manera, llamada carga diferida (lazy loading):

```text
valor = GET product:7              acierto -> responde
                                   fallo   -> SELECT en PostgreSQL
                                              SET product:7 valor PX <tiempo de vida>
                                              responde
```

El tiempo de vida no es una optimización. Es la red de seguridad: el límite de cuánto tiempo puede sobrevivir una copia equivocada, sin importar qué salió mal.

## Tres formas de escribir

| Estrategia | Qué hace la escritura | El cliente oye "listo" después de | Qué garantiza | Qué no garantiza |
| --- | --- | --- | --- | --- |
| Cache-aside | `UPDATE` en la base de datos, luego `DEL` de la clave | base de datos y eliminación | La siguiente lectura carga el valor nuevo | Una lectura que ya estaba en curso puede volver a poner el valor antiguo |
| Write-through | `UPDATE` en la base de datos, luego `SET` de la clave | base de datos y caché | La siguiente lectura es un acierto y está fresca | Dos escritores concurrentes pueden dejar el caché con el valor más antiguo; no hay atomicidad entre los dos almacenes |
| Write-behind | `SET` de la clave y una entrada en una cola de pendientes; la base de datos después, en lotes | solo el caché | La escritura más barata, y muchas escrituras a una clave se convierten en una escritura en la base de datos | Durabilidad: lo que se confirmó y aún no se vació se pierde si Redis pierde su memoria |

### Cache-aside: por qué eliminar, y la carrera que queda

La escritura elimina la clave en lugar de guardar el valor nuevo. Dos escritores que guardan pueden llegar a Redis en el orden opuesto al de sus commits y dejar allí el valor más antiguo. Una eliminación no lleva valor, así que no puede estar equivocada: el siguiente lector obtiene la verdad.

Queda una carrera, y las pruebas la reproducen paso a paso:

```text
lector:   GET  -> fallo
lector:   SELECT -> precio antiguo
escritor: UPDATE precio nuevo (commit)
escritor: DEL clave            (aún no hay nada que eliminar)
lector:   SET clave = precio antiguo  <- obsoleto hasta que termine el tiempo de vida
```

Requiere una lectura más lenta que una escritura completa, así que es rara, y es la razón por la que una entrada de cache-aside siempre tiene tiempo de vida.

### Write-through

La base de datos va primero. Si rechaza la escritura, el caché ni siquiera se toca (hay una prueba para eso). Si la base de datos confirma y el `SET` falla, el caché conserva el valor antiguo hasta que termine el tiempo de vida: los dos pasos no son atómicos. El precio lo paga el escritor, que espera dos viajes de ida y vuelta.

Write-through también guarda en el caché datos que quizá nunca se lean. Por eso sus entradas también llevan tiempo de vida.

### Write-behind

La escritura va a la clave del caché y a un hash de escrituras pendientes en Redis, un campo por producto, y se responde al cliente. Un temporizador (200 ms en el miniproyecto) renombra el hash de forma atómica, envía todo a PostgreSQL en un solo `UPDATE`, y lo elimina. Diez escrituras al mismo producto dentro de un intervalo son una fila de ese lote.

Dos consecuencias, cada una con una prueba:

- Hasta el vaciado, la base de datos está **atrás** del caché. Todo lo que lee PostgreSQL directamente (un reporte, otro servicio) ve el valor antiguo. Un fallo de caché debe mirar la cola de pendientes antes que la base de datos, o volvería a guardar el valor antiguo.
- Si Redis pierde su memoria antes del vaciado, al cliente se le dijo "guardado" y la escritura desapareció. Write-behind sirve para datos en los que esa pérdida es aceptable (contadores, marcas de última vez visto), o necesita una cola durable en lugar de un caché.

## El cache stampede

Una clave popular expira. Hasta que alguien guarda una copia nueva, toda solicitud ve un fallo, y cada una ejecuta la misma consulta costosa. En el experimento la consulta tarda 100 ms y 300 usuarios leen la clave, así que los 300 llegan dentro del intervalo. El pool de conexiones tiene 20 conexiones, las consultas hacen cola por ellas, y el lector más lento espera más de un segundo por un valor que una sola consulta habría producido.

Se implementan dos soluciones.

**Bloqueo (single flight entre instancias).** En un fallo, la solicitud intenta `SET lock token NX PX 10000`. Solo un llamador recibe `OK`: consulta la base de datos, guarda el valor y libera el bloqueo. Los demás esperan unos milisegundos y vuelven a leer el caché. Tres detalles importan:

- El bloqueo tiene vencimiento (`PX`), así que un titular que se cae no bloquea a todos para siempre.
- Liberar es "elimina solo si el token sigue siendo mío", hecho en un script Lua para que la comparación y la eliminación sean un solo paso atómico. Un `DEL` simple podría quitar un bloqueo que expiró y ahora pertenece a otro.
- Después de ganar el bloqueo, se vuelve a verificar el caché. Una solicitud lenta puede ganar el bloqueo justo después de que el ganador anterior guardó el valor.

**Renovación anticipada.** El valor en caché lleva un instante de "renovar después de" que llega antes del vencimiento real. La primera solicitud que lee el valor después de ese instante toma el bloqueo y lo recarga en segundo plano, y todas las solicitudes, incluida esa, siguen recibiendo la copia aún válida. La clave nunca llega a expirar mientras está en uso, así que nadie espera. Un caché frío no tiene qué servir, y solo ese caso recurre al bloqueo.

Una variante conocida es la expiración anticipada probabilística: cada solicitud decide al azar renovar antes, con una probabilidad que crece a medida que se acerca el vencimiento, lo que no necesita bloqueo. El miniproyecto usa una ventana fija más el bloqueo porque da exactamente una consulta por renovación, que es lo que cuenta el experimento.

Un tiempo de vida mayor no corrige el stampede. Lo hace más raro y los datos más viejos, y cada expiración sigue pagándola toda la manada.

## Resultados

Las tablas versionadas están en el [README](../../../projects/cache/cache-strategies/README.es.md#resultados) y en `results/results.md`, con la máquina y las versiones.

**Stampede.** Sin protección, la expiración mediana costó 299 consultas a la base de datos, casi una por lector (la ráfaga más pequeña fue de 260, la mayor de 300). Con el bloqueo y con la renovación anticipada cada expiración costó exactamente 1. La solicitud más lenta de las ejecuciones sin protección tardó más de un segundo; con la renovación anticipada la latencia se mantiene plana porque nadie espera la recarga.

Cómo se cuentan las "consultas por expiración": la API cuenta las consultas que cargan la clave caliente. Una consulta que empieza cuando ninguna otra carga de esa clave está en curso abre una nueva expiración, y las que empiezan mientras hay una en curso pertenecen a la misma expiración. El arranque en frío cuenta como la primera expiración.

**Tasa de aciertos y latencia.** Cómo leer la segunda tabla sin engañarse:

- La tasa de aciertos crece con el tiempo de vida en todas las estrategias, porque menos lecturas encuentran la clave expirada. El precio es la obsolescencia, que esta tabla no muestra.
- Con un tiempo de vida de 5 s y una medición de 5 s, casi nada expira dentro de la ejecución. Esa fila muestra el techo: lo que queda son los fallos causados por escrituras (cache-aside elimina la clave) y por productos leídos por primera vez.
- Write-through y write-behind deberían acertar un poco más que cache-aside, porque una escritura deja el valor nuevo en el caché en lugar de quitarlo. Con 2% de escrituras la diferencia esperada es de unos dos puntos porcentuales, menor que la dispersión entre las rondas de la ejecución versionada, así que la tabla no la muestra de forma confiable.
- La latencia de escritura es donde más difieren las estrategias: write-behind responde después de tocar solo Redis, las otras dos esperan a PostgreSQL. Write-behind también envía muchas menos sentencias a la base de datos, porque cada vaciado es una sentencia.
- Las ejecuciones son cortas y la máquina estaba compartida con otros trabajos. Las diferencias de latencia de unos pocos milisegundos entre filas son ruido.

## Límites del laboratorio

- Una sola instancia de la API. El bloqueo está en Redis, así que funcionaría entre instancias, pero el conteo de consultas por expiración vive en la memoria del proceso de la API.
- La consulta costosa se simula con `pg_sleep`.
- Redis corre sin persistencia y sin límite de memoria, así que aquí nunca hay descarte.
- La penetración y la avalancha de caché las cubre el quiz, no este miniproyecto.

## Fuentes

- Documentación de Redis: [`SET`](https://redis.io/docs/latest/commands/set/) (las opciones `NX` y `PX` y el patrón de bloqueo), [`EXPIRE`](https://redis.io/docs/latest/commands/expire/), [descarte de claves](https://redis.io/docs/latest/develop/reference/eviction/), [persistencia](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/).
- RFC 9111, HTTP Caching, y RFC 5861 para `stale-while-revalidate`, la forma HTTP de servir una copia mientras se renueva.
