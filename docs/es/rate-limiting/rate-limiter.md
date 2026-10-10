# Algoritmos de limitación de tasa (MP-RL-1)

> English version: [docs/en/rate-limiting/rate-limiter.md](../../en/rate-limiting/rate-limiter.md) · Versão em português: [docs/pt/rate-limiting/rate-limiter.md](../../pt/rate-limiting/rate-limiter.md)

Miniproyecto: [`projects/rate-limiting/rate-limiter`](../../../projects/rate-limiting/rate-limiter/README.es.md). Temas del quiz: `fixed-window`, `sliding-window`, `token-bucket`, `leaky-bucket`, `redis-distributed`, `http-429-and-backoff`.

## La pregunta

Un límite como "10 solicitudes por segundo" no dice qué pasa cuando llegan 20 solicitudes en 200 ms. Cada algoritmo responde distinto, y esa respuesta es lo que realmente estás eligiendo.

| Algoritmo | Estado por cliente | Cómo decide | Qué hace con una ráfaga |
| --- | --- | --- | --- |
| Ventana fija | Un número de ventana y un contador | Admite mientras el contador de la ventana alineada actual esté por debajo del límite | Deja pasar hasta el doble del límite alrededor de una frontera |
| Log deslizante | Una marca de tiempo por solicitud admitida | Admite mientras haya menos de `limit` marcas en (t − W, t] | Nunca más que el límite en cualquier intervalo de longitud W |
| Contador deslizante | Dos contadores | Admite mientras `previous × (1 − elapsed / W) + current` esté por debajo del límite | Cerca del límite, con un pequeño error |
| Token bucket | Un saldo y una marca de tiempo | Admite cuando hay una ficha disponible; las fichas regresan a un ritmo constante, con tope en la capacidad | Deja pasar una ráfaga del tamaño de la capacidad de una vez, luego la tasa de reposición |
| Leaky bucket (cola) | Un nivel y una marca de tiempo | Admite mientras el balde tenga espacio; las solicitudes admitidas salen a un ritmo constante | Absorbe la ráfaga y libera un flujo uniforme |

## El experimento de ráfaga

Los cinco reciben las mismas 80 solicitudes en cuatro fases, con la misma configuración (límite 10, ventana 1000 ms, o sea capacidad 10 y tasa de 10 por segundo para los baldes).

![Solicitudes admitidas a lo largo del tiempo por cada algoritmo](../../../projects/rate-limiting/rate-limiter/results/burst.es.svg)

La tabla con los números está en el [README](../../../projects/rate-limiting/rate-limiter/README.es.md#resultados) y en `results/burst.md`. Cómo leerla:

- **Bajo el límite (0 a 1 s).** Cinco solicitudes en un segundo. Todos admiten todo: los algoritmos solo difieren cuando se alcanza el límite.
- **Ráfaga en la frontera (1.9 a 2.1 s).** Diez solicitudes al final de la ventana [1 s, 2 s) y diez al comienzo de [2 s, 3 s). La ventana fija ve dos ventanas con diez solicitudes cada una y admite las 20. El log deslizante admite 10. El contador deslizante admite 11: en t = 2.01 s la ventana anterior pesa 0.99 × 10 = 9.9, que está por debajo de 10, aunque el último segundo real contiene 10 solicitudes. Los dos baldes admiten 11: diez fichas guardadas más la que se ganó durante la ráfaga.
- **Sobrecarga continua (3 a 5 s).** Veinte solicitudes por segundo. La ventana fija y el log deslizante admiten las primeras diez de cada segundo y luego nada hasta el siguiente: el cliente ve medio segundo de éxito y medio segundo de rechazos. El token bucket gasta primero sus diez fichas guardadas y luego admite una solicitud cada 100 ms. Por eso suma 29 en esta fase: capacidad + tasa × tiempo = 10 + 10 × 1.95 = 29.5 fichas entre la primera solicitud (3.00 s) y la última (4.95 s), o sea 29 solicitudes completas.
- **Ráfaga instantánea tras el silencio (7 s).** Quince solicitudes en el mismo milisegundo. Todos los algoritmos admiten diez. Solo difiere el último panel: el leaky bucket entrega esas diez al sistema que tiene detrás una cada 100 ms.

La columna "peor intervalo de 1 s" desliza un intervalo de un segundo sobre las solicitudes admitidas y se queda con el conteo mayor. Ventana fija: 20. Log deslizante: 10. Contador deslizante: 11. Token bucket: 19. Salida del leaky bucket: 10.

### Cómo elegir

- Una ventana fija basta cuando el límite es una protección aproximada y una ráfaga doble es inofensiva. También es la más barata en Redis: un `INCR`.
- Un log deslizante es para límites que deben cumplirse exactamente y son pequeños (intentos de inicio de sesión, restablecimientos de contraseña), porque almacena cada solicitud admitida.
- Un contador deslizante es el compromiso habitual para límites grandes.
- Un token bucket encaja con las APIs: los clientes son por naturaleza a ráfagas, y la capacidad declara cuánta ráfaga se tolera.
- Un leaky bucket como cola encaja con un sistema detrás que tiene una capacidad constante estricta. Cambia rechazos por demora.

El token bucket y el leaky bucket del mismo tamaño admiten exactamente las mismas solicitudes: un token bucket lleno y un leaky bucket vacío son imágenes especulares. La diferencia es lo que ocurre después de la admisión.

## Pruebas determinísticas

Cada limitador recibe el reloj como argumento: `allow(nowMs)`. Una prueba dice "una solicitud llega en t = 999 ms" y obtiene la misma respuesta en cada ejecución, sin esperar. La tabla de `cases/cases.json` tiene tres líneas de tiempo por algoritmo, cada una elegida para fijar un borde: la frontera de una ventana fija, una entrada del log que expira exactamente una ventana después, el peso de la ventana anterior en el contador, el tope del token bucket, los tiempos de salida del leaky bucket.

Los tiempos son milisegundos enteros y los baldes usan "créditos" enteros (una ficha vale `windowMs` créditos, cada milisegundo rinde `limit` créditos), así que no hay redondeo de punto flotante y las versiones en TypeScript y en Go coinciden exactamente. Las pruebas en Go leen la misma tabla, y también comparan el experimento en Go con los números escritos por TypeScript.

## Qué cambia en Go

JavaScript ejecuta un callback a la vez, así que `count += 1` no puede interrumpirse. En Go, muchas goroutines llaman a `Allow` a la vez, y "leer el contador, comparar, escribir" se vuelve una carrera. Cada limitador en Go sostiene un `sync.Mutex`, y una prueba lanza 64 goroutines contra un limitador bajo `go test -race`: se admite exactamente el límite.

Es el mismo bug de la sección siguiente, a menor escala: dos hilos de un proceso en lugar de dos máquinas.

## La versión distribuida

Detrás de un balanceador de carga, un limitador guardado en la memoria de cada instancia deja que N instancias admitan N veces el límite. El estado se traslada a Redis, compartido por todas las instancias.

El código obvio es incorrecto:

```text
instance A: GET rate:alice   -> 49
instance B: GET rate:alice   -> 49      (A has not written yet)
instance A: 49 < 50, INCR    -> 50
instance B: 49 < 50, INCR    -> 51      <- one more than the limit
```

Cada comando de Redis es atómico, pero la secuencia no. La solución es ejecutar toda la decisión dentro de Redis como un único script Lua (`lua/fixed-window.lua`): Redis ejecuta un script de principio a fin sin dejar entrar ningún otro comando en medio. El script también define la expiración en el mismo paso que el primer incremento, así que un cliente que falla no puede dejar un contador que nunca expira.

Detalles que muestra el código:

- **Scripts cortos.** Mientras corre un script, todos los demás clientes esperan. Los scripts de aquí son un puñado de comandos O(1).
- **`EVALSHA` y `NOSCRIPT`.** El script se carga una vez y se llama por su SHA1. La caché de scripts es volátil: tras un reinicio Redis responde `NOSCRIPT`, y el cliente carga el script de nuevo y reintenta.
- **`KEYS` y `ARGV`.** La clave llega en `KEYS[1]` y los números en `ARGV`, para que Redis Cluster pueda enrutar el script por clave.
- **El reloj de Redis.** El script del token bucket lee `TIME` en el servidor. De lo contrario, dos instancias con relojes ligeramente distintos discreparían sobre cuántas fichas se ganaron.
- **`429` y `Retry-After`.** Una solicitud rechazada recibe `429 Too Many Requests` con `Retry-After` en segundos enteros, redondeados hacia arriba, y `Cache-Control: no-store`.

La prueba levanta dos instancias y envía 400 solicitudes concurrentes, alternando entre ellas, para un límite de 50 por minuto. Con el script, se admiten exactamente 50 en cada una de cinco rondas. Con la versión ingenua, se admitieron hasta 192 en las rondas medidas, y exactamente 50 en unas pocas: una carrera depende del tiempo, y eso es lo que la hace difícil de detectar. La prueba repite la ronda ingenua hasta que una supera el límite.

Lo que el laboratorio no cubre: la replicación de Redis es asíncrona, así que tras un failover pueden perderse unos pocos incrementos y excederse brevemente el límite; y la aplicación debe decidir qué hacer cuando Redis no está disponible (admitir todo o rechazar todo). Ambos se discuten en el tema del quiz `redis-distributed`.

## Reglas del laboratorio

Redis (`redis:8.10.2-alpine`) y las dos instancias se hablan en una red interna de docker-compose. No se publica ningún puerto y ningún contenedor llega a internet. La prueba concurrente toma sus destinos de `TARGETS`, cuyo valor por defecto son los dos servicios del compose, y lanza un error antes de enviar nada cuando un host no es `localhost`, `127.0.0.1`, `limiter-a` ni `limiter-b`.

## Criterios de aceptación

| Ítem | Cómo se verifica |
| --- | --- |
| MP-RL-1.1 ventana fija, ventana deslizante, token bucket y leaky bucket en memoria, cada uno pasando una prueba guiada por tabla de solicitudes admitidas y rechazadas a lo largo del tiempo | `docker compose run --rm ts-test` y `docker compose run --rm go-test`: ambos leen `cases/cases.json` (15 líneas de tiempo, 3 por algoritmo; la ventana deslizante tiene dos variantes, log y contador) |
| MP-RL-1.2 dos instancias juntas nunca permiten más que el límite bajo carga concurrente | `docker compose run --rm distributed-test`: exactamente 50 de 400 solicitudes concurrentes admitidas, cinco rondas, y la versión ingenua excede el límite |
| MP-RL-1.3 gráfico de solicitudes aceptadas a lo largo del tiempo para los algoritmos con el mismo tráfico | `./experiment-unix.sh` (o `.ps1`) escribe `results/burst.svg`, `results/burst.pt-BR.svg` y `results/burst.es.svg` a partir de `results/burst.json`; una prueba falla cuando los resultados versionados están desactualizados |

## Cómo ejecutarlo

```sh
cd projects/rate-limiting/rate-limiter
./setup-unix-rate-limiter.sh        # o .\setup-windows-rate-limiter.ps1
./experiment-unix.sh                # o .\experiment-windows.ps1
```

## Fuentes

- Tanenbaum y Wetherall, Computer Networks, 5th edition, capítulo 5: modelado de tráfico, leaky bucket y token bucket.
- Documentación de Redis: el comando `INCR` (patrón de limitador de tasa), scripting con Lua (`EVAL`, `EVALSHA`, caché de scripts).
- RFC 6585, sección 4 (429 Too Many Requests) y RFC 9110, sección 10.2.3 (`Retry-After`).
