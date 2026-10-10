# Protocolos

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Los protocolos de aplicación son los acuerdos que permiten que programas escritos por personas distintas se comuniquen entre sí. Esta área sigue HTTP desde su semántica (métodos, códigos de estado, cabeceras, caché, cookies) pasando por sus tres formatos en la red (HTTP/1.1, HTTP/2 y HTTP/3 sobre QUIC), el handshake TLS que hay debajo, y los estilos de API construidos encima: REST, GraphQL, JSON-RPC, gRPC, WebSocket y server-sent events.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| REST, GraphQL y JSON-RPC (`rest-graphql-jsonrpc`) | Qué cuesta y qué ofrece cada estilo de API sobre el mismo dominio | planificado |
| HTTP/1.1, HTTP/2 y HTTP/3 (`http-versions`) | Qué cambian la multiplexación y QUIC en una página con muchos recursos | planificado |
| Servidor HTTP sobre TCP puro (`http-server-raw-tcp`) | Qué hay dentro de una petición y una respuesta HTTP | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/protocols/`).
- Documentación: planificada (`docs/es/protocols/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Cada enlace se comprobó cuando se escribió la lista.

### Empieza aquí

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Gratis. El mejor punto de partida: visión general, mensajes, métodos, códigos de estado, cabeceras, caché, cookies y CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. En portugués. Gratis. La traducción al portugués de Brasil de las guías y la referencia de HTTP de MDN.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Gratis. Un libro corto y gratuito del autor de curl sobre por qué existe QUIC y cómo funciona HTTP/3.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Gratis. Cada byte de un handshake TLS 1.3 real, anotado y explicado.

### Libros

- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratis en línea, de pago en papel. Gratis en línea: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket y server-sent events desde el lado del rendimiento.
- [http2 explained](https://http2-explained.haxx.se/), Daniel Stenberg. Gratis. Un libro corto y gratuito sobre streams, multiplexación, compresión de cabeceras y lo que HTTP/2 corrigió.
- [Everything curl](https://everything.curl.dev/), Daniel Stenberg. Gratis. Un libro gratuito sobre curl que sirve además como recorrido práctico por HTTP, TLS y proxies.

### Artículos y especificaciones

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham y Reschke, IETF. Gratis. La definición vigente de métodos, códigos de estado, cabeceras y negociación de contenido para todas las versiones de HTTP.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson y Benfield, IETF. Gratis. Frames, streams, control de flujo y compresión de cabeceras en HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Gratis. Cómo se mapea la semántica de HTTP sobre los streams de QUIC.
- [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000), Iyengar y Thomson, IETF. Gratis. El protocolo de transporte bajo HTTP/3: conexiones, streams, recuperación de pérdidas y migración sobre UDP.
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112), Fielding, Nottingham y Reschke, IETF. Gratis. El formato de mensaje en texto que hay que seguir al escribir un servidor HTTP a mano.
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446), Eric Rescorla, IETF. Gratis. La especificación del handshake, el key schedule y el record protocol.
- [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455), Fette y Melnikov, IETF. Gratis. El handshake de upgrade y el formato de frames de WebSocket.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Gratis. La tesis doctoral que definió REST y sus restricciones.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Gratis. La definición oficial del sistema de tipos, las consultas, la validación y la ejecución.
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification), JSON-RPC Working Group. Gratis. Una especificación de dos páginas sobre peticiones, respuestas, notificaciones, lotes y códigos de error.

### Documentación oficial

- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Gratis. La introducción oficial a esquemas, consultas, mutaciones y buenas prácticas.
- [gRPC: Core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/), gRPC Authors. Gratis. Definiciones de servicio, los cuatro tipos de llamadas, deadlines y metadatos.
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), Mozilla. Gratis. Cómo funciona el formato del flujo de eventos y cuándo es más simple que WebSocket.
- [Caddy documentation](https://caddyserver.com/docs/), Caddy project. Gratis. El servidor usado en los mini-projects, con HTTPS automático y HTTP/3 activados por defecto.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratis. Videos detallados que comparan las versiones de HTTP, TLS, WebSocket, gRPC y sus compromisos.

### Práctica y herramientas

- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html), Martin Fowler. Gratis. Explica los pasos desde las llamadas a procedimientos remotos sobre HTTP hasta recursos, verbos e hipermedia.

### Comunidades

- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Gratis. Respuestas canónicas sobre códigos de estado, cabeceras, caché y CORS.
- [HTTP Working Group](https://github.com/httpwg), IETF. Gratis. Donde las especificaciones de HTTP se escriben y se discuten abiertamente.
