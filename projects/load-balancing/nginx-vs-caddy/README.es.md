# nginx-vs-caddy

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Tres instancias idénticas de una API detrás de dos balanceadores de carga, NGINX y Caddy, configurados lado a lado. El laboratorio envía el mismo tráfico por ambos y responde dos preguntas con números:

1. **¿Cómo reparte las solicitudes cada algoritmo de balanceo?** Round robin, round robin ponderado, menos conexiones y hash de IP, cada uno comparado con la parte que promete.
2. **¿Qué pasa cuando una instancia falla durante la carga?** Cuántas solicitudes se pierden, cuánto tiempo lo notan los clientes y cuánto tarda la instancia en volver a recibir tráfico, con la configuración por defecto de cada proxy y con una ajustada.

La explicación de los conceptos está en [docs/es/load-balancing/nginx-vs-caddy.md](../../../docs/es/load-balancing/nginx-vs-caddy.md).

> **Solo local.** El generador de carga se niega a ejecutarse cuando un destino no es `localhost` ni un servicio de este archivo docker-compose. Nunca apuntes una prueba de carga a un host que no sea tuyo.

## Temas del quiz que demuestra

- `load-balancing` / `balancing-algorithms`: round robin, pesos, menos conexiones con una instancia lenta, hash de IP
- `load-balancing` / `health-checks-and-failover`: verificaciones pasivas y activas, reintentos, un crash frente a un congelamiento
- `load-balancing` / `sticky-sessions`: afinidad por dirección de cliente y sus límites
- `load-balancing` / `nginx-configuration`: `upstream`, `weight`, `least_conn`, `ip_hash`, `max_fails`, `fail_timeout`, `proxy_next_upstream`, `proxy_pass`
- `load-balancing` / `caddy-configuration`: `reverse_proxy`, `lb_policy`, `lb_try_duration`, `health_uri`, `fail_duration`
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: `X-Forwarded-For` y en qué proxies confiar
- `load-balancing` / `layer-4-vs-layer-7`: enrutamiento por ruta de URL

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-nginx-vs-caddy.sh        # Linux y macOS
./setup-windows-nginx-vs-caddy.ps1    # Windows
```

El script construye la imagen, ejecuta las pruebas unitarias, verifica ambas configuraciones de proxy, levanta ambas pilas, ejecuta las pruebas de integración a través de ellas, comprueba que el generador de carga rechaza un destino que no es local y lo elimina todo. Tarda unos dos minutos.

## Las dos pilas

Un solo comando levanta las tres instancias y ambos proxies, cada uno en su propio puerto local:

```sh
docker compose up -d --wait nginx caddy
curl -i http://127.0.0.1:18480/rr    # NGINX
curl -i http://127.0.0.1:18481/rr    # Caddy
docker compose --profile lab down -v # detiene y elimina todo
```

Repite el `curl` y observa cómo cambia el encabezado `X-Instance`. Define `NGINX_PORT` o `CADDY_PORT` antes del primer comando para usar otros puertos. Ambos puertos están asociados solo a `127.0.0.1`.

Ambos proxies publican las mismas rutas, y cada ruta reenvía a `GET /work` de una instancia:

| Ruta | NGINX (`nginx/nginx.conf`) | Caddy (`caddy/Caddyfile`) |
| --- | --- | --- |
| `/rr` | `upstream` sin directiva de método | `lb_policy round_robin` |
| `/wrr` | `weight=3`, `weight=2`, `weight=1` | `lb_policy weighted_round_robin 3 2 1` |
| `/lc` | `least_conn` | `lb_policy least_conn` |
| `/iphash` | `ip_hash` | `lb_policy client_ip_hash` |
| `/tuned` | `max_fails=1 fail_timeout=3s`, timeouts de 1 s, `proxy_next_upstream` | `lb_try_duration`, `fail_duration`, `health_uri`, timeouts de 1 s |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `nginx/nginx.conf`, `caddy/Caddyfile` | Las dos configuraciones, con las mismas rutas. Léelas lado a lado |
| `ts/src/api/` | La instancia: `GET /work`, `GET /health`, `GET /stats`, y rutas de control que la vuelven lenta, la hacen caer o la congelan |
| `ts/src/lab/load.ts` | Dos generadores de carga: lazo cerrado (concurrencia fija) y lazo abierto (ritmo fijo) |
| `ts/src/lab/analysis.ts` | Funciones puras: partes, partes esperadas, tolerancia, tiempo de recuperación |
| `ts/src/lab/experiments.ts` | Los experimentos: qué se envía y qué se espera antes de medir |
| `ts/src/lab/target.ts`, `config.ts` | La regla que rechaza destinos que no son locales |
| `ts/src/cli.ts` | Ejecuta los experimentos y escribe `results/` |
| `ts/tests/`, `ts/integration/` | Pruebas unitarias (sin red) y pruebas de integración (a través de ambos proxies) |

Las rutas de control de las instancias (`/control/...`) solo son alcanzables en la red interna de docker. Los proxies no reenvían nada más que las rutas de la tabla.

## Pruebas

```sh
docker compose run --rm ts-test             # verificación de tipos y 22 pruebas unitarias, sin red
docker compose run --rm caddy-config-test   # caddy validate y caddy fmt
docker compose run --rm nginx-config-test   # nginx -t
docker compose run --rm lab-test            # 17 pruebas de integración a través de ambos proxies
docker compose run --rm refusal-test        # el laboratorio debe rechazar https://example.com
docker compose --profile lab down -v
```

| Qué se prueba | Dónde |
| --- | --- |
| Cada algoritmo se mantiene a menos de 5 puntos porcentuales de sus partes esperadas, en ambos proxies | `ts/integration/proxies.test.ts` |
| Hash de IP: 500 de 500 clientes simulados siempre llegan a la misma instancia, y NGINX envía una red /24 entera a una sola instancia | el mismo archivo |
| Una instancia caída: los valores por defecto de NGINX no pierden nada, los de Caddy pierden cerca de una solicitud de cada tres, ambas configuraciones ajustadas no pierden nada | el mismo archivo |
| Una instancia congelada: ambas configuraciones ajustadas no pierden nada | el mismo archivo |
| Las rutas de control no son alcanzables a través de los proxies | el mismo archivo |
| Partes, tolerancia, fijación, tiempo de recuperación, mediana y dispersión | `ts/tests/analysis.test.ts` |
| La instancia: rutas, validación de la entrada de control, lenta, crash y congelamiento, sin socket | `ts/tests/app.test.ts` |
| La regla de destino local acepta loopback y nombres de servicio y rechaza imitaciones como `http://localhost@example.com` | `ts/tests/target.test.ts` |
| El laboratorio termina con error y no envía nada cuando un destino no es local | `ts/scripts/refusal-test.sh` |

Linter y formateador: Biome con la configuración de la raíz del repositorio, y `caddy fmt` para el Caddyfile.

```sh
bunx biome check projects/load-balancing/nginx-vs-caddy
```

## Experimentos

```sh
docker compose --profile lab run --rm lab    # unos seis minutos, escribe results/
docker compose --profile lab down -v
```

Escribe [results/distribution.md](results/distribution.md) y [results/failure.md](results/failure.md), con la máquina, las versiones de las imágenes y el método. Define `REPETITIONS` para cambiar el número de ejecuciones de cada caso (3 por defecto).

### Distribución

3000 solicitudes por ejecución, 30 en curso, tres ejecuciones por caso. Parte de cada instancia (mediana):

| Algoritmo | Esperado | NGINX | Caddy |
| --- | --- | --- | --- |
| Round robin | 33.3 / 33.3 / 33.3 | 33.3 / 33.3 / 33.3 | 33.3 / 33.3 / 33.3 |
| Round robin ponderado (3, 2, 1) | 50.0 / 33.3 / 16.7 | 50.0 / 33.3 / 16.7 | 50.0 / 33.3 / 16.7 |
| Menos conexiones, `api-3` cuatro veces más lenta | 44.4 / 44.4 / 11.1 | 44.0 / 43.9 / 12.0 | 43.9 / 43.9 / 12.3 |
| Hash de IP, 500 clientes | 33.3 / 33.3 / 33.3 | 33.4 / 33.2 / 33.4 | 31.4 / 33.2 / 35.4 |

Todos los casos están a menos de 5 puntos porcentuales de la parte esperada (el peor es de 2.1 puntos), que es el criterio de aceptación del mini-proyecto.

- El round robin es exacto: cuenta solicitudes y nada más.
- Menos conexiones es donde el algoritmo ve la carga. `api-3` responde en 40 ms y las otras en 10 ms. Con el mismo número de solicitudes en curso en cada una, una instancia termina solicitudes a un ritmo proporcional a 1/tiempo, así que las partes son 4 : 4 : 1 y la instancia lenta atiende cerca de un noveno. El round robin seguiría dándole un tercio.
- El hash de IP es fijo (500 de 500 clientes llegaron siempre a la misma instancia) y solo aproximadamente parejo: depende de cómo resulten las direcciones de los clientes al aplicarles el hash. Los números se repiten exactamente de una ejecución a otra porque el hash es determinista.

### Una instancia falla durante la carga

100 solicitudes por segundo durante 14 s. A los 2 s `api-3` falla durante 4 s. Tres ejecuciones por caso, se muestra la mediana:

| Falla | Proxy | Configuración | Errores | Lentas (más de 250 ms) | Tiempo de recuperación | De vuelta en rotación tras su regreso |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| crash | NGINX | por defecto | 0 | 0 | 0 ms | 6980 ms |
| crash | NGINX | ajustada | 0 | 0 | 0 ms | 3980 ms |
| crash | Caddy | por defecto | 133 | 0 | 4000 ms | 30 ms |
| crash | Caddy | ajustada | 0 | 0 | 0 ms | 691 ms |
| congelamiento | NGINX | por defecto | 33 | 92 | 3740 ms | 10 ms |
| congelamiento | NGINX | ajustada | 0 | 34 | 999 ms | 1900 ms |
| congelamiento | Caddy | por defecto | 34 | 92 | 3740 ms | 20 ms |
| congelamiento | Caddy | ajustada | 0 | 34 | 1007 ms | 1018 ms |

Lo que muestra la tabla:

- **Los valores por defecto difieren.** Cuando se rechaza una conexión, NGINX pasa la solicitud al siguiente servidor y omite el que falló durante 10 s (`proxy_next_upstream error timeout`, `max_fails=1`, `fail_timeout=10s`), así que un crash no cuesta nada. Caddy, con solo `lb_policy`, no tiene reintento ni verificación de salud: sigue eligiendo la instancia caída, y una solicitud de cada tres falla (133 de las 400 enviadas durante los 4 s) hasta que la instancia vuelve.
- **Un congelamiento es peor que un crash.** Una conexión rechazada es una respuesta inmediata. Un proceso congelado acepta la conexión y no dice nada, y solo un timeout lo revela. Con los timeouts por defecto (60 s en NGINX, ninguno en Caddy) ninguno de los dos proxies lo nota dentro de los 4 s: las solicitudes enviadas en el primer segundo las abandona el cliente a los 3 s, y el resto vuelve tarde.
- **Ajustar es timeouts más reintentos más verificaciones de salud.** Con timeouts de 1 s ambos proxies no pierden nada. Las 34 solicitudes lentas son las que encontraron la falla durante el primer segundo, y cada una esperó el timeout antes de repetirse en otra instancia.
- **Pasiva frente a activa.** El NGINX de código abierto solo tiene verificaciones pasivas: una solicitud real descubre la falla, y una solicitud real vuelve a probar el servidor después de `fail_timeout`. Por eso la instancia tarda segundos en volver a recibir tráfico. La verificación activa de Caddy pide `/health` cada segundo por su cuenta.
- **Sacar rápido y volver rápido son un intercambio.** Un proxy que nunca saca la instancia (Caddy por defecto) le envía tráfico en el instante en que vuelve, y también durante toda la falla.

Los conteos son idénticos o están a una solicitud de diferencia entre las tres ejecuciones, y los tiempos varían unos 10 ms, porque este experimento depende de timeouts y no de velocidad. La máquina se compartió con otras cargas de trabajo. Aquí no se mide el rendimiento.

### Qué significa "detenida" aquí

El criterio de aceptación dice "una instancia detenida durante la carga". La instancia se detiene a sí misma bajo comando (`POST /control/outage` en la red interna): en un crash cierra su socket de escucha y todas las conexiones abiertas, que es lo que ve un proxy cuando el proceso muere mientras el host sigue en pie. Esto mantiene el experimento dentro de un solo `docker compose run`, repetible y cronometrado al milisegundo, sin acceso al socket de Docker. Detener el contenedor (`docker compose stop api-3`) es un tercer caso, que aquí no se mide: la propia dirección puede dejar de responder, y entonces un intento de conexión espera el timeout de conexión en lugar de ser rechazado al instante.
