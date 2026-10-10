# Pirámide de pruebas completa (MP-TEST-1)

> English version: [docs/en/testing/test-pyramid.md](../../en/testing/test-pyramid.md) · Versão em português: [docs/pt/testing/test-pyramid.md](../../pt/testing/test-pyramid.md)

Mini-proyecto: [`projects/testing/test-pyramid`](../../../projects/testing/test-pyramid/README.es.md). Temas del quiz: `test-pyramid-levels`, `unit-tests-isolation`, `integration-tests`, `e2e-playwright`, `smoke-regression`, `ci-test-strategy`.

## El concepto

Un nivel de prueba se define por cuánto del sistema se ejecuta durante la prueba. Cuanto más se ejecuta, más tipos de error puede ver la prueba, y más cuesta escribirla, ejecutarla y diagnosticarla.

```text
            /  e2e  \          3 tests    ~0.7 s each    browser + HTTP + SQL
           /---------\
          / integration \      8 tests    ~8 ms each    handler + repository + SQLite
         /---------------\
        /      unit       \   10 tests    ~4 ms each    one pure module
       /-------------------\
```

La pirámide es un consejo sobre cantidad: muchas pruebas baratas en la base, pocas caras en la cima. La forma opuesta (casi todo pruebas de navegador, el "cono de helado") da una suite que tarda en responder y dice poco sobre dónde está la falla.

Dos suites del mini-proyecto no son niveles. Se definen por su propósito:

- **Humo (smoke)**: unas pocas comprobaciones superficiales sobre el servicio en ejecución, para saber en un segundo si el build o el despliegue están rotos.
- **Regresión**: pruebas que se conservan porque un bug llegó una vez a un usuario. Cada una reproduce un reporte y se queda para siempre.

## La aplicación

Una tienda con tres productos y un único carrito. Desde un subtotal de 100.00 el carrito recibe 10% de descuento.

| Parte | Archivo | Nivel que la prueba directamente |
| --- | --- | --- |
| Reglas de precio, funciones puras sobre centavos enteros | `ts/src/pricing.ts` | unitario |
| Carrito guardado en SQLite, con un upsert | `ts/src/cart-repository.ts` | integración |
| Handler HTTP, cuerpo validado con Zod | `ts/src/app.ts` | integración |
| Arranque: base de datos, migración, puerto | `ts/src/server.ts` | humo |
| Página y script del navegador | `ts/public/` | extremo a extremo |

## Un bug por nivel

`SEEDED_BUG` activa un defecto. La matriz (`docker compose run --rm matrix`) ejecuta cada suite contra cada bug y falla si una suite no detecta el bug de su propio nivel.

| Bug sembrado | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- |
| `unit`: `>` en lugar de `>=` en el umbral | **FAIL** | pass | pass | pass | pass |
| `integration`: el upsert reemplaza en lugar de sumar | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e`: la página no redibuja el carrito | pass | pass | pass | pass | **FAIL** |
| `smoke`: el servicio arranca sin la migración | pass | pass | pass | **FAIL** | **FAIL** |
| `regression`: se quita el redondeo del bug #17 | pass | pass | **FAIL** | pass | pass |

Lo que enseña cada fila:

- **`unit`**. Solo un carrito de exactamente 100.00 se comporta distinto. La suite unitaria tiene una prueba en el valor límite, la suite de navegador usa 75.00 y 150.00. Un nivel más alto no cubre automáticamente lo que cubre uno más bajo: ejecuta muchos menos casos.
- **`integration`**. El defecto está dentro de una cadena SQL. Ninguna prueba unitaria del TypeScript puede verlo, porque el SQL solo significa algo para una base de datos. La suite de extremo a extremo también falla, 100 veces más lenta, y su mensaje es "expected `Keyboard x 2`", sin ninguna pista del repositorio.
- **`e2e`**. El servidor y la base de datos son correctos. La página simplemente sigue mostrando el carrito antiguo. Solo una prueba que lee la pantalla puede notarlo.
- **`smoke`**. Toda prueba en proceso arma su propia base de datos con la migración, así que todas pasan. El error está en cómo se inició el servicio. Tres solicitudes HTTP lo encuentran en unos 10 ms.
- **`regression`**. El 10% de 100.05 es 10.005. Las primeras pruebas usaban montos redondos. El caso existe en la suite solo porque una vez salió mal.

## Cuánto cuesta

| Suite | Pruebas | Duración | Por prueba |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3.6 ms |
| integration | 8 | 61 ms | 7.6 ms |
| regression | 2 | 52 ms | 26.0 ms |
| smoke | 3 | 9 ms | 3.0 ms |
| e2e | 3 | 2070 ms | 690 ms |

Medido dentro de Docker en una máquina (ver el README). El tiempo es un costo. Los otros no están en la tabla: la suite de extremo a extremo necesita un servicio en ejecución y una imagen de navegador de 2 GB, y sus pruebas necesitan cuidado con las esperas y el estado compartido para mantenerse estables.

Este también es el argumento para el orden de un pipeline de CI: verificación de tipos y pruebas unitarias primero, el navegador al final. Un error que la primera etapa encuentra en 50 ms no debería esperar detrás de una etapa de varios segundos.

## Detalles que vale la pena leer en el código

- **Inyección de dependencias.** `createApp(repository)` recibe su repositorio, así que una prueba de integración pasa uno construido sobre una base de datos en memoria y llama al handler sin abrir un socket.
- **Una base de datos nueva por prueba.** `beforeEach` en `tests/integration/cart.test.ts` la crea. Ninguna prueba puede ver lo que escribió otra.
- **Estado compartido en las pruebas de extremo a extremo.** La tienda tiene un carrito para todos. `tests/e2e/shop.e2e.ts` lo vacía antes de cada prueba y la suite se ejecuta con un worker.
- **Sin esperas fijas.** Las aserciones de Playwright (`toHaveText`, `toHaveCount`) reintentan hasta que la página llega al estado esperado.
- **Un health check que hace una pregunta real.** `/health` lee la tabla del carrito, así que "saludable" significa "capaz de atender".
- **El nombre del servicio es `shop`, no `app`.** Chromium fuerza HTTPS en el dominio de nivel superior `.app`, y un host llamado `app` coincide con él.

## Ejecutar

```sh
./setup-unix-test-pyramid.sh        # Linux and macOS
./setup-windows-test-pyramid.ps1    # Windows
```

Cada suite también tiene su propio comando: `docker compose run --rm unit`, `integration`, `regression`, `smoke`, `e2e`, y `matrix` para la demo.
