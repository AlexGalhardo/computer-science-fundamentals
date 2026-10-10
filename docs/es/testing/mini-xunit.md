# Mini xUnit desde cero (MP-TEST-5)

> English version: [docs/en/testing/mini-xunit.md](../../en/testing/mini-xunit.md) · Versão em português: [docs/pt/testing/mini-xunit.md](../../pt/testing/mini-xunit.md)

Mini-proyecto: [`projects/testing/mini-xunit`](../../../projects/testing/mini-xunit/README.es.md). Tema del quiz: `unit-tests-isolation`.

## El concepto

Casi todo framework de pruebas en uso (JUnit, pytest, NUnit, el ejecutor de Bun) desciende de un diseño pequeño, llamado xUnit. Tiene cuatro partes:

```text
                      +--------------+
   discovery ------>  |  TestSuite   |  a list of things that can run
                      +--------------+
                        | run(result)          for each test:
                        v
                      +--------------+        1. result.test_started()
                      |  TestCase    |        2. set_up()            build the fixture
                      |  (one test)  |        3. the test method     may raise
                      +--------------+        4. tear_down()         always, in a finally
                        | records                5. on exception: result.test_failed(...)
                        v
                      +--------------+
                      |  TestResult  |  -> report -> exit code
                      +--------------+
```

El mini-proyecto construye esto en Python y en TypeScript sin ninguna biblioteca de pruebas, y prueba el resultado con él mismo.

## Tres ideas que valen todo el proyecto

**1. Una prueba es un objeto, y su nombre es el nombre de un método.** `WasRun("test_method")` es una prueba. `run` busca el método por nombre en tiempo de ejecución (`getattr` en Python, `Reflect.get` en TypeScript) y lo llama. Por eso una clase puede contener muchas pruebas, y por eso un framework puede listarlas: le pide a la clase todos los métodos cuyo nombre empieza con `test`.

**2. El orden set-up, prueba, tear-down lo fija el framework, no la prueba.** `run` es un template method:

```python
result.test_started()
try:
    self.set_up()
    try:
        method()
    finally:
        self.tear_down()
except Exception as error:
    result.test_failed(self.label(), error)
```

Cada línea tiene una consecuencia:

- `tear_down` está en un `finally`, así que la limpieza ocurre incluso cuando la prueba falla.
- `tear_down` está dentro del `try` que empieza después de `set_up`, así que no se ejecuta cuando el propio `set_up` falló: no hay nada que limpiar.
- La excepción se captura y se registra, nunca se relanza. Una prueba que falla no puede detener a las que vienen después.

**3. Un fixture nuevo por prueba.** `TestSuite.from_class` crea **una instancia nueva para cada método de prueba**. Los atributos asignados por una prueba no existen en la siguiente. De aquí viene el aislamiento de las pruebas, y por eso el estado guardado en variables de clase o de módulo lo rompe.

## Aserciones, ubicación y código de salida

Una aserción es un `if` que lanza una excepción con un mensaje que dice qué se esperaba y qué llegó.

La **ubicación** de un fallo se toma de la pila: el marco más profundo que no está dentro del framework. Sin ese filtro, cada aserción fallida apuntaría a la línea del propio `assert_equal`.

El **código de salida** es lo que leen los scripts y el CI: 0 para verde, 1 para rojo, y 2 cuando no se encontró ninguna prueba, porque una ejecución con cero pruebas no debe parecer un éxito.

```text
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:28
2 run, 1 failed
```

## Cómo un framework puede probarse a sí mismo

Las autopruebas son casos de prueba del framework, sobre el framework. El sujeto de cada prueba es **otro caso de prueba**, ejecutado a mano con su propio `TestResult`:

```python
def test_failing_test_is_counted_as_failed(self) -> None:
    WasRun("test_broken_method").run(self.result)  # the inner test fails, on purpose
    self.assert_equal(self.result.summary(), "1 run, 1 failed")
```

El fallo interno queda dentro de `self.result` y no llega a la ejecución real. `WasRun` escribe lo que le pasó en una cadena `log`, así que el orden `set_up test_method tear_down` puede afirmarse.

Hay una trampa. Si el framework tragara los fallos, todas sus pruebas estarían en verde. Por eso un archivo `bootstrap` se ejecuta primero y comprueba, con simples sentencias `if` y sin ningún framework, que una prueba que falla se informa como fallida, que una prueba que pasa no, y que las pruebas se cuentan. Las autopruebas se creen solo después de eso.

Los ejemplos y los fixtures muestran un segundo detalle del descubrimiento: solo los archivos que siguen la convención de nombres se cargan como pruebas, y solo las clases definidas en ellos. `WasRun` vive en `fixtures`, fuera de la convención, porque su prueba rota no debe ejecutarse como una prueba real.

## Python y TypeScript lado a lado

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Llamar a un método por nombre | `getattr(self, name)` | `Reflect.get(this, name)` |
| Métodos de prueba de una clase | `dir(cls)` | cadena de prototipos y `Object.getOwnPropertyNames` |
| Ubicación de un fallo | `traceback.extract_tb` da marcos estructurados | `error.stack` es texto y hay que analizarlo |
| Pruebas asíncronas | no soportadas | cada paso se espera con await |
| Archivos de prueba | `*_xtest.py`, cargados con `importlib` | `*.xunit.ts`, cargados con `import()` |

## Ejecutar

```sh
./setup-unix-mini-xunit.sh        # Linux and macOS
./setup-windows-mini-xunit.ps1    # Windows
```

Las autopruebas: `docker compose run --rm python-test` y `ts-test`. La ejecución roja: `python-demo` y `ts-demo`, que salen con 1 por diseño.
