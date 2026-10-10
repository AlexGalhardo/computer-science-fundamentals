# http-server-raw-tcp

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un servidor HTTP/1.1 escrito en Go directamente sobre sockets TCP, **sin `net/http`**. El miniproyecto enseña qué hay dentro de una petición y una respuesta HTTP: una línea de petición, líneas de cabecera, una línea vacía y un cuerpo cuya longitud anuncian las cabeceras. Analiza las peticiones a mano, las enruta, mantiene las conexiones abiertas (keep-alive), envía respuestas en chunked y rechaza las peticiones mal formadas o demasiado grandes con el código de estado correcto. curl y un navegador real comprueban que lo que envía es HTTP válido.

Explicación de los conceptos: [docs/es/protocols/http-server-raw-tcp.md](../../../docs/es/protocols/http-server-raw-tcp.md).

## Traza de red: los bytes crudos de una petición y de una respuesta

Salida de `docker compose run --rm trace` (primer escenario). `>` es lo que envió el cliente, `<` es lo que respondió el servidor. `\r\n` es el par de bytes CR LF (`0d 0a`) que termina cada línea del protocolo. Las notas de la derecha se añaden aquí.

```text
> POST /echo HTTP/1.1\r\n            línea de petición: MÉTODO, un espacio, DESTINO, un espacio, VERSIÓN
> Host: localhost\r\n                cabecera: qué sitio se quiere (obligatoria en HTTP/1.1)
> Content-Type: text/plain\r\n       cabecera: qué es el cuerpo
> Content-Length: 11\r\n             cabecera: el cuerpo mide exactamente 11 bytes
> Connection: close\r\n              cabecera: cierra la conexión después de esta respuesta
> \r\n                               línea VACÍA: fin de las cabeceras, el cuerpo empieza a continuación
> hello world                        cuerpo: 11 bytes, sin fin de línea, nada marca su final

< HTTP/1.1 200 OK\r\n                línea de estado: VERSIÓN, CÓDIGO, frase de motivo (solo para personas)
< Connection: close\r\n              el servidor acepta cerrar
< Content-Length: 11\r\n             el cuerpo de la respuesta mide 11 bytes
< Content-Type: text/plain; charset=utf-8\r\n
< X-Body-Bytes: 11\r\n               una cabecera de esta aplicación: bytes que leyó de la petición
< \r\n                               línea VACÍA: fin de las cabeceras
< hello world                        cuerpo: los 11 bytes anunciados arriba
```

La misma petición como los 116 bytes que viajan por el flujo TCP:

```text
0000  50 4f 53 54 20 2f 65 63 68 6f 20 48 54 54 50 2f  POST /echo HTTP/
0010  31 2e 31 0d 0a 48 6f 73 74 3a 20 6c 6f 63 61 6c  1.1..Host: local
0020  68 6f 73 74 0d 0a 43 6f 6e 74 65 6e 74 2d 54 79  host..Content-Ty
0030  70 65 3a 20 74 65 78 74 2f 70 6c 61 69 6e 0d 0a  pe: text/plain..
0040  43 6f 6e 74 65 6e 74 2d 4c 65 6e 67 74 68 3a 20  Content-Length:
0050  31 31 0d 0a 43 6f 6e 6e 65 63 74 69 6f 6e 3a 20  11..Connection:
0060  63 6c 6f 73 65 0d 0a 0d 0a 68 65 6c 6c 6f 20 77  close....hello w
0070  6f 72 6c 64                                      orld
```

- `20` es el espacio que separa las tres partes de la línea de petición.
- `0d 0a` (mostrado como `..`) termina cada línea. En el desplazamiento `0x65` hay dos seguidos, `0d 0a 0d 0a`: el fin de la última cabecera y la línea vacía. El parser busca exactamente eso.
- Los 11 bytes siguientes (`68 65 6c 6c 6f 20 77 6f 72 6c 64`) son el cuerpo. El servidor solo sabe dónde detenerse gracias a `Content-Length: 11`.

### Una respuesta en chunked

Cuando el tamaño no se conoce de antemano, el cuerpo va en trozos. Cada trozo (chunk) es su tamaño en hexadecimal, CR LF, los datos, CR LF. Un trozo de tamaño cero termina el cuerpo.

```text
> GET /stream HTTP/1.1\r\n
> Host: localhost\r\n
> Connection: close\r\n
> \r\n

< HTTP/1.1 200 OK\r\n
< Connection: close\r\n
< Content-Type: text/plain; charset=utf-8\r\n
< Transfer-Encoding: chunked\r\n     sin Content-Length: el cuerpo lo delimitan los chunks
< \r\n
< 7\r\n                              tamaño del chunk: siguen 7 bytes
< line 1\n                           los 7 bytes ("line 1" y un salto de línea)
< \r\n                               fin del chunk
< 7\r\n
< line 2\n
< \r\n
  ... tres chunks más ...
< 0\r\n                              chunk de tamaño cero: no hay más datos
< \r\n                               fin del cuerpo
```

Los otros escenarios que imprime el comando son dos peticiones en una misma conexión keep-alive y una línea de petición mal formada respondida con `400`.

## Qué hace el servidor

| Parte | Archivo | Comportamiento |
| --- | --- | --- |
| Parser de peticiones | `go/httpraw/request.go` | línea de petición, cabeceras, cuerpo por `Content-Length`. Límites en cada parte |
| Escritor de respuestas | `go/httpraw/response.go` | línea de estado, cabeceras, `Content-Length` o `Transfer-Encoding: chunked` |
| Router | `go/httpraw/router.go` | método y ruta, segmentos `:name`, `404`, `405` con `Allow`, `HEAD` |
| Bucle de conexión | `go/httpraw/server.go` | keep-alive, `Connection: close`, HTTP/1.0, timeout de inactividad, una respuesta y luego cierre tras un error |
| Sitio de demostración | `go/app/app.go` | `/`, `/hello/:name`, `POST /echo`, `/stream`, `/health` |
| Traza de red | `go/trace/`, `go/cmd/trace/` | envía bytes crudos por TCP e imprime ambas direcciones |

Cómo se responde a una petición rechazada:

| Problema | Estado |
| --- | --- |
| línea de petición mal formada, cabecera sin dos puntos, espacio antes de los dos puntos, line folding, CR suelto, `Host` ausente o repetido, `Content-Length` inválido o en conflicto, cuerpo más corto de lo anunciado | `400 Bad Request` |
| línea de petición más larga que el límite | `414 URI Too Long` |
| sección de cabeceras mayor que el límite, o demasiados campos de cabecera | `431 Request Header Fields Too Large` |
| cuerpo mayor que el límite | `413 Content Too Large` |
| petición con `Transfer-Encoding` (los cuerpos de las peticiones se leen solo por `Content-Length`) | `501 Not Implemented` |
| versión distinta de HTTP/1.0 y HTTP/1.1 | `505 HTTP Version Not Supported` |

Después de cualquiera de estos casos, el servidor envía una respuesta y cierra la conexión: ya no puede saber dónde empezaría la siguiente petición.

Este es un servidor de enseñanza. No tiene TLS, ni cuerpo de petición en codificación chunked, ni `Expect: 100-continue`, ni HTTP/2. No lo uses en producción.

## Temas del quiz que demuestra

Área `protocols`, tema `http-semantics`: formato de los mensajes de petición y respuesta, `Host`, `Content-Length` frente a `Transfer-Encoding: chunked`, conexiones persistentes, `HEAD`, `404` frente a `405`, `400` y `431`.

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-http-server-raw-tcp.sh        # Linux y macOS
./setup-windows-http-server-raw-tcp.ps1    # Windows
```

El script construye la imagen y ejecuta tres comprobaciones: las pruebas de Go, curl contra el servidor y un Chromium headless contra el servidor. Después elimina los contenedores.

## Demo

La traza de red (cuatro escenarios):

```sh
docker compose run --rm trace
```

El servidor en tu propio navegador y con tu propio curl, en un puerto enlazado a `127.0.0.1`:

```sh
docker compose --profile demo up --build demo
# in another terminal
curl -v http://127.0.0.1:8089/hello/you
curl -N http://127.0.0.1:8089/stream           # the lines arrive one by one
curl --raw http://127.0.0.1:8089/stream        # the chunks as they are on the wire
# and open http://127.0.0.1:8089/ in a browser
docker compose --profile demo down
```

`DEMO_PORT` cambia el puerto.

## Pruebas

```sh
docker compose run --rm go-test                 # gofmt, go vet, golangci-lint, go test
docker compose run --rm curl-check              # curl 7.88 against the server
docker compose run --rm browser-check           # headless Chromium against the server
docker compose down -v
```

| Dónde | Qué demuestra |
| --- | --- |
| `go/httpraw/request_test.go` | el parser: una petición completa, 22 peticiones mal formadas, 6 demasiado grandes, una petición justo en los límites, y que una cabecera demasiado grande se rechaza sin leerla hasta el final |
| `go/app/app_test.go` | sobre TCP real en loopback: enrutamiento, eco de un cuerpo de 50 kB, `HEAD`, keep-alive (el propio cliente `net/http` de Go reutiliza la conexión), pipelining, `Connection: close`, HTTP/1.0, timeout de inactividad, los bytes chunked en la red, chunks que llegan uno a uno, errores que cierran la conexión |
| `scripts/curl-check.sh` | curl recibe respuestas correctas: parámetros, POST, chunked (decodificado y crudo), reutilización de la conexión, `HEAD`, 404, 405, 431 |
| `scripts/browser-check.sh` | Chromium renderiza la página y sus llamadas `fetch()` reciben respuestas correctas, incluida la chunked |

## Versiones

| Componente | Versión |
| --- | --- |
| Go | 1.27.1 (`golang:1.27.1-bookworm`), solo biblioteca estándar |
| golangci-lint | 2.14.0 (`golangci/golangci-lint:v2.14.0`) |
| curl (comprobación) | 7.88.1, el que trae la imagen de Go |
| Chromium (comprobación) | 153, de `mcr.microsoft.com/playwright:v1.63.0-noble` |
