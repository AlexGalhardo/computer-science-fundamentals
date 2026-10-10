# Balanceo de carga

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un balanceador de carga reparte las solicitudes entre varios servidores para que un servicio aguante más tráfico que una sola máquina y sobreviva a la pérdida de una de ellas. El tema cubre dónde ocurre el balanceo (capa de transporte o de aplicación), cómo se elige un servidor (round robin, menos conexiones, hashing), cómo se detectan y evitan los servidores caídos, y los papeles relacionados de proxy inverso, terminación TLS y gateway de API.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| NGINX contra Caddy (`nginx-vs-caddy`) | Cómo los algoritmos de balanceo reparten las solicitudes y sobreviven a un nodo caído | planificado |
| Balanceador de carga L7 escrito a mano (`l7-load-balancer`) | Qué hace un balanceador de carga en cada solicitud | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/load-balancing/`).
- Documentación: planificada (`docs/es/load-balancing/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza por aquí

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Gratis. Un ensayo visual interactivo que muestra round robin, menos conexiones y su efecto en la latencia.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Gratis. Una definición corta y directa con los algoritmos comunes y la idea de los health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Gratis. La introducción oficial: un bloque upstream, los métodos de balanceo, los pesos y los health checks pasivos.

### Libros

- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Gratis. Cómo llega el tráfico a un centro de datos: DNS, IP virtuales y hashing consistente a nivel de red.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Gratis. Por qué las políticas simples fallan a escala, con subsetting y round robin ponderado.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. Los capítulos sobre replicación y particionamiento explican el enrutamiento de solicitudes y el rebalanceo.

### Artículos y especificaciones

- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Gratis. El artículo que introdujo el hashing consistente, para que agregar un servidor mueva pocas claves.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Gratis. Cómo se construye un balanceador de capa 4 con servidores comunes, con su propio hashing consistente.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratis. Por qué las solicitudes más lentas dominan los sistemas grandes y cómo el hedging y el balanceo de carga las reducen.
- [The Power of Two Random Choices: A Survey of Techniques and Results](https://www.eecs.harvard.edu/~michaelm/postscripts/handbook2001.pdf), Mitzenmacher, Richa and Sitaraman (2001). Gratis. Las matemáticas detrás de elegir el menos cargado de dos servidores al azar.
- [Implementing health checks](https://aws.amazon.com/builders-library/implementing-health-checks/), David Yanacek, Amazon Builders' Library. Gratis. Los tipos de health checks, qué detecta cada uno y cómo pueden causar caídas.

### Documentación oficial

- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Gratis. La referencia de cada directiva: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Gratis. Políticas de balanceo de carga, health checks activos y pasivos y reintentos en el Caddyfile.
- [HAProxy documentation](https://docs.haproxy.org/), HAProxy. Gratis. El manual del balanceador clásico de código abierto, para comparar opciones y vocabulario.
- [Envoy: Load balancing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overview), Envoy Project Authors. Gratis. Una descripción clara de los tipos de balanceador, la detección de valores atípicos, la conciencia de zona y los umbrales de pánico.
- [Go: httputil.ReverseProxy](https://pkg.go.dev/net/http/httputil#ReverseProxy), The Go Authors. Gratis. El bloque de la biblioteca estándar para escribir un proxy de capa 7 en Go.

### Videos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratis. Videos sobre balanceo de capa 4 frente a capa 7, proxies, NGINX y HAProxy.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratis. Videos animados cortos sobre algoritmos de balanceo, proxies inversos y gateways de API.

### Práctica y herramientas

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratis. La herramienta de pruebas de carga usada para atacar los balanceadores en los mini-proyectos, solo contra destinos locales.

### Comunidades

- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Gratis. Preguntas operativas respondidas por administradores de sistemas.
- [Caddy Community](https://caddy.community/), Caddy project. Gratis. El foro oficial, donde los mantenedores responden preguntas de configuración.
