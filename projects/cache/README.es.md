# Cache

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un caché guarda una copia de algo costoso de calcular o de obtener, para que la siguiente solicitud se atienda más rápido. Hay cachés en todos los niveles (navegador, CDN, aplicación, base de datos, CPU), y todos plantean las mismas preguntas: qué guardar, cuándo descartar, cómo saber que está desactualizado y qué ocurre cuando muchos clientes fallan a la vez. Equivocarse en esas respuestas cambia un sistema lento por uno incorrecto.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Estrategias de caché y stampede (`cache-strategies`) | Cómo se comportan los patrones de caché y cómo fallan | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/cache/`).
- Documentación: planificada (`docs/es/cache/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Gratuito. La guía más clara sobre cachés privados y compartidos, frescura, validación y las directivas de Cache-Control.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Gratuito. Visión general corta de carga diferida (lazy loading), write-through, tiempo de vida y descarte.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Gratuito. El patrón de aplicación más común, descrito con sus problemas de consistencia y cuándo usarlo.
- [Caching Tutorial for Web Authors and Webmasters](https://mnot.net/cache_docs/), Mark Nottingham. Gratuito. Tutorial clásico y directo sobre cómo los cachés de navegador y de proxy deciden qué guardar y servir.

### Libros

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. Trata los cachés como datos derivados y explica los problemas de consistencia de mantener dos copias.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. De pago. El capítulo sobre la jerarquía de memoria explica la localidad y cómo funcionan los cachés de CPU.

### Artículos y especificaciones

- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Gratuito. La especificación de frescura, validación, invalidación y de cada directiva de caché.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Gratuito. Cómo una capa de caché muy grande maneja escrituras obsoletas, manadas (thundering herds) y consistencia entre regiones.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Gratuito. El artículo detrás de la expiración anticipada probabilística, una solución simple para el stampede.
- [RFC 5861: HTTP Cache-Control Extensions for Stale Content](https://www.rfc-editor.org/rfc/rfc5861), Mark Nottingham, IETF. Gratuito. La definición de stale-while-revalidate y stale-if-error.
- [TinyLFU: A Highly Efficient Cache Admission Policy](https://arxiv.org/abs/1512.00727), Einziger, Friedman and Manes (2015). Gratuito. Un diseño moderno de descarte que combina frecuencia y recencia, usado en la biblioteca Caffeine.
- [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/), Matt Brinkley and Jas Chhabra, Amazon Builders' Library. Gratuito. Consejos ganados a golpes sobre cuándo vale la pena un caché y cómo se convierte en fuente de caídas.

### Documentación oficial

- [Redis documentation](https://redis.io/docs/latest/), Redis. Gratuito. La referencia oficial de tipos de datos, comandos, expiración y caché en el cliente.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Gratuito. Cómo funcionan las políticas de maxmemory y cómo Redis aproxima LRU y LFU.
- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), Redis. Gratuito. Los pros y contras entre los snapshots (RDB) y el archivo de solo anexado (AOF).
- [NGINX Content Caching](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/), F5 NGINX. Gratuito. Cómo se configura el caché de un proxy inverso, incluido el bloqueo de caché contra stampedes.
- [Cloudflare Cache documentation](https://developers.cloudflare.com/cache/), Cloudflare. Gratuito. Cómo una CDN decide qué guardar en caché, por cuánto tiempo y cómo funciona la purga.

### Videos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Videos cortos y animados sobre estrategias de caché, descarte y los modos clásicos de falla de un caché.

### Práctica y herramientas

- [Caffeine: Efficiency](https://github.com/ben-manes/caffeine/wiki/Efficiency), Ben Manes. Gratuito. Comparaciones de la tasa de aciertos de políticas de descarte sobre trazas reales.
- [REDbot](https://redbot.org/), Mark Nottingham. Gratuito. Verifica los encabezados de caché de una URL tuya y explica qué harán los cachés con ellos.

### Comunidades

- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Gratuito. Preguntas respondidas sobre invalidación, encabezados y diseño de caché.
- [r/redis](https://www.reddit.com/r/redis/), Reddit. Gratuito. Dudas de la comunidad sobre el uso y la operación de Redis.
