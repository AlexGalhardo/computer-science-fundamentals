# El mismo dominio con objetos y con funciones

> English version: [docs/en/oop/oop-vs-functional.md](../../en/oop/oop-vs-functional.md) · Versão em português: [docs/pt/oop/oop-vs-functional.md](../../pt/oop/oop-vs-functional.md)

Miniproyecto MP-OOP-1, en [`projects/oop/oop-vs-functional`](../../../projects/oop/oop-vs-functional). Enseña qué cambia cuando las mismas reglas se escriben con objetos o con funciones. Lenguajes: Java, TypeScript y Elixir.

## Un problema, cuatro programas

Un carrito de compras tiene líneas, una lista ordenada de reglas de descuento (cupón porcentual, cupón de valor fijo, descuento por volumen, lleve y pague) y una política de impuestos. Las reglas están en el README del miniproyecto. El carrito se escribe cuatro veces:

| Estilo | Lenguaje | Dónde |
| --- | --- | --- |
| Objetos | Java | `java/src/cart/` |
| Objetos | TypeScript | `ts/src/oop/` |
| Funciones | TypeScript | `ts/src/functional/cart.ts` |
| Funciones | Elixir | `elixir/lib/cart.ex` |

TypeScript aparece dos veces a propósito: con el lenguaje fijo, toda diferencia entre `ts/src/oop` y `ts/src/functional` viene del estilo. Java muestra el estilo con objetos en un lenguaje construido en torno a él, con tipos nominales, records y modificadores de acceso verificados. Elixir muestra el estilo funcional en un lenguaje en el que es el único: no hay clases ni forma de cambiar un valor en el mismo lugar.

Las cuatro leen [`scenarios.txt`](../../../projects/oop/oop-vs-functional/scenarios.txt), un archivo de texto simple con 15 escenarios, y deben producir los mismos recibos. Ese archivo es lo que hace de "las mismas reglas" una afirmación verificada y no una intención.

## Dónde vive el estado

Con objetos, el carrito es una cosa con identidad. Sus líneas son un campo privado, `add` modifica el objeto, y toda variable que se refiere al carrito ve la línea nueva. El encapsulamiento es lo que mantiene esto seguro: nadie fuera de la clase puede tocar la lista, y `lines()` entrega una copia (TypeScript) o una vista de solo lectura (Java).

Con funciones, el carrito es un valor. `addLine(cart, line)` construye un carrito nuevo y deja como estaba el que recibió. No hay nada que proteger, porque no hay nada que se pueda modificar. Armar un carrito es una cadena: cada paso recibe el valor que devolvió el paso anterior.

```ts
// objetos                                  // funciones
const cart = new Cart();                    const cart = addLine(emptyCart, line);
cart.add(new CartLine("PEN", 250, 4));      // emptyCart sigue vacío
```

Las pruebas hacen observable la diferencia. La versión funcional en TypeScript corre sobre una entrada congelada en profundidad, así que una sola escritura en cualquier parte lanzaría un error. En Elixir la garantía viene del lenguaje, y la prueba solo la muestra.

## Cómo se elige una regla

Con objetos, cada regla es una clase que implementa `DiscountRule`. El carrito recorre la lista y llama a `discountCents` y `describe`. Qué código se ejecuta lo decide en tiempo de ejecución la clase de cada objeto: despacho dinámico. El carrito nunca nombra una regla concreta.

Con funciones, una regla es un dato con una etiqueta: `{ kind: "bulk", ... }` en TypeScript, `{:bulk, sku, min, percent}` en Elixir. La función `discountCents` mira la etiqueta y elige la rama: un `switch` en TypeScript, una cláusula de función por forma en Elixir. Esto es pattern matching, y hace el trabajo del despacho dinámico desde el otro lado: la función conoce todas las variantes, en lugar de que cada variante conozca su código.

## Cómo se rechaza un valor inválido

Con objetos, el constructor valida y lanza un error. `new CartLine("PEN", 250, 0)` nunca retorna, así que no existe ninguna línea inválida y ninguna otra clase vuelve a verificar.

Con funciones, los datos son solo datos, así que se puede escribir una línea inválida. `price` valida y devuelve `{ ok: true, receipt }` o `{ ok: false, error }` (`{:ok, receipt}` o `{:error, code}` en Elixir). El error es un valor, y el tipo obliga a quien llama a mirar cuál de los dos volvió.

## Qué cambio es barato

"Lleve y pague" se agregó al final, para medir esto. Con objetos es un archivo nuevo y ninguna edición al código de producción existente: el principio abierto-cerrado en acción. Con funciones son cuatro ediciones dentro de un archivo existente: el tipo, la validación, `discountCents` y `describe`.

El cambio opuesto tiene el costo opuesto. Una operación nueva sobre todas las reglas es una función nueva en las versiones funcionales, y una edición a la interfaz y a las cuatro clases en las versiones con objetos. Los objetos agrupan el código por variante, las funciones agrupan el código por operación, y cada uno hace barato un sentido de crecimiento. Este es el problema de la expresión (expression problem). La pregunta que hay que hacerle a un diseño es en qué sentido se espera que crezca.

Cuando se olvida un caso, las versiones con objetos no compilan (a la clase le falta un método). La versión funcional en TypeScript tampoco compila, gracias a una verificación de exhaustividad en cada `switch`. En Elixir la brecha aparece en tiempo de ejecución, así que las pruebas cargan con ese peso.

## Comparación medida

`docker compose run --rm compare` cuenta archivos, líneas de código y tipos con nombre del código de producción de cada versión e imprime la tabla versionada en `results/comparison.md`. Una prueba falla si la tabla y el código discrepan. Los números actuales y su lectura están en el [README](../../../projects/oop/oop-vs-functional/README.es.md#comparación).

Lee los números con cuidado: describen cuatro programas pequeños, no dos paradigmas. Las versiones con objetos son más largas sobre todo porque nombran más cosas, y los nombres también son donde un lector encuentra su camino en un sistema grande.

## Cómo ejecutar

```sh
./setup-unix-oop-vs-functional.sh        # Linux y macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

Solo se requiere Docker. El script ejecuta las pruebas de los tres lenguajes, la demo y la comparación.

## Temas relacionados del quiz

`oop`: `classes-objects-encapsulation`, `polymorphism-dynamic-dispatch`, `abstraction-interfaces-abstract-classes`, `composition-vs-inheritance`, `oop-across-languages`.
