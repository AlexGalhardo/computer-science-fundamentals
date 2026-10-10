# Servidor HTTP sobre TCP puro (MP-PROTO-3)

> English version: [docs/en/protocols/http-server-raw-tcp.md](../../en/protocols/http-server-raw-tcp.md) · Versão em português: [docs/pt/protocols/http-server-raw-tcp.md](../../pt/protocols/http-server-raw-tcp.md)

Miniproyecto: [`projects/protocols/http-server-raw-tcp`](../../../projects/protocols/http-server-raw-tcp/README.es.md). Tema del quiz: `http-semantics`.

## La pregunta

TCP le entrega a un programa un flujo de bytes, sin ninguna noción de "mensaje". HTTP/1.1 es un conjunto de reglas para cortar ese flujo en peticiones y respuestas. Escribir el servidor sin una biblioteca HTTP obliga a que cada regla aparezca en el código: dónde termina una línea, dónde terminan las cabeceras, dónde termina el cuerpo y cuándo se puede reutilizar la conexión.

## El formato de un mensaje

```text
línea de petición   POST /echo HTTP/1.1\r\n
campos de cabecera  Host: localhost\r\n
                    Content-Length: 11\r\n
línea vacía         \r\n
cuerpo              hello world
```

- Cada línea termina con CR LF (`\r\n`, bytes `0d 0a`).
- La **línea de petición** tiene tres partes separadas por un espacio: método, destino, versión. Una respuesta empieza en cambio con una **línea de estado**: versión, código de estado, frase de motivo.
- Cada **campo de cabecera** es `Nombre: valor`. Los nombres no distinguen mayúsculas de minúsculas. No se permite ningún espacio antes de los dos puntos.
- Una **línea vacía** termina las cabeceras. Es el único separador entre cabeceras y cuerpo.
- El **cuerpo** son bytes simples. Nada dentro de él marca su final.

Los bytes anotados de un intercambio real están en el [README](../../../projects/protocols/http-server-raw-tcp/README.es.md#traza-de-red-los-bytes-crudos-de-una-petición-y-de-una-respuesta).

## ¿Dónde termina el cuerpo?

Esta es la pregunta central de HTTP/1.1, porque la conexión sigue abierta y el siguiente mensaje viene justo después. Hay dos respuestas:

| | `Content-Length: N` | `Transfer-Encoding: chunked` |
| --- | --- | --- |
| Cuándo | el tamaño se conoce antes de enviar | el tamaño aún no se conoce |
| Cómo | leer exactamente N bytes | leer chunks hasta el de tamaño cero |
| En la red | `hello world` | `b\r\nhello world\r\n0\r\n\r\n` |

Un chunk es su tamaño en **hexadecimal**, CR LF, los datos, CR LF. El miniproyecto lee los cuerpos de las peticiones por `Content-Length` y escribe **respuestas** chunked para la ruta `/stream`, vaciando cada chunk (flush) a medida que se produce: con `curl -N` las líneas aparecen una a una.

Un mensaje que tiene ambas cabeceras es una fuente clásica de ataques (request smuggling): un proxy que cree en una y un servidor que cree en la otra discrepan sobre dónde termina la petición, y los bytes sobrantes se leen como una petición nueva. Este servidor rechaza una petición con `Transfer-Encoding` (`501`) en lugar de adivinar, y rechaza dos valores de `Content-Length` que no coinciden (`400`).

## Análisis defensivo

Un parser lee lo que envía un desconocido, así que se escribe pensando en la peor entrada:

- **Límites en todo.** La línea de petición, la sección de cabeceras, el número de cabeceras y el cuerpo tienen cada uno un máximo. Sin ellos, un cliente que nunca envía el final de una línea hace que el servidor retenga memoria para siempre. El parser deja de leer en cuanto se supera un límite, y una prueba lo demuestra con un lector que cuenta los bytes consumidos.
- **El estado correcto para cada rechazo.** `400` para un mensaje mal formado, `414` para una línea de petición demasiado larga, `431` para cabeceras demasiado grandes, `413` para un cuerpo demasiado grande, `505` para una versión no soportada.
- **Estricto donde la ambigüedad es peligrosa.** Un espacio antes de los dos puntos, una cabecera continuada en la línea siguiente, un CR suelto, un `Content-Length` que no son solo dígitos: todo se rechaza, porque dos programas que leen los mismos bytes de forma distinta son la raíz del smuggling.
- **Un error y luego cierre.** Tras una petición mal formada el servidor no puede saber dónde empieza la siguiente, así que responde una vez y cierra la conexión.

## Keep-alive

Abrir una conexión TCP cuesta un viaje de ida y vuelta (y TLS cuesta más). Por eso HTTP/1.1 mantiene la conexión abierta por defecto: tras la respuesta, el servidor espera otra petición en el mismo socket. Se cierra cuando un lado envía `Connection: close`, cuando la conexión permanece inactiva demasiado tiempo o tras un error. HTTP/1.0 es lo contrario: cierra a menos que el cliente pida `Connection: keep-alive`.

En el código esto es un bucle alrededor de "leer una petición, escribir una respuesta", con **un lector con buffer para toda la conexión**. Un cliente puede enviar la segunda petición antes de que llegue la primera respuesta (pipelining), así que bytes de la petición 2 pueden estar ya en el buffer cuando termina la petición 1. No se pierden porque el parser consumió exactamente los bytes de la petición 1.

## Enrutamiento

El router responde dos preguntas, y cada una tiene su propio error:

- ¿Alguna ruta conoce esta **ruta (path)**? Si no, `404 Not Found`.
- ¿Una ruta para este path acepta este **método**? Si no, `405 Method Not Allowed`, con una cabecera `Allow` que lista los métodos que funcionan.

`HEAD` lo atiende el handler de `GET`: mismo estado y mismas cabeceras, incluido el `Content-Length` que tendría el cuerpo, y sin cuerpo.

## Comprobado por clientes que no escribimos

Un servidor probado solo con su propio parser puede estar equivocado de forma consistente. Tres clientes independientes comprueban este:

- El cliente `net/http` de Go, en las pruebas unitarias: decodifica la respuesta chunked e informa que **reutilizó** la conexión en la segunda y la tercera petición.
- **curl**: parámetros, POST, chunked (decodificado y con `--raw`), reutilización de la conexión, `HEAD`, 404, 405, 431.
- **Chromium**, headless: renderiza la página HTML, y las llamadas `fetch()` de la página reciben el texto esperado, incluido el flujo chunked.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-PROTO-3.1 parser de peticiones | `go/httpraw/request_test.go`: 22 peticiones mal formadas y 6 demasiado grandes, cada una con su estado esperado. `docker compose run --rm go-test` |
| MP-PROTO-3.2 router, keep-alive y respuestas chunked | `docker compose run --rm curl-check` y `docker compose run --rm browser-check`, además de `go/app/app_test.go` |
| MP-PROTO-3.3 traza de red | el README muestra los bytes anotados de una petición y de una respuesta, producidos por `docker compose run --rm trace` |

## Cómo ejecutarlo

```sh
cd projects/protocols/http-server-raw-tcp
./setup-unix-http-server-raw-tcp.sh        # or ./setup-windows-http-server-raw-tcp.ps1
docker compose run --rm trace
```
