# Funciones puras y pruebas basadas en propiedades

> English version: [docs/en/functional-programming/pure-functions-properties.md](../../en/functional-programming/pure-functions-properties.md) · Versão em português: [docs/pt/functional-programming/pure-functions-properties.md](../../pt/functional-programming/pure-functions-properties.md)

Mini-proyecto MP-FP-1, en [`projects/functional-programming/pure-functions-properties`](../../../projects/functional-programming/pure-functions-properties). Enseña por qué el código puro es fácil de probar y qué encuentran las pruebas basadas en propiedades. Lenguajes: TypeScript y Elixir.

## Dos versiones de una regla

La regla: sumar los ítems de un pedido y aplicar el cupón si no ha vencido.

La versión impura le pregunta al sistema qué hora es y mantiene un contador de recibos fuera de la función. Tiene una **entrada oculta** (el reloj) y una **salida oculta** (el contador). El mismo pedido, valorado dos veces, da dos resultados distintos, y una prueba de "un cupón vencido no da descuento" tendría que reemplazar el reloj.

La versión pura recibe el instante como segundo argumento:

```ts
priceOrder(order, now) // { subtotalCents, discountCents, totalCents }
```

Todo lo que necesita entra por los argumentos y todo lo que hace está en el valor devuelto. Sus pruebas construyen valores, llaman a la función y comparan, sin mock. La lectura del reloj real se mueve a `checkoutNow`, una función de tres líneas en el borde del programa: el cascarón imperativo alrededor de un núcleo funcional.

En Elixir el contador oculto vive en el diccionario del proceso, lo más parecido que tiene el lenguaje a una global mutable. La versión pura usa dos cláusulas de función y una guarda en lugar de un `if`: una cláusula coincide con un cupón todavía válido, la otra atrapa todo lo demás, incluida la ausencia de cupón.

## Qué es una propiedad

Una prueba con ejemplo dice "para esta entrada, espero esta salida". Una propiedad dice "para toda entrada, esta regla se cumple", y una herramienta la comprueba con cientos de entradas generadas. Aquí aparecen tres tipos de regla:

| Tipo | Regla | Dónde |
| --- | --- | --- |
| Ida y vuelta | `decode(encode(text)) == text` | `codec` |
| Idempotencia | `normalize(normalize(name)) == normalize(name)` | `normalize` |
| Invariante | `0 <= descuento <= subtotal` y `total == subtotal - descuento` | `checkout` |
| Invariante | el reporte completo suma lo mismo que las líneas pagadas | `pipeline` |

Ninguna de estas reglas exige conocer de antemano la salida esperada. Eso es lo que permite que las entradas sean aleatorias.

## La biblioteca, en tres partes

El stack del repositorio no tiene una biblioteca de pruebas de propiedades, así que el mini-proyecto escribe una pequeña (`prop.ts`, `prop.ex`). Es lo bastante corta para leerla de una sentada.

**Un generador aleatorio puro.** El estado del generador es un número de 32 bits, la semilla. `randomInt(seed, min, max)` devuelve el número y la siguiente semilla. Nada se guarda en ningún lugar, así que la misma semilla repite exactamente la misma ejecución. Es la forma estándar de mantener la aleatoriedad fuera de la parte impura de un programa.

**Generadores que saben reducir.** Un generador son dos funciones: `generate(seed)` produce un valor, y `shrink(value)` lista versiones más simples de él, la más simple primero. Los enteros se reducen hacia cero recortando la distancia a la mitad. Las listas se reducen quitando mitades, luego elementos sueltos, luego reduciendo un elemento. Las tuplas se reducen una posición a la vez.

**El bucle `check`.** Genera valores hasta que uno hace falsa la propiedad. Entonces reduce: toma el primer candidato más simple que todavía falla y vuelve a empezar desde él, hasta que ningún candidato falle. Lo que queda es un mínimo local, por lo general la entrada más pequeña que una persona habría escrito.

La reducción ejecuta la propiedad muchas veces más, con entradas elegidas después del fallo. Solo funciona porque la propiedad es pura: una segunda ejecución con la misma entrada no puede dar otra respuesta.

## El error sembrado

El codec es la codificación run-length: `aaabcc` se convierte en `3a1b2c`. El decodificador con error lee la cuenta con `\d` en lugar de `\d+`.

Los cinco ejemplos pasan con el decodificador con error. Son los ejemplos que escribe una persona: textos cortos, un solo carácter, el texto vacío, nueve caracteres iguales. Ninguno tiene una secuencia de diez.

La propiedad de ida y vuelta falla:

```text
original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
shrunk in 6 steps to:   "aaaaaaaaaa"
encode -> "10a", buggy decode -> ""
```

El contraejemplo reducido, diez veces `a`, señala directo la causa: algo sale mal cuando la cuenta necesita dos dígitos.

### El generador importa

Un texto de letras aleatorias casi nunca contiene diez letras iguales seguidas. Con un alfabeto de tres letras, la probabilidad en una posición dada es de aproximadamente 1 en 20.000. Una propiedad alimentada con textos así pasaría y no probaría nada.

El generador usado aquí, `runString`, arma un texto a partir de secuencias: sortea una letra y una longitud de 1 a 12, varias veces. Las secuencias largas pasan a ser comunes. Elegir lo que produce el generador forma parte de escribir la propiedad, del mismo modo que elegir los ejemplos forma parte de escribir una prueba con ejemplos.

## Composición y el pipeline

El reporte de ventas tiene cinco pasos: conservar los pedidos pagados, calcular el total de cada línea, sumar los totales por categoría, ordenarlos, tomar los tres primeros.

En Elixir el operador pipe los escribe en el orden en que ocurren:

```elixir
orders
|> only_status("paid")
|> line_totals()
|> totals_by_category()
|> ranked()
|> Enum.take(top)
```

TypeScript no tiene un operador pipe, así que el mini-proyecto define una función `pipe`, que es una reducción sobre una lista de funciones:

```ts
pipe(onlyStatus("paid"), lineTotals, totalsByCategory, ranked, take(top))
```

`onlyStatus("paid")` y `take(top)` están en forma curried: la primera llamada fija una configuración y devuelve la función de un argumento que encaja en la cadena. El tipo de `pipe` exige que la salida de cada paso sea la entrada del siguiente, así que un paso en el lugar equivocado es un error de compilación.

Las dos implementaciones leen los mismos pedidos y el mismo reporte esperado de `cases.json`. Dos categorías empatan en 6000 centavos, y el ordenamiento desempata por el nombre para que el resultado no dependa del orden de la entrada.

## Qué probar

- Cambia `\d` por `\d+` en el decodificador con error y ejecuta la demo de nuevo: la propiedad pasa.
- Cambia `runString("abc", 6, 12)` por `runString("abc", 1, 9)`, una única secuencia de como máximo 9 caracteres: la propiedad pasa con el decodificador con error, porque el generador ya no puede construir la entrada que falla.
- Quita el desempate de `ranked` y mira qué prueba lo nota.
- Ejecuta `check` con otra semilla y compara el contraejemplo original y el reducido.

## Límites

La biblioteca es una versión didáctica. No tiene un parámetro de tamaño que crezca con la ejecución, ni combinadores de generadores como `map` y `filter` con reducción a través de ellos, y la reducción de textos tiene un candidato escrito para este codec (reemplazar todas las apariciones de una letra por la primera letra del alfabeto). Los proyectos reales deben usar fast-check en TypeScript o StreamData en Elixir.

## Temas del quiz relacionados

Área `functional-programming`: `pure-functions`, `higher-order-functions`, `composition-currying`, `side-effects`, `elixir-typescript-style`.
