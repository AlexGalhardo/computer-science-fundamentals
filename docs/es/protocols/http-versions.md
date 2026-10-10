# HTTP/1.1, HTTP/2 y HTTP/3 (MP-PROTO-2)

> English version: [docs/en/protocols/http-versions.md](../../en/protocols/http-versions.md) · Versão em português: [docs/pt/protocols/http-versions.md](../../pt/protocols/http-versions.md)

Miniproyecto: [`projects/protocols/http-versions`](../../../projects/protocols/http-versions/README.es.md). Temas del quiz: `http2`, `http3-quic`, `tls-handshake`.

## La pregunta

Las tres versiones transportan lo mismo: los métodos, los códigos de estado, las cabeceras y los cuerpos no cambiaron. Lo que cambió es **cómo se ponen los mensajes en la red**, y eso decide cuántas peticiones pueden estar en vuelo al mismo tiempo y cuánto cuesta un paquete perdido. Una página con 200 imágenes pequeñas hace visible la diferencia, porque su tiempo de carga depende de la concurrencia, no del ancho de banda.

## Qué cambia cada versión

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| Transporte | TCP | TCP | QUIC, sobre UDP |
| Formato de los mensajes | texto | frames binarios | frames binarios |
| Peticiones en vuelo por conexión | 1 | muchas (streams) | muchas (streams) |
| Qué hacen los navegadores al respecto | unas 6 conexiones por origen | 1 conexión | 1 conexión |
| Compresión de cabeceras | ninguna | HPACK | QPACK |
| Handshake antes de la primera petición (con TLS 1.3) | 2 viajes de ida y vuelta | 2 viajes de ida y vuelta | 1 viaje de ida y vuelta |
| Un paquete perdido retrasa | su conexión | todos los streams de la conexión | solo su propio stream |

### HTTP/1.1: una petición a la vez por conexión

Una conexión transporta una petición, espera la respuesta completa y solo entonces transporta la siguiente. Los navegadores lo rodean abriendo unas seis conexiones por origen. Con 200 imágenes son 34 rondas de seis, y cada ronda cuesta un viaje de ida y vuelta. En un enlace sin latencia nadie lo nota. Con 50 ms por viaje de ida y vuelta, la página tarda unos 1,7 s más.

### HTTP/2: multiplexación

HTTP/2 divide cada mensaje en **frames** binarios etiquetados con un número de **stream**, de modo que los frames de muchas peticiones pueden intercalarse en una sola conexión y volver a unirse en el otro extremo. El navegador envía las 200 peticiones a la vez, y el costo del viaje de ida y vuelta se paga aproximadamente una vez, no 34.

Lo que queda es el **head-of-line blocking en TCP**. TCP entrega los bytes en orden. Cuando se pierde un paquete, todo lo recibido después espera en el kernel hasta que llega la retransmisión, incluso los frames de streams que no perdieron nada. Una sola conexión significa que un paquete perdido detiene todos los streams.

### HTTP/3: QUIC

QUIC es un transporte construido sobre UDP que conoce los streams. Cada stream se entrega en orden por sí mismo, así que un paquete perdido retrasa solo los streams cuyos datos transportaba. QUIC además fusiona el handshake de transporte con TLS 1.3: un viaje de ida y vuelta en lugar de dos. Y como corre en espacio de usuario, dentro del navegador y del servidor, cuesta más CPU por paquete que el TCP del kernel.

## Negociación: cómo se ponen de acuerdo cliente y servidor sobre la versión

- **HTTP/1.1 o HTTP/2: ALPN.** Dentro del handshake TLS, el cliente lista los protocolos que habla (`h2`, `http/1.1`) y el servidor elige uno. Sin ningún viaje de ida y vuelta adicional. En el puerto 8001 el servidor ofrece solo `http/1.1`, en el 8002 ofrece ambos y gana `h2`.
- **HTTP/3: Alt-Svc.** HTTP/3 va sobre UDP, así que no puede elegirse dentro de un handshake TCP. Un navegador sin conocimiento previo empieza por TCP, y el servidor le dice en una cabecera de respuesta que el mismo origen también está disponible sobre QUIC: `alt-svc: h3=":8003"`. El navegador usa HTTP/3 desde la siguiente conexión. La prueba verifica ambas mitades: la cabecera está ahí, y el primer documento de un navegador sin avisar llega sobre `h2`.
- Para la medición, el navegador se inicia con `--origin-to-force-quic-on`, de modo que la primera carga ya use HTTP/3 y las tres versiones se comparen con una conexión en frío.

La prueba de cada puerto no confía en la configuración. Le pregunta al navegador qué protocolo transportó el documento y cada imagen (`nextHopProtocol` de la Resource Timing API).

## TLS dentro del laboratorio

Todos los puertos usan TLS, con `tls internal` en el Caddyfile: Caddy crea su propia autoridad certificadora dentro del contenedor y emite el certificado para `site.http-versions.test`. No interviene nada público. Al navegador no se le dice que ignore los errores de certificado. Recibe el SHA-256 de la clave pública del certificado del laboratorio (`--ignore-certificate-errors-spki-list`), que la prueba lee del propio servidor, y acepta esa clave.

## Latencia y pérdida inyectadas

`tc netem` es el emulador de red del kernel de Linux. `caddy/entrypoint.sh` lo asocia a la interfaz de salida del contenedor de Caddy y selecciona paquetes por **puerto de origen**, de modo que un solo servidor ofrece las tres condiciones a la vez:

```text
qdisc prio (3 bandas)
  banda 1                              puertos 80xx   intacta
  banda 2  netem delay 50ms            puertos 81xx   filtro: sport & 0xfffc == 8100
  banda 3  netem delay 50ms loss 2%    puertos 82xx   filtro: sport & 0xfffc == 8200
```

Tres detalles:

- El modelado está en los paquetes salientes del servidor porque esa es la dirección en que viajan las imágenes. El retraso es de un solo sentido, así que suma unos 50 ms a un viaje de ida y vuelta.
- El segmentation offload está desactivado (`ethtool -K eth0 tso off gso off gro off`). Con él activado, el kernel le entrega a netem un buffer grande que luego se convierte en muchos segmentos TCP, y un solo "drop" descartaría todos.
- Esto necesita la capability `NET_ADMIN`, concedida solo al contenedor de Caddy. Le permite al contenedor configurar su propia interfaz, dentro de su propio network namespace.

## Leyendo los resultados

La tabla versionada está en el [README](../../../projects/protocols/http-versions/README.es.md#tiempo-total-de-carga-por-protocolo-y-condición) y en `results/results.md`.

- Sin modelado: las versiones están dentro de la desviación estándar unas de otras, excepto HTTP/3, que es más lento por el costo de CPU de QUIC en espacio de usuario. La mayor parte del tiempo es trabajo del navegador.
- Latencia: HTTP/1.1 tarda unas 3,3 veces más que HTTP/2 y HTTP/3, que son iguales. Esto es la multiplexación, la lección principal del miniproyecto.
- Apertura de la conexión: unos 102 ms para TCP + TLS 1.3 y unos 52 ms para QUIC, con un viaje de ida y vuelta de 50 ms. Dos viajes frente a uno.
- Latencia y pérdida: HTTP/2 y HTTP/3 se vuelven más lentos y más ruidosos, y **esta medición no muestra a HTTP/3 por delante**. La diferencia entre ellos es menor que la desviación estándar.

Por qué la ventaja de libro de texto de QUIC bajo pérdida no aparece aquí, y qué puede y qué no puede decir la medición:

- El evento load espera a la última imagen. Eliminar el head-of-line blocking ayuda a que las imágenes que **no** fueron afectadas por una pérdida terminen antes. No ayuda a la que sí fue afectada, y el total lo decide esa.
- La página es pequeña y la pérdida es aleatoria, así que cada carga ve un puñado de pérdidas. Una transferencia mayor, o ráfagas de pérdida, separarían más a los dos.
- La comparación es entre implementaciones: el TCP del kernel con décadas de ajuste en la recuperación de pérdidas frente a stacks QUIC en espacio de usuario.

## La cascada

`dashboard/index.html` dibuja, para la condición elegida, una barra por imagen para cada versión, a partir del `results/results.js` versionado. Una barra empieza cuando el navegador quiso la imagen y termina cuando llegó su último byte. Con latencia:

- HTTP/1.1 es un triángulo ancho. Todas las barras empiezan pronto, y la mayor parte de cada barra es tiempo **esperando una de las seis conexiones**. El borde derecho es una escalera con escalones de seis imágenes.
- HTTP/2 y HTTP/3 son bloques estrechos: todas las peticiones salen a la vez.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-PROTO-2.1 página con 200 imágenes sobre las tres versiones | `ts/tests/protocol.spec.ts`: una prueba por puerto (9 puertos) verifica el `nextHopProtocol` del documento y de las 200 imágenes |
| MP-PROTO-2.2 medición con y sin latencia y pérdida | `docker compose run --rm bench` escribe en `results/results.md` la tabla del tiempo total de carga por protocolo y condición |
| MP-PROTO-2.3 visual de cascada | `dashboard/index.html` dibuja las tres cascadas a partir del `results/results.js` versionado |

## Cómo ejecutarlo

```sh
cd projects/protocols/http-versions
./setup-unix-http-versions.sh        # or ./setup-windows-http-versions.ps1
docker compose run --rm bench && docker compose down -v
```
