# Laboratorio de pruebas intermitentes (MP-TEST-4)

> English version: [docs/en/testing/flaky-tests.md](../../en/testing/flaky-tests.md) · Versão em português: [docs/pt/testing/flaky-tests.md](../../pt/testing/flaky-tests.md)

Mini-proyecto: [`projects/testing/flaky-tests`](../../../projects/testing/flaky-tests/README.es.md). Temas del quiz: `flaky-tests`, `test-doubles`, `unit-tests-isolation`.

## El concepto

Una **prueba intermitente (flaky)** pasa y falla sobre el mismo código. No se cambió nada entre la ejecución verde y la roja. El resultado depende de algo que la prueba no controla.

Eso es peor que una prueba que siempre falla. Una prueba roja que podría ser "solo la intermitente" enseña al equipo a presionar reintentar, y desde ese día un fallo real se ve igual que el ruido. El valor de una suite es que rojo significa "algo se rompió". Una prueba intermitente quita ese significado.

Las tasas pequeñas se acumulan. Si cada una de `n` pruebas falla de forma independiente con probabilidad `p`, la suite tiene al menos un fallo con probabilidad `1 - (1 - p)^n`:

| Pruebas intermitentes en la suite | Tasa de fallo de cada una | Ejecuciones rojas sin bug real |
| --- | --- | --- |
| 1 | 2% | 2% |
| 10 | 2% | 18% |
| 50 | 2% | 64% |

## Las cuatro causas en el laboratorio

Toda causa es una entrada oculta: algo que afecta el resultado y no está escrito en la prueba.

### 1. Tiempo

```ts
const session = createSession("ana");                        // reads the clock inside
expect(session.expiresAt).toBe(Date.now() + SESSION_TTL_MS); // reads it again
```

Dos lecturas de un reloj que avanza. Coinciden solo cuando ambas caen en el mismo milisegundo. Otras formas de la misma causa: pruebas que fallan cerca de la medianoche, a fin de mes, en otra zona horaria, o en una máquina lenta por culpa de un `sleep` fijo.

**Corrección: un reloj falso.** El reloj se vuelve un parámetro (`Clock = () => number`). La producción usa `Date.now`. La prueba usa un `FakeClock` que se queda quieto hasta que se llama a `advance(ms)`, así "30 minutos después" no toma tiempo real y el límite de la regla se prueba al milisegundo.

### 2. Dependencia del orden

```ts
await Promise.all(ids.map(async (id) => { prices.push(await lookup(id)); }));
```

El trabajo concurrente termina en un orden que depende del tiempo. El código que recoge los resultados conforme llegan devuelve un orden distinto en cada ejecución. La misma causa aparece con colecciones sin orden, filas de base de datos sin `ORDER BY` y archivos listados desde un directorio.

**Corrección: un orden determinista.** Si quienes llaman necesitan un orden, el código debe garantizarlo (`Promise.all` devuelve los resultados en el orden de las solicitudes). Si no lo necesitan, la prueba no debe afirmar uno: compara el contenido ordenado.

### 3. Estado compartido

Tres pruebas usan un registro a nivel de módulo. Cada una depende de lo que dejó la anterior. En el orden escrito pasan. Con `bun test --randomize` solo 1 de los 6 órdenes pasa. Lo mismo ocurre con una base de datos compartida, un archivo en disco, una variable global o una variable de entorno.

**Corrección: aislamiento.** Cada prueba recibe un fixture nuevo en `beforeEach` y no deja nada atrás. Las pruebas que pasan en cualquier orden también pueden ejecutarse en paralelo.

### 4. Red real

La prueba llama a un servicio por HTTP y el servicio tiene malos momentos. Un fallo no dice nada sobre nuestro código.

**Corrección: un stub.** La función HTTP es un parámetro y la prueba pasa una que devuelve una `Response` preparada. La ruta de error, que un servicio sano no mostraría a pedido, tiene su propia prueba. El stub no dice si el servicio real todavía responde con esa forma. Una prueba de contrato o de integración aparte hace esa pregunta, a propósito y separada de la suite unitaria.

En el laboratorio la "red real" es un servicio local en una red interna de docker-compose. Sus fallos son simulados, y nada llega a un host de terceros.

## Qué mide el laboratorio

| Causa | Prueba intermitente, 50 ejecuciones | Prueba corregida, 500 ejecuciones |
| --- | --- | --- |
| Tiempo | 11 fallos | 0 fallos |
| Dependencia del orden | 37 fallos | 0 fallos |
| Estado compartido | 42 fallos | 0 fallos |
| Red real | 11 fallos | 0 fallos |

Una ejecución del README. `src/repeat.ts` inicia un proceso nuevo de `bun test --randomize` para cada ejecución, así que nada se arrastra entre ejecuciones, y hace fallar el build si una prueba intermitente nunca falla o si una prueba corregida falla una sola vez.

"Al menos una vez en 50" es una probabilidad, no una garantía: para la prueba menos intermitente (cerca de 20%) la probabilidad de 50 ejecuciones verdes es `0.8^50`, cerca de 1 en 70 000.

## Lo que no es una corrección

- **Reintentar hasta que quede verde.** Oculta el síntoma y conserva la causa. Un reintento es aceptable como cuarentena temporal con un ticket, nunca como la respuesta.
- **Un `sleep` más largo.** Hace la carrera menos probable y la suite más lenta. Espera una condición en su lugar.
- **Borrar u omitir la prueba** sin entenderla. A veces la prueba tiene razón y el producto tiene una carrera real.
- **Fijar el orden de las pruebas** para que el estado compartido siga "funcionando". La dependencia sigue ahí, y bloquea las ejecuciones en paralelo.

## Ejecutar

```sh
./setup-unix-flaky-tests.sh        # Linux and macOS
./setup-windows-flaky-tests.ps1    # Windows
```
