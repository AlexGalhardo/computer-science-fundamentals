# mini-xunit

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un framework de pruebas construido desde cero, dos veces: una en Python y una en TypeScript. Caso de prueba, suite, resultado, set-up y tear-down, descubrimiento de archivos de prueba, un informe y un código de salida, en cerca de 300 líneas por lenguaje, comentarios incluidos. No se usa ninguna biblioteca de pruebas en ninguno de los dos (ni pytest, ni unittest, ni `bun:test`): el framework se prueba a sí mismo. Después de leerlo, `setUp`, "fixture nuevo" y "la ejecución salió con 1" dejan de ser magia.

Código: MP-TEST-5. Explicación completa: [docs/es/testing/mini-xunit.md](../../../docs/es/testing/mini-xunit.md).

## Temas del quiz que demuestra

- `testing` / `unit-tests-isolation`: fixtures, set-up y tear-down, un fixture nuevo por prueba, cómo un runner recolecta resultados, por qué una prueba que falla no detiene a las demás

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-mini-xunit.sh        # Linux and macOS
./setup-windows-mini-xunit.ps1    # Windows
```

El script ejecuta las autopruebas de ambos lenguajes y luego ambas demos, verificando que cada demo salga con un código distinto de cero.

## Pruebas: el framework se prueba a sí mismo

```sh
docker compose run --rm python-test    # ruff + bootstrap + python -m mini_xunit selftest
docker compose run --rm ts-test        # tsc + bootstrap + bun run src/cli.ts selftest
```

Cada una imprime `bootstrap: ok` y `24 run, 0 failed`. Las 24 pruebas de cada lenguaje son casos de prueba escritos con el framework y encontrados por su propio descubrimiento.

Un framework que se prueba a sí mismo tiene un problema de bootstrap: si tragara los fallos, todas sus propias pruebas se verían verdes. Por eso cada lenguaje ejecuta primero un archivo `bootstrap` que comprueba las promesas más básicas con simples sentencias `if` (una prueba que falla se informa como fallida, una que pasa no, toda prueba se cuenta). Solo entonces se ejecutan las autopruebas.

## Demo: una prueba que falla

```sh
docker compose run --rm python-demo; echo "exit code: $?"
docker compose run --rm ts-demo; echo "exit code: $?"
```

Cada una ejecuta el framework sobre `examples/failing`, donde una prueba tiene una expectativa errónea a propósito. El informe tiene el nombre de la prueba, el mensaje y la ubicación, y el proceso sale con 1:

```text
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:28
2 run, 1 failed
exit code: 1
```

```text
FAIL CartTest.testTotalWithDiscount
     expected 100 but got 90
     at examples/failing/cart.xunit.ts:28
2 run, 1 failed
exit code: 1
```

| Código de salida | Significado |
| --- | --- |
| 0 | todas las pruebas pasaron |
| 1 | al menos una prueba falló |
| 2 | no se encontró ninguna prueba, o el comando se usó mal |

## Las partes

| Parte | Función | Python | TypeScript |
| --- | --- | --- | --- |
| `TestCase` | Una prueba: ejecuta `set_up`, el método con el nombre dado en el constructor, y luego `tear_down` en un `finally`. Captura la excepción y se la entrega al resultado | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestResult` | Cuenta las pruebas que se ejecutaron y guarda nombre, mensaje y ubicación de cada fallo | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestSuite` | Una lista de pruebas o de otras suites. `from_class` crea una instancia nueva por método de prueba | `mini_xunit/core.py` | `src/xunit.ts` |
| Aserciones | `assert_equal`, `assert_true`, `assert_raises`: un `if` que lanza | `mini_xunit/core.py` | `src/xunit.ts` |
| Descubrimiento | Importa todo `*_xtest.py` o `*.xunit.ts` bajo una carpeta y recolecta las subclases de `TestCase` | `mini_xunit/discovery.py` | `src/discovery.ts` |
| Reporter y CLI | Imprime los fallos y el resumen, y convierte el resultado en un código de salida | `mini_xunit/reporter.py`, `__main__.py` | `src/cli.ts` |

## Por qué dos lenguajes

El diseño es el mismo. Lo que cambia es cómo cada lenguaje encuentra un método por su nombre y dónde ocurrió un fallo:

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Llamar a un método por su nombre | `getattr(self, name)` | `Reflect.get(this, name)` |
| Listar los métodos de prueba de una clase | `dir(cls)`, que ya incluye los métodos heredados | recorrer la cadena de prototipos con `Object.getOwnPropertyNames` |
| Ubicación de un fallo | `traceback.extract_tb`, una lista de marcos | analizar el texto de `error.stack` |
| Pruebas asíncronas | no soportadas: todo es síncrono | cada paso se espera con await, así que una prueba puede ser `async` |
| Cargar un archivo de prueba | `importlib` con un module spec | `import()` dinámico |

## Estructura

```text
python/mini_xunit/          the framework (core, discovery, reporter, command line)
python/selftest/            bootstrap, fixtures and the tests written with the framework
python/examples/            a cart with a passing folder and a failing folder
ts/src/                     the framework (xunit, discovery, cli)
ts/selftest/                bootstrap, fixtures and the tests written with the framework
ts/examples/                the same cart, passing and failing
```

Fijado: `python:3.14.8-slim-trixie` con `ruff` 0.16.10 (solo lint y formato), y `oven/bun:1.4.2` con `typescript` 7.0.2 y `@types/bun` 1.4.2 (solo verificación de tipos). Ninguna de las dos implementaciones tiene dependencias de ejecución.

## Límites

Es un objeto de estudio. No tiene filtrado de pruebas, ni ejecución en paralelo, ni time-out, ni pruebas omitidas, ni diferencia entre un fallo y un error, ni diff de valores grandes. Cada uno de esos es un buen ejercicio para agregar, con una autoprueba primero.
