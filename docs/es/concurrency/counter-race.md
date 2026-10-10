# Condición de carrera en el contador

> English version: [docs/en/concurrency/counter-race.md](../../en/concurrency/counter-race.md) · Versão em português: [docs/pt/concurrency/counter-race.md](../../pt/concurrency/counter-race.md)

Mini-proyecto: [projects/concurrency/counter-race](../../../projects/concurrency/counter-race/README.es.md) (MP-CONC-1). Lenguajes: Go, Rust, Java, TypeScript, Elixir.

## El problema

`counter++` no es un solo paso. El procesador lee el valor, suma 1 y escribe el resultado de vuelta. Cuando dos threads ejecutan esos tres pasos al mismo tiempo, puede pasar esto:

```text
thread A            thread B            contador
lee 41                                  41
                    lee 41              41
suma 1 (42)
                    suma 1 (42)
escribe 42                              42
                    escribe 42          42   <- dos incrementos, el contador creció uno
```

Se perdió una actualización. Nada se rompió y no apareció ningún error. El programa simplemente da una respuesta incorrecta, distinta en cada ejecución. En el mini-proyecto, 8 workers hacen 1,000,000 de incrementos en total y el contador con bug suele terminar entre 150,000 y 700,000.

Los tres pasos forman una **sección crítica**: un fragmento de código que solo un thread a la vez puede ejecutar. Toda corrección es una forma de garantizar eso.

## Por qué el bug se esconde

Una carrera necesita mala suerte en el tiempo, y las pruebas pequeñas rara vez la tienen. Tres cosas de este mini-proyecto existen solo para que el bug aparezca siempre:

- Una **puerta de salida**. Todos los workers esperan y salen juntos. Sin ella, el primer worker suele terminar antes de que el último empiece.
- **Lecturas y escrituras reales**. Un compilador optimizador puede convertir un bucle de 125,000 incrementos en un único `+= 125000`. La carrera sigue ahí, pero casi nunca aparece. La versión en Rust usa lecturas y escrituras volátiles, y la versión en Java usa un campo `volatile`, para mantener una lectura y una escritura por incremento. Con un campo Java común, medimos el bug escondiéndose en 8 de 10 ejecuciones después de que el compilador JIT se calentó.
- **Repetición**. La prueba ejecuta el experimento 30 veces y exige actualizaciones perdidas en al menos 24. Una carrera de datos solo pierde actualizaciones mientras los workers corren de verdad en paralelo, así que en una máquina ocupada alguna ejecución no pierde nada; el margen evita que la prueba falle por ese motivo.

El `volatile` de Java merece atención: garantiza que una lectura ve la última escritura (visibilidad), y nada más. `count++` en un campo volatile sigue siendo tres pasos y sigue perdiendo actualizaciones.

## Las cuatro correcciones

| Corrección | Idea | Costo |
| --- | --- | --- |
| Mutex | Solo quien tiene el lock ejecuta la sección crítica. Los demás esperan | Espera, y un lock y un unlock por incremento |
| Operación atómica | El procesador hace lectura, suma y escritura como una instrucción indivisible | Sirve para una variable. Dos variables que cambian juntas todavía necesitan un lock |
| Canal o paso de mensajes | Un thread es dueño del número. Los demás le envían mensajes, atendidos uno a la vez | Una operación de cola por incremento, la más lenta de las cuatro |
| Actor | La misma idea como característica del lenguaje: un proceso de Elixir guarda el estado en su propio bucle y tiene un buzón de mensajes | Lo mismo que arriba. A cambio, el estado nunca se comparte por accidente |

Las dos primeras comparten la memoria y la protegen. Las dos últimas no comparten la memoria en absoluto.

### El paso de mensajes no elimina toda carrera

La carpeta de Elixir también tiene una función deliberadamente incorrecta, `get_then_set`: le pide el valor al dueño y luego envía de vuelta el valor más uno. Cada mensaje se atiende por separado, pero dos procesos pueden leer 41 y ambos escribir 42. Es la misma actualización perdida, un nivel más arriba. La regla es la misma en todos los modelos: la operación completa debe ser **un** paso indivisible. Con un lock, eso es una sección crítica. Con un actor, es un mensaje.

## Qué hace cada lenguaje al respecto

- **Go** compila el bug sin advertencia. El detector de carreras (`go test -race`, `go build -race`) lo encuentra en tiempo de ejecución: recuerda qué goroutine tocó cada dirección y bajo qué lock, y reporta dos accesos sin sincronización en los que uno es una escritura.
- **Rust** se niega a compilar el bug. Un valor compartido por threads debe ser `Sync`, y un número escrito a través de una referencia compartida no lo es. La versión con bug necesita `UnsafeCell` y un `unsafe impl Sync` falso para existir, por eso está marcada como deliberadamente incorrecta. Una carrera de datos es comportamiento indefinido en Rust.
- **Java** compila el bug sin advertencia y el JDK no tiene un detector dinámico de carreras. La herramienta habitual es estática: el campo declara su lock con `@GuardedBy("this")` y el plugin de compilador Error Prone señala todo acceso hecho sin ese lock.
- **TypeScript**: los workers no comparten nada por defecto. Una carrera necesita un `SharedArrayBuffer`. `Atomics.add` es la corrección atómica, y se puede armar un mutex con `Atomics.compareExchange`, `Atomics.wait` y `Atomics.notify`.
- **Elixir**: los procesos no comparten memoria, así que no hay carrera de datos que escribir. Las carreras de nivel más alto, como `get_then_set`, siguen siendo posibles.

## Resultados

Salida capturada de los detectores: [race-detector-go.txt](../../../projects/concurrency/counter-race/results/race-detector-go.txt) y [race-detector-java.txt](../../../projects/concurrency/counter-race/results/race-detector-java.txt).

Rendimiento con 1, 2, 4 y 8 workers: [throughput.md](../../../projects/concurrency/counter-race/results/throughput.md), con la máquina en [results.md](../../../projects/concurrency/counter-race/results/results.md). La principal lección de la tabla es que un contador compartido se vuelve más lento con más workers, no más rápido: todos los núcleos necesitan la misma posición de memoria, así que se turnan.

## Quiz

Temas del área `concurrency` que este mini-proyecto demuestra: `race-conditions`, `mutexes-and-locks`, `atomics-and-memory-models`, `message-passing-and-channels` y `actor-model-and-beam`.
