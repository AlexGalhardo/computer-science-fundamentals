# REST, GraphQL y JSON-RPC (MP-PROTO-1)

> English version: [docs/en/protocols/rest-graphql-jsonrpc.md](../../en/protocols/rest-graphql-jsonrpc.md) · Versão em português: [docs/pt/protocols/rest-graphql-jsonrpc.md](../../pt/protocols/rest-graphql-jsonrpc.md)

Miniproyecto: [`projects/protocols/rest-graphql-jsonrpc`](../../../projects/protocols/rest-graphql-jsonrpc/README.es.md). Temas del quiz: `rest`, `graphql`, `json-rpc-grpc`, `http-semantics`.

## La pregunta

Una API es una forma de pedirle algo a un servidor. Los tres estilos responden de manera distinta a tres preguntas: **qué nombra el cliente** (un recurso, un conjunto de campos, un procedimiento), **quién decide la forma de la respuesta** y **dónde se informa el resultado**. El miniproyecto expone un dominio (autores, libros, reseñas) a través de los tres, con las reglas del dominio escritas una sola vez en `ts/src/domain.ts`, de modo que todo lo que difiere es el estilo.

## Los tres estilos lado a lado

| | REST | GraphQL | JSON-RPC 2.0 |
| --- | --- | --- | --- |
| El cliente nombra | un recurso, por URL | los campos que quiere, en una consulta | un procedimiento, por nombre |
| Endpoints | una URL por recurso | uno (`/graphql`) | uno (`/rpc`) |
| La operación está en | el método HTTP | el texto de la consulta (`query`, `mutation`) | `"method"` en el cuerpo |
| Forma de la respuesta decidida por | el servidor | el cliente | el servidor |
| Resultado informado en | el código de estado HTTP | `data` y `errors` en el cuerpo | `result` o `error` en el cuerpo |
| Contrato | convención (u OpenAPI) | el esquema tipado, obligatorio | convención |
| Caché HTTP de lecturas | funciona: `GET` sobre una URL | difícil: `POST` a una URL | difícil: `POST` a una URL |

### REST

La URL es un sustantivo (`/rest/books/7`), el método es el verbo y el código de estado es el resultado: `200` para una lectura, `201` con una cabecera `Location` para una creación, `404` para un recurso que no existe, `422` para un contenido que rompe una regla. Como el significado está en partes estándar de HTTP, el software genérico lo entiende: una caché puede almacenar un `GET`, un proxy puede reintentar un `PUT` idempotente y una herramienta de monitoreo puede contar los `5xx` sin leer ningún cuerpo.

El precio es que el servidor fija la representación. `GET /rest/books` devuelve libros completos cuando la pantalla quería dos campos (**over-fetching**), y un libro con su autor y sus reseñas requiere tres peticiones (**under-fetching**).

### GraphQL

Hay un endpoint y un esquema tipado. El cliente envía una consulta que lista los campos que quiere, siguiendo las relaciones tan profundo como necesite, y la respuesta tiene exactamente esa forma. Una petición reemplaza a las tres de REST, y la lista lleva solo los dos campos.

El precio se paga en el servidor y en la maquinaria HTTP. Cada petición es un `POST` a la misma URL, así que la caché HTTP simple no aplica, y por la convención habitual el estado es `200` incluso cuando la operación falló: el cliente debe leer `errors`. Y el servidor ejecuta la consulta campo por campo, lo que lleva al N+1 (más abajo).

### JSON-RPC 2.0

El cuerpo nombra un procedimiento y sus parámetros, y la respuesta trae `result` **o** `error`, nunca ambos, con el `id` de la petición repetido para poder emparejarlos. Una petición sin `id` es una **notificación**, que no recibe respuesta alguna, ni siquiera un error. Un arreglo de peticiones es un **lote** (batch): un solo viaje HTTP de ida y vuelta, respuestas en cualquier orden, emparejadas por `id`.

Es el más simple de implementar de los tres (toda la API es una tabla de nombres y funciones en `ts/src/jsonrpc.ts`) y no depende de HTTP en absoluto. El precio es que nada genérico puede distinguir una lectura segura de una escritura, y que un lote solo ahorra viajes entre llamadas que no dependen unas de otras: el autor de un libro no se puede pedir en el mismo lote que el libro, porque su id está en la respuesta del libro.

Los códigos de error predefinidos son `-32700` (el cuerpo no es JSON), `-32600` (no es un objeto de petición válido), `-32601` (método desconocido), `-32602` (parámetros inválidos) y `-32603` (error interno). El rango de `-32000` a `-32099` se deja para el servidor, y el miniproyecto usa `-32004` para "no encontrado".

## Una suite de comportamiento, tres estilos

`ts/src/clients.ts` tiene tres clientes detrás de una interfaz (`listTitles`, `getCard`, `getPage`, `addReview`). `ts/tests/behaviour.test.ts` ejecuta las mismas nueve pruebas contra cada uno: lecturas, un libro inexistente, una escritura, una escritura en un libro inexistente, una calificación inválida. Cada cliente traduce el vocabulario de fallos de su estilo de vuelta a los mismos dos tipos, "no encontrado" e "inválido":

| Error de dominio | REST | GraphQL | JSON-RPC |
| --- | --- | --- | --- |
| no encontrado | estado `404` | `extensions.code: "NOT_FOUND"` | código de error `-32004` |
| inválido | estado `422` | `extensions.code: "BAD_USER_INPUT"` | código de error `-32602` |

## El problema N+1

Un servidor GraphQL responde una consulta llamando a una función, un **resolver**, por campo. Para `books { author { name } }`, el resolver de `author` se ejecuta una vez por libro. Si ejecuta `SELECT ... WHERE id = $1`, una lista de 100 libros envía 1 sentencia para la lista y 100 para los autores. Si además se piden las reseñas, son 201. Cada sentencia es rápida. La suma no lo es, y crece con el tamaño de la lista.

La corrección es el **batching**. El resolver no consulta: le pide una clave a un loader y obtiene una promesa. El loader reúne todas las claves pedidas durante el turno actual del event loop y luego envía una sola sentencia para todas, `WHERE id = ANY(...)`. El miniproyecto escribe este loader a mano en unas 40 líneas (`ts/src/loader.ts`), que es la idea detrás de la biblioteca DataLoader. Dos detalles importan:

- El loader espera con `setImmediate`, que se ejecuta después de que el ejecutor haya llamado a los resolvers de todos los elementos de la lista, así que se reúnen todas las claves.
- Un loader vive durante **una petición**. Su caché evita claves repetidas dentro de la petición y no debe filtrar filas entre clientes.

El servidor cuenta sus sentencias SQL por petición y devuelve el conteo en la cabecera `x-db-queries`. La prueba verifica 201 sentencias en `/graphql-naive` y 3 en `/graphql`, con la misma respuesta.

## Leyendo las tablas

Los números versionados están en el [README](../../../projects/protocols/rest-graphql-jsonrpc/README.es.md#latencia-y-tamaño-de-la-respuesta-por-estilo) y en `results/results.md`.

- Tamaño de la carga: la lista es unas 9 veces menor en GraphQL (3,0 kB frente a 27,6 kB), y la lectura anidada unas 6 veces menor.
- Viajes de ida y vuelta de la lectura anidada: REST 3, JSON-RPC 2, GraphQL 1.
- Latencia: en loopback un viaje de ida y vuelta cuesta una fracción de milisegundo, así que los estilos están dentro de la desviación estándar unos de otros en las lecturas de lista y anidada, y GraphQL es el más lento en la lectura pequeña de detalle, porque analiza y valida la consulta en cada llamada. El beneficio de un solo viaje de ida y vuelta aparece en una red real, donde cada uno cuesta decenas de milisegundos. El benchmark no simula eso, y lo dice.
- N+1: 201 sentencias frente a 3, y unas 4 veces más lento en esta ejecución, con la base de datos en la misma máquina.

El runner de benchmarks del repositorio (`bun run bench`, hyperfine) inicia contenedores sin red, así que no sirve para un benchmark que necesita una base de datos. Este mide en el mismo proceso, con el calentamiento descartado, varias rondas, la dispersión informada, y la máquina, las versiones y el comando registrados.

## Cuál elegir

- **REST** cuando la API es pública o de larga vida, los datos se mapean a recursos, y la caché HTTP y las herramientas estándar importan.
- **GraphQL** cuando muchas pantallas distintas leen los mismos datos conectados y cada una necesita un recorte diferente, y el equipo puede pagar el cuidado del lado del servidor (batching, límites de profundidad y de complejidad).
- **JSON-RPC** para acciones que no son recursos (`reports.rebuild`), para servicios internos y para transportes que no son HTTP.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-PROTO-1.1 el mismo dominio a través de los tres estilos | `ts/tests/behaviour.test.ts`: una suite de 9 pruebas, ejecutada con `describe.each` contra REST, GraphQL y JSON-RPC |
| MP-PROTO-1.2 N+1 y su corrección con batching | `ts/tests/styles.test.ts`, "the N+1 problem": 201 sentencias en `/graphql-naive`, 3 en `/graphql` |
| MP-PROTO-1.3 tabla de latencia y tamaño de la carga | `docker compose run --rm bench` escribe `results/results.md`: una fila por estilo para una lista, un detalle y una lectura anidada |

## Cómo ejecutarlo

```sh
cd projects/protocols/rest-graphql-jsonrpc
./setup-unix-rest-graphql-jsonrpc.sh        # or ./setup-windows-rest-graphql-jsonrpc.ps1
docker compose run --rm bench && docker compose down -v
```
