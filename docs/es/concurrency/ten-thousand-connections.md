# Diez mil conexiones

> English version: [docs/en/concurrency/ten-thousand-connections.md](../../en/concurrency/ten-thousand-connections.md) · Versão em português: [docs/pt/concurrency/ten-thousand-connections.md](../../pt/concurrency/ten-thousand-connections.md)

Mini-proyecto: [projects/concurrency/ten-thousand-connections](../../../projects/concurrency/ten-thousand-connections/README.es.md) (MP-CONC-3). Lenguajes: TypeScript, Go, Elixir.

## El problema

Un servidor pasa la mayor parte de su vida esperando: la siguiente solicitud de un cliente, una base de datos, otro servicio. El diseño más simple le da a cada conexión un thread del sistema operativo, y ese thread se bloquea mientras espera. Funciona para cientos de conexiones y se desmorona con decenas de miles:

- cada thread reserva una pila (normalmente 8 MiB de espacio de direcciones en Linux), la use o no;
- el kernel tiene que planificar todos los threads, y cambiar de uno a otro cuesta tiempo;
- nada de eso compra algo, porque una conexión que espera no hace ningún trabajo.

Entonces la pregunta es: ¿cuál es la cosa más barata que puede representar "una conexión que está esperando"? Los tres servidores de este mini-proyecto dan tres respuestas.

## Tres respuestas

| | TypeScript en Bun | Go | Elixir en la BEAM |
| --- | --- | --- | --- |
| Modelo | Event loop | Goroutine por conexión | Proceso por conexión |
| Quién espera | Nadie. Se guardan un timer y una promise, y el único thread vuelve al loop | La goroutine. El runtime la estaciona y reutiliza el thread | El proceso. El planificador lo salta hasta que llega un mensaje o un tiempo límite |
| Una conexión que espera es | Un socket y algunos objetos pequeños | La pila de una goroutine más los buffers de `net/http` | Un proceso con heap y pila propios y pequeños |
| El código parece | Asíncrono: `await` marca cada punto donde puede pausar | Bloqueante: una función común que duerme | Bloqueante: una función común que duerme |
| Núcleos de procesador usados | Uno para JavaScript | Todos | Todos |
| Cálculo largo en un handler | Bloquea todas las demás conexiones | Interrumpido por el runtime | Interrumpido por el planificador |
| Una falla en una conexión | Una excepción que hay que capturar, en estado compartido | Un panic, recuperado por solicitud por `net/http` | Mata solo ese proceso. Nada se comparte |

**Event loop.** Un thread le pregunta al sistema operativo qué sockets están listos, ejecuta el pequeño fragmento de código de cada uno y vuelve a preguntar. `await Bun.sleep(ms)` no detiene el thread: registra un timer y retorna. Esto es concurrencia sin paralelismo. Su punto débil es que un callback lento retrasa a todos.

**Goroutines.** Go mantiene el estilo "un thread bloqueante por conexión" y hace barato el thread. Una goroutine la planifica el runtime de Go, no el kernel, empieza con una pila de pocos kibibytes que crece bajo demanda, y cuando se bloquea en la red el runtime la estaciona y ejecuta otra en el mismo thread. Por debajo también hay un event loop (el network poller), oculto al programador.

**Procesos de la BEAM.** La máquina virtual de Erlang va un paso más allá: los procesos no comparten memoria y solo conversan por mensajes. Cada uno tiene su propio heap y su propia recolección de basura, y el planificador interrumpe un proceso después de una cantidad fija de trabajo. Una conexión es un proceso, y su falla no puede corromper a otro.

## La medición

El escenario de k6 abre 10,000 conexiones, cada una un `GET /delay?ms=30000` que se mantiene abierto e inactivo durante 30 segundos. Mientras se mantienen, mide:

- **memoria por conexión**: el crecimiento de la memoria residente del servidor, leída de `/proc/self/status`, dividido por el número de solicitudes en curso que informa el servidor;
- **latencia de solicitudes nuevas**: 50 `POST /echo` por segundo, con p50, p95 y p99.

Los resultados de la ejecución versionada están en [results.md](../../../projects/concurrency/ten-thousand-connections/results/results.md): cerca de 4 KiB por conexión en Bun, 16 KiB en Go y 10 KiB en Elixir, con una latencia mediana por debajo de un milisegundo en los tres. Los tres modelos pasan la prueba con holgura, y ese es el punto: ninguno gasta un thread en una conexión que está esperando.

La comparación es justa porque una única suite de pruebas de protocolo pasa contra los tres servidores, así que el cliente no puede distinguirlos.

### Lo que los números no dicen

- La carga solo espera. No dice nada sobre handlers pesados de procesador, donde el único thread del event loop es el límite.
- La memoria por conexión depende de lo que el handler mantiene vivo. Un handler real guarda solicitudes interpretadas, sesiones y buffers.
- El generador de carga y los servidores comparten una máquina, así que la latencia incluye el ruido del propio k6 y de cualquier otra cosa en ejecución. Una de dos ejecuciones mostró un p99 de 361 ms para Go, y la otra 10.57 ms.

## Solo destinos locales

Una prueba de carga envía tráfico real. Apuntada a un host que no es tuyo, es un ataque, y basta un error de tipeo en una variable de entorno para que ocurra por accidente. Este mini-proyecto tiene tres barreras:

1. `load/target.js` acepta solo `localhost`, `127.0.0.1`, `[::1]` y los tres nombres de servicio del docker-compose. La verificación se ejecuta antes de que k6 abra cualquier conexión, y los parecidos como `http://localhost@example.com` se rechazan.
2. Una prueba (`k6-refusal-test`) ejecuta k6 con `https://example.com` y pasa solo si k6 termina con el rechazo.
3. La red de docker es `internal`: los contenedores en ella no tienen ruta a internet.

## Quiz

Temas del área `concurrency` que este mini-proyecto demuestra: `async-and-event-loop`, `actor-model-and-beam` y `concurrency-vs-parallelism`.
