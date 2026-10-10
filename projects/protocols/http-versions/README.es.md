# http-versions

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una página con **200 imágenes pequeñas**, servida por el mismo Caddy sobre **HTTP/1.1, HTTP/2 y HTTP/3**, y cargada por un Chromium real. El miniproyecto enseña qué cambian la multiplexación y QUIC en una página con muchos recursos: cómo se negocia el protocolo, por qué HTTP/1.1 sufre en cuanto la red tiene latencia, cómo se ve una sola conexión que transporta todas las peticiones y qué le hace la pérdida de paquetes a cada versión.

Explicación de los conceptos: [docs/es/protocols/http-versions.md](../../../docs/es/protocols/http-versions.md).

## El laboratorio

| Puerto | Condición de red | Versión más alta ofrecida | Negociado por el navegador |
| ---: | --- | --- | --- |
| 8001, 8002, 8003 | sin modelado | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8101, 8102, 8103 | latencia: `netem delay 50ms` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8201, 8202, 8203 | latencia y pérdida: `netem delay 50ms loss 2%` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |

- Los nueve puertos usan TLS, con un certificado de la **autoridad certificadora interna de Caddy**, creada dentro del contenedor. Sin CA pública y sin dominio público.
- El nombre de host es `site.http-versions.test`, un alias en la red interna de docker-compose. `.test` es un dominio de nivel superior reservado.
- La latencia y la pérdida se inyectan con `tc netem` en los paquetes salientes del contenedor de Caddy, separados por puerto de origen ([caddy/entrypoint.sh](caddy/entrypoint.sh)). Ese contenedor es el único con la capability `NET_ADMIN`.
- No se publica nada en el host y ningún contenedor llega a internet (`internal: true`).

## Tiempo total de carga por protocolo y condición

Medido con `docker compose run --rm bench` (máquina y método en [results/results.md](results/results.md)): 10 cargas en frío por puerto, cada una en un contexto de navegador nuevo (caché vacía, conexión nueva), con los puertos intercalados.

| Condición | Protocolo | Puerto | Media (ms) | Desv. estándar (ms) | Mediana (ms) | Mín (ms) | Máx (ms) | Apertura de la conexión (ms) | Mitad de las imágenes (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sin modelado | HTTP/1.1 | 8001 | 598 | 149 | 561 | 395 | 915 | 2 | 359 |
| sin modelado | HTTP/2 | 8002 | 605 | 214 | 533 | 455 | 1175 | 2 | 405 |
| sin modelado | HTTP/3 | 8003 | 926 | 365 | 786 | 536 | 1585 | 2 | 775 |
| latencia (`netem delay 50ms`) | HTTP/1.1 | 8101 | 2455 | 191 | 2453 | 2211 | 2811 | 102 | 1351 |
| latencia (`netem delay 50ms`) | HTTP/2 | 8102 | 742 | 78 | 752 | 615 | 847 | 102 | 533 |
| latencia (`netem delay 50ms`) | HTTP/3 | 8103 | 735 | 73 | 721 | 642 | 877 | 52 | 518 |
| latencia y pérdida (`netem delay 50ms loss 2%`) | HTTP/1.1 | 8201 | 2539 | 191 | 2470 | 2294 | 2846 | 127 | 1385 |
| latencia y pérdida (`netem delay 50ms loss 2%`) | HTTP/2 | 8202 | 1024 | 333 | 987 | 675 | 1567 | 102 | 645 |
| latencia y pérdida (`netem delay 50ms loss 2%`) | HTTP/3 | 8203 | 1159 | 484 | 1009 | 678 | 2041 | 53 | 732 |

Cómo leerlo:

- **Sin latencia, la versión casi no importa.** Un viaje de ida y vuelta cuesta casi nada, así que seis conexiones que se turnan rinden igual que una conexión multiplexada. La mayor parte de los 0,4 a 0,6 s es trabajo propio del navegador (decodificar y maquetar 200 imágenes en un Chromium headless dentro de un contenedor), no de la red. HTTP/3 es el más lento aquí: QUIC corre en espacio de usuario, tanto en el navegador como en Caddy, y cuesta más CPU por paquete que TCP en el kernel. Las diferencias entre HTTP/1.1 y HTTP/2 caen dentro de la desviación estándar.
- **Con 50 ms de latencia, HTTP/1.1 tarda unas 3,3 veces más** (2455 ms frente a 742 ms). El navegador abre seis conexiones por origen y cada una lleva una petición a la vez, así que 200 imágenes necesitan unas 34 rondas, y cada ronda cuesta un viaje de ida y vuelta: 34 x 50 ms son unos 1,7 s adicionales al resto. HTTP/2 y HTTP/3 envían las 200 peticiones a la vez en una sola conexión.
- **La apertura de la conexión muestra el handshake de QUIC.** TCP y luego TLS 1.3 necesitan dos viajes de ida y vuelta antes de la primera petición (unos 102 ms); QUIC hace transporte y TLS juntos en uno (unos 52 ms).
- **Con 2% de pérdida, HTTP/3 no fue más rápido que HTTP/2 en esta ejecución.** Las dos medias (1024 y 1159 ms) difieren en menos que sus desviaciones estándar (333 y 484 ms), así que esta ejecución no muestra diferencia. Mira los límites de abajo antes de concluir algo sobre el head-of-line blocking.

### Límites de esta medición

- La pérdida inyectada es aleatoria e independiente por paquete, solo en la dirección servidor-cliente, y la página es pequeña (unos 400 kB). Cada carga ve solo un puñado de paquetes perdidos, por eso la dispersión bajo pérdida es grande.
- El "tiempo total de carga" es la peor métrica para ver la ventaja de QUIC. QUIC elimina el head-of-line blocking **entre streams**: un paquete perdido retrasa solo la imagen a la que pertenece, mientras que sobre TCP retrasa todo lo que viene detrás. Pero el evento load espera a la **última** imagen, y esa espera su retransmisión en ambos protocolos.
- TCP aquí es la implementación del kernel de Linux y QUIC son dos implementaciones en espacio de usuario (Chromium y el quic-go de Caddy), con ajustes distintos de recuperación de pérdidas. La tabla compara esas implementaciones en esta máquina, no los protocolos en abstracto.
- Una máquina compartida con otras cargas de trabajo, 10 cargas por celda. Esto no es un ranking.

## Cascadas

Abre [dashboard/index.html](dashboard/index.html) en un navegador (desde el disco, sin servidor). Dibuja las tres cascadas (waterfalls) de la condición elegida a partir del `results/results.js` versionado: una barra por imagen, sobre el mismo eje de tiempo. Con latencia, HTTP/1.1 es un triángulo ancho cuyos escalones son grupos de seis imágenes, y HTTP/2 y HTTP/3 son bloques estrechos.

## Temas del quiz que demuestra

Área `protocols`:

- `http2`: multiplexación, el límite de conexiones por origen de HTTP/1.1, negociación con ALPN, head-of-line blocking de TCP
- `http3-quic`: QUIC sobre UDP, el handshake de un viaje de ida y vuelta, descubrimiento con `Alt-Svc`, comportamiento bajo pérdida
- `tls-handshake`: ALPN, viajes de ida y vuelta del handshake

## Cómo ejecutarlo

El único requisito es Docker.

```sh
./setup-unix-http-versions.sh        # Linux y macOS
./setup-windows-http-versions.ps1    # Windows
```

El script construye las dos imágenes, inicia Caddy, ejecuta el typecheck y las pruebas, y elimina los contenedores.

## Medición (la demo)

```sh
docker compose run --rm bench && docker compose down -v
```

Tarda unos dos minutos, imprime la tabla y reescribe `results/results.md`, `results/results.json` y `results/results.js` (los datos del dashboard). `BENCH_RUNS` (por defecto 10) cambia el número de cargas por puerto. Para cambiar las condiciones, edita `NETEM_LATENCY` y `NETEM_LATENCY_LOSS` en `docker-compose.yml`.

`tc netem` necesita un kernel de Linux con los módulos `sch_netem`, `sch_prio` y `cls_u32`. Funcionó en Docker Desktop para Windows (kernel de WSL 2 6.18). Si el kernel no los tiene, el contenedor de Caddy termina al iniciar con el error de `tc`.

## Pruebas

```sh
docker compose run --rm ts-test && docker compose down -v
```

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/protocol.spec.ts` | en cada uno de los nueve puertos, el documento y las 200 imágenes fueron transportados por el protocolo esperado (`nextHopProtocol`). El puerto HTTP/1.1 no negocia `h2`. El puerto h3 anuncia `Alt-Svc`, y un navegador al que no se le avisó empieza con `h2` |
| `ts/tests/unit.spec.ts` | la página y las imágenes generadas, la cuadrícula de puertos y su máscara de `tc`, el rechazo de destinos no locales, las estadísticas y el informe |

## Cómo confía el navegador en el certificado del laboratorio

Ningún navegador confía en la CA interna de Caddy, y desactivar la verificación de certificados ocultaría errores reales. En su lugar, las pruebas leen el certificado que presenta el servidor del laboratorio, calculan el SHA-256 de su clave pública e inician Chromium con `--ignore-certificate-errors-spki-list=<ese hash>`: la verificación de certificados sigue activa, con exactamente una clave extra aceptada. `--origin-to-force-quic-on` hace que el navegador use QUIC en los puertos h3 desde la primera petición (ver `ts/src/browser.ts`).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `caddy/Caddyfile` | nueve listeners, protocolos por listener, TLS interno |
| `caddy/entrypoint.sh` | `tc netem` por puerto de origen, y luego Caddy |
| `ts/src/site.ts` | la página y los 200 mosaicos PNG, generados al construir la imagen de Caddy |
| `ts/src/browser.ts` | flags de Chromium, una carga de página en frío, tiempos desde el navegador |
| `ts/src/report.ts`, `ts/bench/measure.spec.ts` | estadísticas, tabla, datos de la cascada, la medición |
| `dashboard/` | la página estática con las tres cascadas |

## Versiones

| Componente | Versión |
| --- | --- |
| Caddy | 2.11.7 (`caddy:2.11.7-alpine`) |
| Playwright y su Chromium | 1.63.0 (`mcr.microsoft.com/playwright:v1.63.0-noble`, Chromium 153) |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| Zod | 4.6.5 |
| Tailwind CSS | 4.3.3 (CSS del dashboard, construido con `bun run dashboard:css`) |
