# pure-functions-properties

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La misma base de código pequeña en TypeScript y Elixir. Enseña **por qué el código puro es fácil de probar y qué encuentran las pruebas basadas en propiedades**: una regla escrita de forma impura y de forma pura, una propiedad que atrapa un error que las pruebas con ejemplos dejan pasar y lo reduce a la entrada más pequeña, y un pipeline construido componiendo funciones puras.

Explicación completa: [docs/es/functional-programming/pure-functions-properties.md](../../../docs/es/functional-programming/pure-functions-properties.md).

## Las tres lecciones

1. **Versiones impura y pura de la misma regla** (`checkout`). La versión impura lee el reloj y mantiene un contador oculto, así que el mismo pedido da respuestas distintas. La versión pura recibe el instante como argumento y se prueba con valores simples, sin mock.
2. **Propiedades** (`prop`, `codec`, `normalize`). Una propiedad es una regla que debe cumplirse para toda entrada, comprobada con cientos de entradas generadas: ida y vuelta (`decode(encode(x)) == x`), idempotencia (`normalize(normalize(x)) == normalize(x)`) e invariantes (`0 <= descuento <= subtotal`). La biblioteca de pruebas de propiedades está escrita aquí, en unas 150 líneas por lenguaje, sin dependencias.
3. **Composición y pipelines** (`pipeline`). Un reporte de ventas en cinco pasos pequeños, unidos con una función `pipe` en TypeScript y con el operador `|>` en Elixir.

## El error sembrado y su contraejemplo reducido

`decodeBuggy` (`decode_buggy` en Elixir) lee la longitud de la secuencia con `\d` en lugar de `\d+`, así que entiende un solo dígito. Las cinco pruebas con ejemplos de [`cases.json`](cases.json) pasan con él, porque ningún ejemplo tiene una secuencia de 10 o más caracteres iguales.

La propiedad de ida y vuelta falla con él. Con la semilla por defecto (42), los dos lenguajes informan lo mismo:

```text
round trip, buggy decoder: FAILED on run 1 (seed 42)
  original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
  shrunk in 6 steps to:   "aaaaaaaaaa"
  encode -> "10a", buggy decode -> ""
```

El contraejemplo reducido es **`"aaaaaaaaaa"`**: diez veces la letra `a`. Es la entrada más pequeña que muestra el error. Nueve caracteres se codifican como `9a` y se decodifican bien; diez se codifican como `10a`, el decodificador con error lee el par `0a`, y el texto desaparece. El texto de 27 caracteres que el generador encontró primero dice "algo anda mal"; el de 10 caracteres dice qué.

## Temas del quiz que demuestra

- `functional-programming` / `pure-functions`: pureza, entradas y salidas ocultas, por qué una función pura no necesita mock, por qué una prueba basada en propiedades necesita una función pura.
- `functional-programming` / `higher-order-functions`: `map`, `filter` y `reduce` como los pasos del pipeline y de los generadores.
- `functional-programming` / `composition-currying`: `pipe`, el operador `|>`, pasos en forma curried como `onlyStatus("paid")`, los tipos de los pasos que deben encajar.
- `functional-programming` / `side-effects`: núcleo funcional y cascarón imperativo, el reloj como argumento, el generador aleatorio con estado explícito (la semilla).
- `functional-programming` / `elixir-typescript-style`: el mismo pipeline en los dos estilos.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-pure-functions-properties.sh        # Linux y macOS
./setup-windows-pure-functions-properties.ps1    # Windows
```

El script construye las dos imágenes, ejecuta las pruebas de los dos lenguajes y ejecuta la demo de los dos.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm elixir-demo
```

Cada demo imprime el checkout impuro y el puro lado a lado, la propiedad encontrando el error sembrado con el contraejemplo original y el reducido, y el reporte de ventas.

## Pruebas

```sh
docker compose run --rm ts-test        # 30 pruebas
docker compose run --rm elixir-test    # verificación de formato y 19 pruebas
```

Los conteos difieren solo porque Bun informa cada ejemplo compartido como una prueba y la suite de Elixir recorre los ejemplos dentro de una sola prueba. Las dos suites leen los ejemplos y los resultados esperados del mismo [`cases.json`](cases.json) y tienen las mismas propiedades. TypeScript tiene una prueba más, "the input is not modified", que no tiene sentido en Elixir, donde los datos no se pueden modificar.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `cases.json` | Ejemplos y resultados esperados compartidos por los dos lenguajes |
| `ts/src/prop.ts`, `elixir/lib/pure_functions_properties/prop.ex` | La biblioteca de pruebas de propiedades: generador aleatorio puro, generadores con reducción, `check` |
| `ts/src/codec.ts`, `elixir/lib/pure_functions_properties/codec.ex` | Codec run-length, con el decodificador correcto y el que tiene el error sembrado |
| `ts/src/checkout.ts`, `elixir/lib/pure_functions_properties/checkout.ex` | La versión impura, la versión pura y el cascarón imperativo de la misma regla |
| `ts/src/normalize.ts`, `elixir/lib/pure_functions_properties/normalize.ex` | Un normalizador idempotente |
| `ts/src/pipeline.ts`, `elixir/lib/pure_functions_properties/pipeline.ex` | El pipeline del reporte de ventas |
| `ts/src/cli.ts`, `elixir/lib/mix/tasks/demo.ex` | La demo |

## Notas

- El código marcado como `SEEDED BUG` e `IMPURE` es incorrecto o impuro a propósito. Está ahí para compararlo con la versión que tiene al lado.
- No hay dependencias. La biblioteca de pruebas de propiedades es una versión didáctica: los proyectos reales deben usar fast-check (TypeScript) o StreamData (Elixir), que tienen muchos más generadores y una reducción mejor.
- Los dos lenguajes usan la misma fórmula aleatoria y sortean en el mismo orden, así que la misma semilla da las mismas entradas en los dos.
