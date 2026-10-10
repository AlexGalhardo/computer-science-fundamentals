# NGINX frente a Caddy

> English version: [docs/en/load-balancing/nginx-vs-caddy.md](../../en/load-balancing/nginx-vs-caddy.md) · Versão em português: [docs/pt/load-balancing/nginx-vs-caddy.md](../../pt/load-balancing/nginx-vs-caddy.md)

Mini-proyecto: [projects/load-balancing/nginx-vs-caddy](../../../projects/load-balancing/nginx-vs-caddy/README.es.md) (MP-LB-1). Lenguajes: archivos de configuración y TypeScript.

## El problema

Un servidor tiene un techo. Para superarlo ejecutas varias copias de la aplicación y pones al frente algo que decide, para cada solicitud, qué copia responde. Ese algo es un balanceador de carga, y dos decisiones lo definen:

- **¿Quién recibe la siguiente solicitud?** El algoritmo de balanceo.
- **¿Y si el elegido está caído?** Las verificaciones de salud y los reintentos.

NGINX y Caddy responden ambas preguntas, con palabras distintas y, más importante, con valores por defecto distintos. El mini-proyecto pone las mismas tres instancias detrás de ambos y mide.

## Los algoritmos

| Algoritmo | Qué mira | Promesa | Punto débil |
| --- | --- | --- | --- |
| Round robin | Un contador | Partes iguales | Ciego a la carga: una instancia lenta igual recibe su parte completa |
| Round robin ponderado | Un contador y un peso | Partes proporcionales a los pesos | Los pesos son una suposición hecha de antemano |
| Menos conexiones | Solicitudes en curso | La instancia más ocupada recibe menos | Necesita que los contadores se compartan entre todos los workers del balanceador |
| Hash de IP | La dirección del cliente | El mismo cliente llega a la misma instancia | Desparejo cuando muchos usuarios comparten una dirección, y NGINX aplica el hash solo a los tres primeros octetos de IPv4 |

### Por qué menos conexiones le da un noveno a una instancia lenta

El laboratorio hace que `api-3` responda en 40 ms y las otras en 10 ms, y mantiene 30 solicitudes en curso. Menos conexiones mantiene cerca de 10 en cada instancia. Una instancia con 10 solicitudes de 10 ms termina 1000 por segundo, y una con 10 solicitudes de 40 ms termina 250 por segundo:

```text
rate     = in flight / time per request
api-1    = 10 / 0.010 s = 1000 requests/s
api-2    = 10 / 0.010 s = 1000 requests/s
api-3    = 10 / 0.040 s =  250 requests/s
share of api-3 = 250 / 2250 = 1/9 = 11.1%
```

Medido: 12.0% en NGINX y 12.3% en Caddy. El round robin, bajo la misma carga, envía un tercio de las solicitudes a la instancia lenta, donde se acumulan.

### De dónde viene la dirección del cliente

El hash de IP necesita la dirección del cliente, y detrás de cualquier proxy la conexión TCP viene del proxy. La dirección viaja entonces en `X-Forwarded-For`, un encabezado que cualquier cliente también puede escribir. Ambas configuraciones dicen explícitamente en quién creen: `set_real_ip_from` en NGINX y `trusted_proxies` en Caddy. En el laboratorio es la red privada de docker-compose. En internet deben ser solo las direcciones de tus propios proxies; de lo contrario un cliente puede elegir su propia "dirección" y, con ella, su instancia.

## Cuando una instancia falla

Hay dos formas de descubrir que un back end está caído:

- **Verificación pasiva**: el balanceador observa las solicitudes reales. Una falla cuesta al menos una solicitud real, y tras un período de penalización se usa una solicitud real para volver a probar.
- **Verificación activa**: el balanceador envía su propia sonda a un intervalo fijo, haya tráfico o no.

Y está lo que se hace con la solicitud que encontró la falla: responder con un error, o **reintentarla** en otra instancia. Un reintento siempre es seguro cuando la conexión nunca se abrió. Después de enviada la solicitud, solo es seguro para solicitudes idempotentes como GET, porque un POST puede haberse ejecutado ya.

El laboratorio rompe `api-3` de dos formas:

| Falla | Qué ve el proxy | Qué la revela |
| --- | --- | --- |
| Crash | Conexión rechazada, de inmediato | El primer intento |
| Congelamiento | Conexión aceptada, sin respuesta | Solo un timeout |

Resultados, con 100 solicitudes por segundo y una falla de 4 s (tabla completa en [results/failure.md](../../../projects/load-balancing/nginx-vs-caddy/results/failure.md)):

| | NGINX por defecto | Caddy por defecto | Ambos, ajustados |
| --- | --- | --- | --- |
| Crash | 0 errores | 133 errores, mientras la instancia esté caída | 0 errores |
| Congelamiento | 33 errores, 92 lentas | 34 errores, 92 lentas | 0 errores, 34 lentas durante cerca de 1 s |

Las lecciones:

1. **Los valores por defecto son una decisión de diseño de cada producto.** NGINX reintenta en el siguiente servidor tras un error de conexión y omite el servidor que falló durante 10 s. Caddy no hace ninguna de las dos cosas hasta que se le pide (`lb_try_duration`, `fail_duration`, `health_uri`).
2. **Los timeouts son parte de la verificación de salud.** Con un timeout de 60 s un back end congelado retiene solicitudes durante 60 s. Nada más en la configuración importa hasta que el timeout es corto.
3. **El NGINX de código abierto no tiene verificación activa.** La directiva `health_check` pertenece a la versión comercial. Su verificación pasiva es el par `max_fails` y `fail_timeout`.
4. **NGINX resuelve los nombres de upstream una sola vez.** Si el contenedor de una instancia se recrea con otra dirección, NGINX conserva la antigua. El laboratorio se topó con esto mientras se escribía: después de recrear las instancias, los pesos 3, 2, 1 se estaban aplicando a las instancias equivocadas. El parámetro `resolve` con un `resolver` lo arregla.

## Las dos configuraciones lado a lado

| Idea | NGINX | Caddy |
| --- | --- | --- |
| Grupo de back ends | `upstream name { server ...; }` más `proxy_pass http://name;` | `reverse_proxy a b c` |
| Algoritmo por defecto | Round robin ponderado | `random` |
| Menos conexiones | `least_conn;` | `lb_policy least_conn` |
| Hash de la dirección del cliente | `ip_hash;` | `lb_policy client_ip_hash` |
| Verificación pasiva | `max_fails=1 fail_timeout=10s` (por defecto) | `fail_duration`, desactivada por defecto |
| Verificación activa | Solo en la versión comercial | `health_uri`, `health_interval` |
| Reintento | `proxy_next_upstream error timeout` (por defecto) | `lb_try_duration`, desactivado por defecto |
| Proxies de confianza | `set_real_ip_from`, `real_ip_header` | `trusted_proxies` |

## Solo destinos locales

El generador de carga es un pequeño programa en TypeScript, y sigue la misma regla que k6 en los otros mini-proyectos: cada destino se compara con una lista cerrada (loopback y los nombres de servicio del archivo compose) antes de la primera solicitud, una prueba demuestra que `https://example.com` se rechaza, y los back ends viven en una red docker marcada como `internal`.

## Quiz

Temas del área `load-balancing` que este mini-proyecto demuestra: `balancing-algorithms`, `health-checks-and-failover`, `sticky-sessions`, `nginx-configuration`, `caddy-configuration`, `reverse-proxy-load-balancer-api-gateway` y `layer-4-vs-layer-7`.
