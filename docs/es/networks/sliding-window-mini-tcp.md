# Ventana deslizante y un mini TCP

> English version: [docs/en/networks/sliding-window-mini-tcp.md](../../en/networks/sliding-window-mini-tcp.md) · Versão em português: [docs/pt/networks/sliding-window-mini-tcp.md](../../pt/networks/sliding-window-mini-tcp.md)

Mini-proyecto: [`projects/networks/sliding-window-mini-tcp`](../../../projects/networks/sliding-window-mini-tcp/README.es.md). Lenguajes: Go y Elixir. Temas del quiz: `networks` / `data-link-layer` y `networks` / `transport-layer`.

## El problema

Una red entrega paquetes con el mejor esfuerzo: un paquete puede perderse, llegar dos veces o llegar después de un paquete enviado más tarde. Las aplicaciones quieren lo contrario: cada byte, una vez, en orden. Los protocolos de este mini-proyecto construyen lo segundo a partir de lo primero usando solo tres herramientas: **números de secuencia**, **confirmaciones** y **temporizadores**.

## Parte 1: el canal simulado

`go/channel` (y `elixir/lib/sliding_window_mini_tcp/channel.ex`) modela un sentido de un enlace. Entregarle un paquete en el tick `now` devuelve los ticks en que llegan las copias:

| Resultado | Significado |
| --- | --- |
| ninguna llegada | el paquete se perdió |
| dos llegadas | el paquete se duplicó |
| una llegada posterior a la de un paquete más nuevo | reordenamiento |

Toda decisión aleatoria viene de un generador sembrado por la configuración. La misma semilla da las mismas pérdidas en los mismos ticks, lo que una prueba verifica comparando dos trazas. Un canal reproducible es lo que hace depurable un error de protocolo.

## Parte 2: tres protocolos, un motor

`go/arq` describe un protocolo con dos números, la ventana de envío y la ventana de recepción:

| Protocolo | Ventana de envío | Ventana de recepción | Confirmación | Al expirar el tiempo |
| --- | --- | --- | --- | --- |
| stop-and-wait | 1 | 1 | acumulativa | reenviar la trama |
| go-back-N | N | 1 | acumulativa | reenviar la ventana entera |
| repetición selectiva | N | N | una por trama | reenviar solo la trama que expiró |

El enlace simulado lleva una trama por tick con un retardo de 5 ticks, así que un viaje de ida y vuelta dura al menos 10 ticks. Por eso stop-and-wait entrega cerca de 0.09 tramas por tick sin pérdida: envía una trama y queda inactivo el resto del viaje de ida y vuelta. Una ventana llena ese tiempo inactivo.

### Los números de secuencia dan la vuelta

Las tramas llevan un número de secuencia de 16 bits. Cada lado recupera la posición real a partir de la distancia hasta el borde de su ventana, módulo 2^16. Para que esto no sea ambiguo la ventana está limitada: 2^n - 1 para go-back-N y 2^(n-1) para la repetición selectiva, porque un receptor que guarda tramas nunca debe ver superpuestas su ventana antigua y su ventana nueva. `MaxWindow` codifica la regla y una prueba la verifica con 3 bits (7 y 4).

El stop-and-wait clásico de 1 bit solo es correcto en un canal que conserva el orden. Este canal reordena, así que los tres protocolos usan el espacio de 16 bits.

### Lo que muestra la simulación

De [results/results.md](../../../projects/networks/sliding-window-mini-tcp/results/results.md), un archivo de 256 KiB en 256 tramas, ventana de 8:

| pérdida | protocolo | ticks | tramas enviadas | eficiencia |
| --- | --- | --- | --- | --- |
| 0% | stop-and-wait | 2878 | 256 | 100.0% |
| 0% | go-back-N | 1832 | 522 | 49.0% |
| 0% | repetición selectiva | 444 | 256 | 100.0% |
| 20% | stop-and-wait | 6933 | 417 | 61.4% |
| 20% | go-back-N | 5099 | 1154 | 22.2% |
| 20% | repetición selectiva | 2037 | 417 | 61.4% |

- Go-back-N retransmite incluso con un 0% de pérdida. El canal igual reordena el 20% de las copias, y un receptor que acepta solo la siguiente trama en orden descarta las que llegan antes. El reordenamiento le cuesta a go-back-N tanto como la pérdida.
- La repetición selectiva y stop-and-wait envían exactamente el mismo número de tramas: ambos reenvían solo lo que realmente se perdió. La repetición selectiva simplemente lo hace varias veces más rápido.
- Todas las filas terminan con el mismo SHA-256 que el archivo original, con cualquier tasa de pérdida.

## Parte 3: el mini TCP sobre UDP

`go/minitcp` corre sobre sockets UDP reales en la interfaz de loopback. La pérdida se inyecta donde envía cada socket, en ambos sentidos, porque el propio loopback prácticamente nunca descarta un paquete.

| Mecanismo | Cómo aparece en el código |
| --- | --- |
| Acuerdo de tres vías | SYN, SYN+ACK, ACK con números de secuencia iniciales; los segmentos posteriores deben confirmar el número del receptor, así que los extraviados se ignoran |
| Números de secuencia de bytes | `seq` es el número del primer byte de los datos, 32 bits, comparado con aritmética que da la vuelta |
| ACK acumulativo | `ack` es el siguiente byte esperado; un campo extra `sack` nombra el segmento que provocó el ACK, usado por la repetición selectiva |
| Tiempo límite de retransmisión | tiempo de ida y vuelta suavizado más cuatro veces la desviación; se duplica al expirar; la regla de Karn omite los segmentos retransmitidos |
| Cierre ordenado | FIN, FIN+ACK, y el receptor permanece un tiempo para repetir su última respuesta, como TIME_WAIT |
| Integridad | CRC-32 en cada segmento, SHA-256 en el archivo completo |

El transmisor puede recuperarse de la pérdida de las mismas tres formas que la simulación. Medido en la ejecución confirmada en el repositorio (10 MB, 5% de pérdida en cada sentido, 3 ejecuciones):

| protocolo | MB/s (media ± desv. est.) | segmentos enviados | tiempos agotados |
| --- | --- | --- | --- |
| stop-and-wait | 3.96 ± 0.14 | 9186 | 852 |
| go-back-N, ventana 32 | 7.43 ± 0.54 | 22323 | 438 |
| repetición selectiva, ventana 32 | 15.72 ± 0.30 | 9079 | 209 |

Go-back-N envía cerca de dos veces y media los segmentos para mover el mismo archivo. Estos tiempos dependen de la máquina y de la planificación, así que no son reproducibles al dígito; el informe registra el procesador y el entorno de ejecución, y lo que se mantiene entre ejecuciones es el orden de los tres.

## Por qué también Elixir

La versión en Elixir repite la simulación como una función pura. La transferencia entera es una struct inmutable; cada tick es un pipeline de cuatro funciones que devuelven la siguiente struct; el bucle es recursión con una cláusula por situación. El generador aleatorio es un valor que se pasa entre las llamadas, así que el determinismo no exige disciplina: no hay estado oculto que olvidar. Los números difieren de la tabla de Go porque los dos lenguajes usan generadores distintos, pero cada uno es repetible por sí solo.

## Límites

- Sin control de congestión: la ventana es fija. Slow start y AIMD son material del quiz, no están implementados aquí.
- Sin ventana de control de flujo anunciada por el receptor.
- Una conexión por socket, un sentido de datos.
- El mini TCP no es interoperable con el TCP real. Es un protocolo de enseñanza y corre solo en la interfaz de loopback.

## Verificar

```sh
cd projects/networks/sliding-window-mini-tcp
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
docker compose run --rm -T go-demo
```
