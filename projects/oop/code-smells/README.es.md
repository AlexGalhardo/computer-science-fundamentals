# code-smells

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un catálogo ejecutable de code smells (malos olores de código). Cada entrada tiene una versión `before`, que funciona y huele mal, una versión `after`, con el mal olor eliminado, y **una suite de tests que corre en ambas**. Enseña **cómo reconocer malos olores comunes y eliminarlos sin cambiar el comportamiento**: los tests que pasan antes de la refactorización son los mismos que pasan después.

Explicación completa: [docs/es/oop/code-smells.md](../../../docs/es/oop/code-smells.md).

## El catálogo

| Mal olor | El síntoma en `before` | Refactorización en `after` | Lenguaje |
| --- | --- | --- | --- |
| [Método Largo](ts/src/long-method) | una función valida, calcula y formatea, dividida por comentarios | Extraer Método | TypeScript |
| [Clase Dios](ts/src/god-class) | una clase guarda stock, precios, numeración de pedidos, correos y el reporte | Extraer Clase | TypeScript |
| [Envidia de Características](ts/src/feature-envy) | un impresor que solo lee otros objetos, tres puntos adentro | Mover Método | TypeScript |
| [Cirugía con Escopeta](ts/src/shotgun-surgery) | el formato de dinero está copiado en tres módulos | un módulo es dueño del conocimiento | TypeScript |
| [Obsesión por los Primitivos](ts/src/primitive-obsession) | el correo y el teléfono son strings, verificadas de nuevo en cada función | tipos pequeños (objetos de valor) | TypeScript, Java |
| [Cadena de condicionales sobre un código de tipo](ts/src/conditional-to-polymorphism) | el mismo `if / else if` sobre el tipo de entrega en tres archivos | Reemplazar Condicional por Polimorfismo | TypeScript, Java |

TypeScript es la referencia y tiene las seis. Java repite las dos entradas en las que el lenguaje cambia la lección: sus tipos son nominales, así que dos records que guardan un `String` cada uno son tipos distintos sin trabajo extra, y el compilador rechaza los argumentos intercambiados; y `enum` con `interface` es el par idiomático para el ejemplo de los condicionales.

## Temas del quiz que demuestra

- `oop` / `coupling-cohesion-code-smells`: cohesión, qué es un mal olor, Clase Dios, Envidia de Características, Cirugía con Escopeta, Obsesión por los Primitivos, Método Largo y Extraer Método.
- `oop` / `polymorphism-dynamic-dispatch`: reemplazar una cadena de condicionales por una clase por variante, de modo que una variante nueva sea código nuevo y no una edición.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-code-smells.sh        # Linux y macOS
./setup-windows-code-smells.ps1    # Windows
```

El script construye las dos imágenes (la verificación de tipos, la de formato y un test negativo de compilación ocurren durante el build), ejecuta los tests de ambos lenguajes e imprime el catálogo.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/<smell>/contract.ts` | el comportamiento que ambas versiones deben tener, como un tipo |
| `ts/src/<smell>/before.ts` o `before/` | la versión con el mal olor, marcada con `SMELL` en un comentario |
| `ts/src/<smell>/after.ts` o `after/` | la versión refactorizada, marcada con `REFACTORED` |
| `ts/tests/<smell>.test.ts` | la suite compartida, más lo que solo la versión refactorizada permite |
| `ts/src/demo.ts` | imprime el catálogo con el tamaño de cada versión |
| `java/src/primitive_obsession/`, `java/src/conditional_to_polymorphism/` | las dos entradas en Java, ambas versiones lado a lado |
| `java/src/tests/SmellTests.java` | las mismas verificaciones llamadas una vez por versión |
| `java/negative/SwappedArguments.java` | un archivo que no debe compilar |

Imágenes: `oven/bun:1.4.2` y `gradle:9.8.0-jdk25` (Spotless 8.10.3 con google-java-format, usado solo para verificar el formato). El lado TypeScript tiene dos dependencias de desarrollo, fijadas: `typescript` 7.0.2 y `@types/bun` 1.4.2, las mismas versiones de la raíz del repositorio. Están ahí para que la imagen pueda ejecutar `tsc`, que es lo que prueba las afirmaciones sobre tipos. No hay dependencia de ejecución.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

- **Los mismos tests en ambas versiones.** Cada suite se escribe contra el contrato y corre una vez en `before` y una vez en `after` (`describe.each` en TypeScript, un método llamado dos veces en Java). 57 tests en TypeScript, 30 verificaciones en Java.
- **Lo que solo `after` permite.** La regla de envío probada sin un recibo, la regla de stock probada sin precios ni correos, una etiqueta de dirección sin factura.
- **El mal olor, medido.** Para la Cirugía con Escopeta un test lee los fuentes y cuenta los archivos que contienen el símbolo de la moneda: tres antes, uno después.
- **Una variante nueva que viene de afuera.** En el ejemplo de los condicionales un cuarto tipo de entrega se escribe dentro del archivo de test. El checkout refactorizado lo atiende sin ninguna edición; la versión con condicionales lanza un error.
- **Tests a nivel de tipos.** En TypeScript una línea `@ts-expect-error` afirma que pasar un `Phone` donde se espera un `Email` no debe compilar, y el build de la imagen ejecuta `tsc`. En Java el build ejecuta `javac` sobre `negative/SwappedArguments.java` y falla si el archivo es aceptado.

## Demo

```sh
docker compose run --rm ts-demo
```

```text
== god-class -> Extract Class
  before: 1 file(s), 60 lines of code
  after:  1 file(s), 105 lines of code
  output: To: ana@shop.example | Order ORD-1: 2 x PEN, total 5.00 / To: stock@shop.example | PEN is sold out
  same output in both versions: yes
== shotgun-surgery -> Move the knowledge to one place
  before: 4 file(s), 37 lines of code
  after:  5 file(s), 24 lines of code
  output: Total: R$ 1.234,61
  same output in both versions: yes
```

Tamaño de ambas versiones, tomado de la demo (los comentarios y las líneas en blanco no cuentan):

| Mal olor | Antes | Después |
| --- | --- | --- |
| long-method | 1 archivo, 45 líneas | 1 archivo, 46 líneas |
| god-class | 1 archivo, 60 líneas | 1 archivo, 105 líneas |
| feature-envy | 1 archivo, 54 líneas | 1 archivo, 76 líneas |
| shotgun-surgery | 4 archivos, 37 líneas | 5 archivos, 24 líneas |
| primitive-obsession | 1 archivo, 42 líneas | 1 archivo, 57 líneas |
| conditional-to-polymorphism | 5 archivos, 44 líneas | 4 archivos, 45 líneas |

Solo una refactorización acortó el código, la que eliminó duplicación. Las otras mantuvieron el tamaño o crecieron, porque le dan nombre a cosas que no lo tenían: un método, una clase, un tipo. Lo que mejora es dónde cae un cambio, y la próxima sección lo mide.

## Polimorfismo en lugar de una cadena de condicionales: el diff

Ambas versiones del ejemplo de entrega se extendieron con un cuarto tipo, `drone`, en una copia de borrador, y se compararon con `git diff --stat`.

**Antes**, con condicionales: 4 archivos existentes editados.

```text
 before/cost.ts     | 2 ++
 before/eta.ts      | 2 ++
 before/kind.ts     | 2 +-
 before/tracking.ts | 2 ++
 4 files changed, 7 insertions(+), 1 deletion(-)
```

```diff
--- a/before/kind.ts
-export type Kind = "standard" | "express" | "pickup";
+export type Kind = "standard" | "express" | "pickup" | "drone";
--- a/before/cost.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 4000 + 2 * grams;
 	}
--- a/before/eta.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 0;
 	}
--- a/before/tracking.ts
 	} else if (kind === "pickup") {
 		return `PK-${number}`;
+	} else if (kind === "drone") {
+		return `DR-${number}`;
 	}
```

Si se olvida una de las tres cadenas el código sigue compilando, y el pedido falla en tiempo de ejecución con `unknown delivery kind: drone`.

**Después**, con polimorfismo: 1 archivo nuevo, ningún archivo existente tocado.

```text
 after/drone.ts | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
```

```diff
--- /dev/null
+++ b/after/drone.ts
+import type { DeliveryMethod } from "./delivery-method";
+
+export class Drone implements DeliveryMethod {
+	readonly name = "drone";
+	readonly trackingPrefix = "DR";
+
+	costCents(grams: number): number {
+		return 4000 + 2 * grams;
+	}
+
+	days(): number {
+		return 0;
+	}
+}
```

Si se olvida un método la clase no compila. El test "adding a variant" en [`conditional-to-polymorphism.test.ts`](ts/tests/conditional-to-polymorphism.test.ts) mantiene verificada esta afirmación: declara `Drone` dentro del archivo de test, y el `shippingLine` refactorizado lo atiende.

El costo es la imagen en el espejo: una cuarta pregunta hecha a todos los tipos (por ejemplo, "¿tiene seguro?") es una función nueva en la versión con condicionales, y una edición en la interfaz y en todas las clases en la versión refactorizada. El polimorfismo vale la pena cuando se agregan tipos con más frecuencia que preguntas.
