# Limitación de tasa

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La limitación de tasa restringe cuántas solicitudes puede hacer un cliente en un período, para proteger un servicio de la sobrecarga, el abuso y el uso injusto. Los algoritmos (ventana fija, ventana deslizante, token bucket, leaky bucket) difieren en cómo tratan las ráfagas y en cuánto estado necesitan, y ejecutarlos en varios servidores plantea cuestiones de atomicidad. La otra mitad del tema es el cliente: el estado 429, los encabezados de reintento y el backoff.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Algoritmos de limitación de tasa (`rate-limiter`) | Cómo trata cada algoritmo las ráfagas | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/rate-limiting/`).
- Documentación: planificada (`docs/es/rate-limiting/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Gratis. Demostraciones interactivas de ventana fija, ventana deslizante y token bucket, lado a lado.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Gratis. Los cuatro tipos de limitador que ejecuta una API de pagos en producción, y por qué existe cada uno.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Gratis. Una definición breve y sencilla de la idea y de aquello contra lo que protege.

### Libros

- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Gratis. Límites por cliente, estrangulamiento del lado del cliente y degradación elegante en un servicio grande.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. De pago. La fuente del quiz sobre modelado de tráfico con el leaky bucket y el token bucket.

### Artículos y especificaciones

- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Gratis. La definición de 429 Too Many Requests y su uso con Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Gratis. El algoritmo, sus parámetros, la fórmula del tamaño de ráfaga y su relación con el leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Gratis. Simulaciones que muestran por qué los clientes que reintentan necesitan aleatoriedad, no solo esperas crecientes.
- [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/), IETF HTTPAPI Working Group. Gratis. El borrador de estándar para informar a los clientes de su cuota y de cuándo se reinicia.
- [Rate Limiting, Cells, and GCRA](https://brandur.org/rate-limiting), Brandur Leach. Gratis. Explica el generic cell rate algorithm, un leaky bucket que solo necesita una marca de tiempo por clave.
- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/), Julien Desgats, Cloudflare. Gratis. La aproximación del contador de ventana deslizante y su error medido a gran escala.
- [Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/), David Yanacek, Amazon Builders' Library. Gratis. Por qué un servidor debe rechazar el trabajo excedente pronto en lugar de volverse lento para todos.

### Documentación oficial

- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Gratis. La referencia del limitador leaky bucket de NGINX: rate, burst, nodelay y delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Gratis. La página del comando incluye los patrones clásicos de limitador y la carrera que deben evitar.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Gratis. Cómo volver atómica en el servidor la lógica de leer y luego escribir, la base de los limitadores distribuidos.
- [Rate limits for the GitHub REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), GitHub. Gratis. Una API pública real que explica los límites primarios y secundarios y sus encabezados de respuesta.
- [Go: golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate), The Go Authors. Gratis. Una pequeña implementación de token bucket que vale la pena leer por su interfaz.

### Videos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratis. Explicaciones animadas y breves de los algoritmos de limitación de tasa del libro System Design Interview.

### Práctica y herramientas

- [Rate Limiting with NGINX](https://blog.nginx.org/blog/rate-limiting-nginx), NGINX Community Blog. Gratis. Una configuración resuelta que muestra el efecto de burst y nodelay.

### Comunidades

- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Gratis. Preguntas respondidas sobre cómo implementar y configurar limitadores.
