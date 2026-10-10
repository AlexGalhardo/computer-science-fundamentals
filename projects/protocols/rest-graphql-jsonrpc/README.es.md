# rest-graphql-jsonrpc

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un dominio pequeño (autores, libros, reseñas) expuesto con tres estilos de API por el mismo servidor ElysiaJS: **REST** (`/rest/...`), **GraphQL** (`/graphql`) y **JSON-RPC 2.0** (`/rpc`). Las reglas del dominio se escriben una sola vez, así que lo único que cambia es cómo viaja una llamada sobre HTTP. El miniproyecto enseña qué cuesta y qué ofrece cada estilo: cuántos viajes de ida y vuelta necesita una pantalla, cuántos bytes vuelven, dónde se informa el resultado de una llamada y por qué GraphQL necesita batching para evitar el problema N+1.

Explicación de los conceptos: [docs/es/protocols/rest-graphql-jsonrpc.md](../../../docs/es/protocols/rest-graphql-jsonrpc.md).

## La misma llamada en los tres estilos

"Dame el libro 7":

```http
GET /rest/books/7 HTTP/1.1
```

```http
POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"query Card($id: Int!) { book(id: $id) { id title year pages } }","variables":{"id":7}}
```

```http
POST /rpc HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","method":"books.get","params":{"id":7},"id":1}
```

Y "el libro 9999", que no existe:

| Estilo | Estado HTTP | Dónde está el fallo |
| --- | --- | --- |
| REST | `404` | el propio código de estado |
| GraphQL | `200` | `"data": {"book": null}` en una lectura, una entrada en `"errors"` con `extensions.code` en una mutación fallida |
| JSON-RPC | `200` | `"error": {"code": -32004, "message": "..."}` en el cuerpo, sin `"result"` |

## Latencia y tamaño de la respuesta por estilo

Medido con `docker compose run --rm bench` (informe completo, con máquina y método, en [results/results.md](results/results.md)). Cliente, servidor y PostgreSQL corrieron en la misma máquina, sobre loopback, con los cuerpos sin comprimir.

| Lectura | Estilo | Peticiones HTTP | Bytes de la petición | Bytes de la respuesta | Sentencias SQL | Media (ms) | Desv. estándar (ms) | p50 (ms) | p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| lista (id y título de 50 libros) | rest | 1 | 0 | 27596 | 1 | 1.505 | 0.670 | 0.946 | 3.548 |
| lista (id y título de 50 libros) | graphql | 1 | 101 | 2999 | 1 | 1.955 | 0.775 | 1.226 | 4.521 |
| lista (id y título de 50 libros) | jsonrpc | 1 | 68 | 27630 | 1 | 1.645 | 0.497 | 0.973 | 3.256 |
| detalle (4 campos de 1 libro) | rest | 1 | 0 | 538 | 1 | 0.605 | 0.113 | 0.502 | 0.764 |
| detalle (4 campos de 1 libro) | graphql | 1 | 96 | 95 | 1 | 1.184 | 0.219 | 0.891 | 1.523 |
| detalle (4 campos de 1 libro) | jsonrpc | 1 | 63 | 572 | 1 | 0.951 | 0.561 | 0.526 | 0.800 |
| anidada (1 libro, su autor, sus reseñas) | rest | 3 | 0 | 1322 | 4 | 1.669 | 0.164 | 1.569 | 2.245 |
| anidada (1 libro, su autor, sus reseñas) | graphql | 1 | 129 | 229 | 3 | 1.809 | 0.260 | 1.552 | 3.259 |
| anidada (1 libro, su autor, sus reseñas) | jsonrpc | 2 | 208 | 1427 | 4 | 1.805 | 0.111 | 1.585 | 2.511 |

Cómo leerlo:

- **El tamaño de la carga es donde los estilos realmente difieren.** En la lista, REST y JSON-RPC devuelven todos los campos de cada libro (unos 27,6 kB) cuando la pantalla quería dos campos: eso es **over-fetching**. GraphQL devuelve 3,0 kB, unas 9 veces menos.
- **Viajes de ida y vuelta.** La lectura anidada le cuesta a REST tres peticiones y a JSON-RPC dos (un lote, y luego el autor, cuyo id solo se conoce después de que llega el libro): eso es **under-fetching**. GraphQL necesita una.
- **La latencia en loopback no muestra el beneficio de tener menos viajes de ida y vuelta.** Un viaje cuesta aquí una fracción de milisegundo, así que tres peticiones REST tardan casi lo mismo que una petición GraphQL, y las diferencias entre estilos caen dentro de la desviación estándar en la lista y en la lectura anidada. GraphQL es el más lento en la lectura mínima de detalle porque analiza y valida una consulta en cada llamada. En una red real, donde cada viaje cuesta decenas de milisegundos, el número de peticiones domina y el orden cambia.
- Una máquina, un tamaño de datos, una ejecución. Esto no es un ranking de estilos.

## N+1 en GraphQL y su corrección con batching

La petición pide 100 libros, cada uno con su autor y sus reseñas:

```graphql
query Shelf($limit: Int!) { books(limit: $limit) { id title author { name } reviews { rating } } }
```

| Endpoint | Sentencias SQL | Media (ms) | Desv. estándar (ms) |
| --- | ---: | ---: | ---: |
| `/graphql-naive` | 201 | 31.666 | 6.986 |
| `/graphql` | 3 | 7.579 | 5.966 |

Los resolvers ingenuos buscan un autor y una lista de reseñas **por cada libro**: 1 + 100 + 100 = 201 sentencias. Con el loader de batching de [ts/src/loader.ts](ts/src/loader.ts), cada resolver solo registra una clave, y un `WHERE id = ANY(...)` por relación responde a todas: 1 + 1 + 1 = 3 sentencias, con la misma respuesta. El servidor informa el conteo en la cabecera de respuesta `x-db-queries`, y una prueba verifica ambos números.

## Temas del quiz que demuestra

Área `protocols`:

- `rest`: recursos y métodos, códigos de estado de las operaciones CRUD, over-fetching y under-fetching
- `graphql`: selección de campos, endpoint único, errores en el cuerpo, el problema N+1 y el batching
- `json-rpc-grpc`: petición, respuesta, objeto de error, notificación y lote de JSON-RPC 2.0
- `http-semantics`: 201 con `Location`, 404, 422

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-rest-graphql-jsonrpc.sh        # Linux y macOS
./setup-windows-rest-graphql-jsonrpc.ps1    # Windows
```

El script construye la imagen, inicia un PostgreSQL local en una red interna, ejecuta el typecheck y las pruebas, y elimina los contenedores.

## Benchmark (la demo)

```sh
docker compose run --rm bench && docker compose down -v
```

Imprime las dos tablas de arriba y escribe `results/results.md` y `results/results.json`. `BENCH_ITERATIONS` (por defecto 300) y `BENCH_ROUNDS` (por defecto 3) cambian el tamaño de la ejecución.

## Pruebas

```sh
docker compose run --rm ts-test && docker compose down -v
```

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/behaviour.test.ts` | una suite de comportamiento (9 pruebas) pasa contra los tres estilos |
| `ts/tests/styles.test.ts` | códigos de estado en REST, `errors` en GraphQL, códigos de error, notificación y lote en JSON-RPC, N+1 con 201 sentencias frente a 3, peticiones por lectura anidada |
| `ts/tests/unit.test.ts` | el loader de batching, las estadísticas, la semilla determinista |

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/domain.ts` | las reglas del dominio y el SQL, compartidos por los tres estilos |
| `ts/src/rest.ts`, `ts/src/graphql.ts`, `ts/src/jsonrpc.ts` | un adaptador por estilo |
| `ts/src/loader.ts` | el loader de batching que corrige el N+1 |
| `ts/src/clients.ts` | tres clientes detrás de una misma interfaz, con un medidor de peticiones y bytes |
| `ts/src/bench.ts` | el benchmark |
| `ts/sql/schema.sql`, `ts/src/seed.ts` | tablas y datos deterministas (25 autores, 120 libros, 360 reseñas) |

Todo es local: los servicios corren en una red interna de docker-compose, no se publica ningún puerto en el host, y la contraseña de la base de datos es un valor de laboratorio obviamente falso.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| PostgreSQL | 18.6 (`postgres:18.6-alpine`) |
| ElysiaJS | 1.4.30 |
| graphql (graphql-js) | 17.0.2 |
| pg | 8.23.1 |
| Zod | 4.6.5 |

**Por qué `graphql`.** Es graphql-js, la implementación de referencia de la especificación, mantenida por la GraphQL Foundation, y el motor sobre el que se construyen los servidores populares (Apollo Server, GraphQL Yoga). Corre en Bun sin adaptador y no necesita ningún plugin para quedar detrás de una ruta `POST` de ElysiaJS, lo que mantiene visible la parte HTTP: el handler son una docena de líneas en `ts/src/graphql.ts`. El loader de batching está escrito a mano en lugar de añadir el paquete `dataloader`, porque el mecanismo es la lección.
