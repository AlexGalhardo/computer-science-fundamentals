# oop-vs-functional

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un carrito de compras, con descuentos, cupones e impuestos, escrito cuatro veces: con objetos en Java y en TypeScript, y con funciones sobre datos inmutables en TypeScript y en Elixir. Enseña **qué cambia cuando las mismas reglas se escriben con objetos o con funciones**: dónde vive el estado, cómo se elige una regla (despacho dinámico o pattern matching), cómo se rechaza un valor inválido (excepción o valor) y qué tipo de cambio es barato en cada estilo.

Las cuatro implementaciones leen el mismo archivo, [`scenarios.txt`](scenarios.txt), y deben imprimir los mismos recibos.

Explicación completa: [docs/es/oop/oop-vs-functional.md](../../../docs/es/oop/oop-vs-functional.md).

## El dominio

Los valores son centavos enteros. Un carrito tiene líneas (producto, precio unitario, cantidad), una lista ordenada de reglas de descuento y una política de impuestos.

| Regla | Ejemplo en `scenarios.txt` | Descuenta |
| --- | --- | --- |
| Cupón porcentual | `rule percent-coupon WELCOME10 10` | 10% de lo que todavía falta por pagar |
| Cupón de valor fijo | `rule fixed-coupon FIVE 500` | 5,00, nunca más de lo que todavía falta por pagar |
| Descuento por volumen | `rule bulk PEN 10 20` | 20% de las líneas de PEN con 10 unidades o más |
| Lleve y pague | `rule take-pay TEE 3 2` | una TEE gratis por cada grupo completo de 3 |

Las reglas se aplican en el orden en que se agregaron, cada una sobre lo que dejaron las anteriores, así que el orden cambia el total. El impuesto (`tax flat 825` es 8,25%) se cobra después de los descuentos y redondea medio centavo hacia arriba.

## Temas del quiz que demuestra

- `oop` / `classes-objects-encapsulation`: estado privado, un getter que entrega una copia, objetos válidos desde el constructor, "tell, don't ask", valores inmutables.
- `oop` / `polymorphism-dynamic-dispatch`: una lista de reglas detrás de una interfaz, cada objeto respondiendo a la misma llamada a su manera.
- `oop` / `abstraction-interfaces-abstract-classes`: la interfaz como contrato, y depender de una abstracción en lugar de una clase concreta.
- `oop` / `composition-vs-inheritance`: el carrito tiene una política de impuestos y puede reemplazarla en un objeto vivo.
- `oop` / `oop-across-languages`: tipado estructural en TypeScript, y el mismo polimorfismo mediante pattern matching en Elixir (el problema de la expresión).

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-oop-vs-functional.sh        # Linux y macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

El script construye las tres imágenes, ejecuta las pruebas de los tres lenguajes, imprime el recibo de cada escenario e imprime la tabla de comparación.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `scenarios.txt` | los escenarios de aceptación compartidos: 10 recibos y 5 rechazos |
| `java/src/cart/` | objetos en Java: `Cart`, `CartLine`, la interfaz `DiscountRule` con cuatro clases, la interfaz `TaxPolicy` con dos |
| `ts/src/oop/` | el mismo diseño en TypeScript, una regla por archivo en `rules/` |
| `ts/src/functional/cart.ts` | funciones en TypeScript: tipos de solo lectura, una unión de variantes de regla, funciones puras |
| `elixir/lib/cart.ex` | funciones en Elixir: mapas, tuplas etiquetadas, una cláusula de función por variante |
| `ts/src/run.ts` | el código cliente de las dos versiones en TypeScript, lado a lado |
| `ts/src/compare.ts`, `results/comparison.md` | la medición detrás de la tabla de abajo |
| `java/src/support/`, `ts/src/scenarios.ts`, `elixir/lib/scenarios.ex` | lectores de `scenarios.txt`, pruebas y demos (no medidos) |

Imágenes: `gradle:9.8.0-jdk25` (Spotless 8.10.3 con google-java-format, usado solo para verificar el formato), `oven/bun:1.4.2` y `elixir:1.20.4-otp-28-slim`. Ninguna implementación depende de bibliotecas.

## Pruebas

```sh
docker compose run --rm java-test
docker compose run --rm elixir-test
docker compose run --rm ts-test
```

- **Escenarios compartidos.** Cada lenguaje ejecuta los 15 escenarios de `scenarios.txt`. En TypeScript cada escenario corre dos veces, una por estilo.
- **Ninguna entrada se muta.** En TypeScript la versión funcional recibe una entrada congelada en profundidad (`Object.freeze` en cada nivel, de modo que cualquier escritura lanzaría un error) y los argumentos se comparan con una instantánea tomada antes de las llamadas. En Elixir la inmutabilidad pertenece al lenguaje; la prueba muestra el mismo nombre todavía ligado al mismo valor después de que cuatro funciones lo "cambiaron".
- **El contraste.** Una segunda referencia al carrito de objetos ve la línea agregada. El carrito funcional que se tenía antes de la adición no la ve.
- **Encapsulamiento y polimorfismo.** La lista que devuelve el carrito no sirve para modificarlo, y el carrito acepta una regla que nunca ha visto.
- **La tabla está al día.** Una prueba falla cuando `results/comparison.md` ya no coincide con el código.

La construcción de la imagen de Java también ejecuta `spotlessCheck` y compila con `-Xlint:all -Werror`. La ejecución de Elixir también verifica `mix format --check-formatted`.

## Demo

```sh
docker compose run --rm ts-demo       # todos los recibos, y si los dos estilos coinciden
docker compose run --rm java-demo     # los mismos recibos, desde Java
docker compose run --rm elixir-demo   # los mismos recibos, desde Elixir
```

```text
== everything together
  subtotal 160.00
  - 6.00  bulk PEN: 20% off from 10 units
  - 30.00  TEE: take 3, pay 2
  - 12.40  coupon WELCOME10: 10% off
  - 5.00  coupon FIVE: 5.00 off
  tax 8.79
  total 115.39
  objects and functions agree: yes
```

## Comparación

Medido con `docker compose run --rm compare` solo sobre el código de producción del carrito: sin pruebas, sin lector de escenarios, sin comentarios, sin líneas en blanco. La copia verificada es [`results/comparison.md`](results/comparison.md).

| Implementación | Archivos | Líneas de código | Tipos con nombre |
| --- | --- | --- | --- |
| Java, objetos | 13 | 196 | 13 |
| TypeScript, objetos | 8 | 196 | 14 |
| TypeScript, funciones | 1 | 136 | 9 |
| Elixir, funciones | 1 | 116 | 7 |

Los números describen este código, no los paradigmas en general. Lo que muestran: las versiones con objetos gastan sus líneas extra en dar nombre a las cosas (una clase y un archivo por regla, campos privados, constructores), y las versiones funcionales mantienen todas las reglas de una operación en un solo lugar.

| Pregunta | Objetos (Java, TypeScript) | Funciones (TypeScript, Elixir) |
| --- | --- | --- |
| ¿Dónde está el estado? | Dentro del carrito, privado. `add` modifica el objeto | En el valor que se pasa de mano en mano. `addLine` devuelve un carrito nuevo |
| ¿Cómo se elige la regla? | Despacho dinámico según la clase del objeto de regla | `switch` sobre `kind` (TypeScript), cláusula de función sobre la etiqueta (Elixir) |
| ¿Cómo se rechaza un valor inválido? | El constructor lanza un error: el objeto inválido nunca existe | `price` devuelve un valor de error que quien llama debe verificar |
| **¿Cómo se agrega una regla nueva?** | **Un archivo nuevo. No se edita ningún archivo de producción existente** | **Ningún archivo nuevo. Se edita un archivo existente en cuatro lugares** |
| ¿Cómo se agrega una operación nueva sobre las reglas? | Se editan la interfaz y cada clase de regla | Una función nueva. No se edita ninguna función existente |
| ¿Quién encuentra un caso olvidado? | El compilador: la clase nueva no compila sin los dos métodos | TypeScript: la verificación con `never` en cada `switch`. Elixir: una prueba, en tiempo de ejecución |

### Agregar una regla, medido

"Lleve y pague" fue la última regla agregada. Estos son los cambios que necesitó en el código de producción.

Con objetos, un archivo nuevo, [`TakePayDiscount.java`](java/src/cart/TakePayDiscount.java) (y [`take-pay-discount.ts`](ts/src/oop/rules/take-pay-discount.ts)), y nada más:

```diff
+ public final class TakePayDiscount implements DiscountRule {
+   public TakePayDiscount(String sku, int take, int pay) { ... }
+   @Override public int discountCents(List<CartLine> lines, int runningCents) { ... }
+   @Override public String describe() { ... }
+ }
```

Con funciones, cuatro ediciones dentro del [`cart.ts`](ts/src/functional/cart.ts) existente (y las mismas cuatro en [`cart.ex`](elixir/lib/cart.ex)):

```diff
  export type Rule =
  	| Readonly<{ kind: "bulk"; sku: string; minQuantity: number; percent: number }>
+ 	| Readonly<{ kind: "take-pay"; sku: string; take: number; pay: number }>;

  function ruleError(rule: Rule): CartErrorCode | undefined {
+ 		case "take-pay":
+ 			return isCount(rule.take, 1) && isCount(rule.pay, 1) && rule.pay < rule.take ? undefined : "invalid-rule";

  export function discountCents(rule: Rule, lines: readonly Line[], runningCents: number): number {
+ 		case "take-pay":
+ 			return lines.filter(...).reduce(...);

  export function describe(rule: Rule): string {
+ 		case "take-pay":
+ 			return `${rule.sku}: take ${rule.take}, pay ${rule.pay}`;
```

En ambos estilos se necesita una línea más donde la regla se crea a partir del archivo de escenarios, que es código de apoyo.

El cambio opuesto tiene el costo opuesto. Una tercera operación sobre las reglas, por ejemplo `explain`, sería una función nueva en las versiones funcionales, y un método nuevo en la interfaz más uno en cada una de las cuatro clases en las versiones con objetos. Este intercambio se conoce como el problema de la expresión (expression problem).
