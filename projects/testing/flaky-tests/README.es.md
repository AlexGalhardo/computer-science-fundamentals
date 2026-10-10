# flaky-tests

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un laboratorio de pruebas intermitentes. Cuatro pruebas fallan parte de las veces sin ningún cambio en el código, cada una por una de las razones habituales: el reloj real, el orden de resultados concurrentes, estado compartido entre pruebas y una llamada de red real. Junto a cada una está la versión corregida: un reloj falso, un orden determinista, aislamiento, una red con stub. Cada prueba intermitente se ejecuta 50 veces y falla al menos una. Cada prueba corregida se ejecuta 500 veces y nunca falla.

Código: MP-TEST-4. Explicación completa: [docs/es/testing/flaky-tests.md](../../../docs/es/testing/flaky-tests.md).

> **Intermitentes a propósito.** Los archivos bajo `ts/tests/flaky/` son intermitentes por diseño y nunca forman parte de la ejecución normal de pruebas. Solo los ejecuta el servicio `flaky`, que espera que fallen.

## Temas del quiz que demuestra

- `testing` / `flaky-tests`: qué es una prueba intermitente (flaky), las causas habituales, la corrección de cada una, por qué un reintento oculta el problema
- `testing` / `test-doubles`: un reloj falso como doble del tiempo, un stub en lugar de una llamada HTTP
- `testing` / `unit-tests-isolation`: un fixture nuevo por prueba, pruebas que no dependen de su orden

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-flaky-tests.sh        # Linux and macOS
./setup-windows-flaky-tests.ps1    # Windows
```

El script ejecuta las pruebas deterministas, luego las dos ejecuciones repetidas de abajo, y elimina los contenedores al final. Toma alrededor de medio minuto después del build.

## Pruebas

```sh
docker compose run --rm ts-test
```

Verificación de tipos más las 16 pruebas deterministas (las corregidas y las unitarias), en orden aleatorio, en un contenedor sin red.

## Demo: repetir hasta que aparezca

```sh
docker compose run --rm flaky    # each flaky test 50 times: each must fail at least once
docker compose run --rm fixed    # each fixed test 500 times: none may fail
docker compose down -v --remove-orphans
```

Cada ejecución es un proceso nuevo de `bun test --randomize`. Los informes se escriben en [`results/flaky-runs.md`](results/flaky-runs.md) y [`results/fixed-runs.md`](results/fixed-runs.md). Última ejecución:

| Causa | Prueba intermitente, 50 ejecuciones | Corrección | Prueba corregida, 500 ejecuciones |
| --- | --- | --- | --- |
| Tiempo | 11 fallos (22%) | reloj falso | 0 fallos |
| Dependencia del orden | 37 fallos (74%) | orden determinista | 0 fallos |
| Estado compartido | 42 fallos (84%) | aislamiento | 0 fallos |
| Red real | 11 fallos (22%) | red con stub | 0 fallos |

La cantidad de fallos de las pruebas intermitentes cambia de una ejecución a otra. Ese es el punto.

## Las cuatro causas

| Causa | Qué sale mal | Dónde | La corrección |
| --- | --- | --- | --- |
| Tiempo | La prueba lee el reloj real por segunda vez y espera el mismo milisegundo que vio el código. Cuando el reloj avanza entre una lectura y otra, los valores difieren en 1 | `src/session.ts`, `tests/flaky/time.test.ts` | El reloj es un parámetro. La prueba pasa un `FakeClock` y lo mueve a mano |
| Dependencia del orden | Las consultas concurrentes terminan en un orden variable, el código las devuelve en orden de llegada, y la prueba espera un orden | `src/prices.ts`, `tests/flaky/order.test.ts` | El código conserva el orden de la solicitud (`Promise.all`), o la prueba compara el contenido ordenado cuando el orden no importa |
| Estado compartido | Tres pruebas usan un registro a nivel de módulo y pasan solo en el orden en que fueron escritas (1 de 6 órdenes) | `src/invoices.ts`, `tests/flaky/shared-state.test.ts` | `beforeEach` construye un registro nuevo para cada prueba |
| Red real | La prueba llama a un servicio HTTP real que falla una solicitud de cada cuatro | `src/rates.ts`, `tests/flaky/network.test.ts` | La función HTTP es un parámetro. La prueba pasa un stub, y la ruta de error se vuelve comprobable a pedido |

En las cuatro, la corrección tiene la misma forma: la prueba deja de depender de algo que no controla, y ese algo pasa a ser una entrada explícita.

## ¿Está garantizado "al menos una vez en 50"?

No, y no puede estarlo: es una probabilidad. Con una tasa de fallo `p` por ejecución, la probabilidad de 50 ejecuciones verdes seguidas es `(1 - p)^50`. Para la prueba menos intermitente de aquí (alrededor de 20%) eso es `0.8^50`, cerca de 1 en 70 000. La misma aritmética muestra por qué una prueba intermitente duele: con 2% por ejecución, una suite con 50 pruebas así está en rojo en el 64% de las ejecuciones.

## Seguridad

La "red real" es el servicio `unstable-api` de este archivo compose, en una red `internal` sin puerto publicado. Sus fallos se simulan con un número aleatorio. `rates.ts` rechaza cualquier dirección que no sea `localhost`, `127.0.0.1` o `unstable-api`. Los servicios `fixed` y `ts-test` no tienen ninguna red.

## Estructura

```text
ts/src/session.ts          time: sessions, Clock, FakeClock
ts/src/prices.ts           order: arrival order against request order
ts/src/invoices.ts         shared state: a registry, its factory and a singleton
ts/src/rates.ts            network: an HTTP client with an injectable transport
ts/src/unstable-api.ts     the local service that fails one request in four
ts/src/repeat.ts           runs each test file N times and counts failures
ts/tests/flaky/            the four intermittent tests
ts/tests/fixed/            the four fixes
ts/tests/unit/             tests of the service and of the repeat plan
```

Dependencias, fijadas: `zod` 4.6.5 (validación del cuerpo HTTP y del argumento del script), `typescript` 7.0.2 y `@types/bun` 1.4.2, sobre `oven/bun:1.4.2`.
