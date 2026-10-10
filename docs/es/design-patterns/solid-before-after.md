# SOLID antes y después

> English version: [docs/en/design-patterns/solid-before-after.md](../../en/design-patterns/solid-before-after.md) · Versão em português: [docs/pt/design-patterns/solid-before-after.md](../../pt/design-patterns/solid-before-after.md)

Miniproyecto MP-PAT-2, en [`projects/design-patterns/solid-before-after`](../../../projects/design-patterns/solid-before-after). Enseña qué evita cada principio SOLID, midiendo el costo de un requisito nuevo en un módulo que viola el principio y en su refactorización.

## El método

Los principios son fáciles de recitar y difíciles de sentir. Este proyecto hace observable cada uno en tres pasos:

1. **Un módulo que viola el principio**, lo bastante pequeño para leerse en un minuto, con pruebas que documentan lo que hace.
2. **Una refactorización** que sigue el principio. Las pruebas del paso 1 se ejecutan contra ella sin cambios, que es la definición de refactorizar: la forma del código cambia y el comportamiento no.
3. **Un requisito nuevo**, y el diff que necesita en cada versión. El principio es la diferencia entre los dos diffs.

Los mismos cinco módulos existen en TypeScript (`ts/`) y en Java (`java/`).

## Los cinco módulos

### Responsabilidad única: una factura

`before` es una función que calcula el impuesto, escribe el recibo y construye el registro que se guarda. Tres asuntos, tres grupos de personas que pueden pedir un cambio, un solo lugar donde editar. `after` tiene `calculateTotals`, `formatReceipt` y `toRecord`, y un `issueInvoice` que solo los llama en orden.

Qué evita: un cambio en el diseño del recibo que rompe el impuesto, porque ambos viven entre las mismas variables locales.

### Abierto-cerrado: un descuento

`before` es una cadena de `if` sobre el tipo de cliente. `after` es una lista de objetos `DiscountRule` y un calculador que recorre la lista que recibió. Una prueba añade una regla `student` desde fuera, sin editar `src/`.

Qué evita: reabrir código probado por cada caso nuevo. Observa el límite: la lista de reglas por defecto se sigue editando en algún lugar cuando se ensambla la aplicación. El principio no elimina el cambio, elige dónde aterriza.

### Sustitución de Liskov: cuentas bancarias

`before` modela una cuenta a plazo fijo como una subclase de `Account` cuyo `withdraw` lanza una excepción. Desde entonces ningún cliente puede confiar en una `Account`, y ambos clientes comprueban `instanceof FixedTermAccount`. `after` tiene dos tipos: toda `Account` tiene un saldo, y solo una `Withdrawable` se puede retirar. Una cuenta a plazo fijo simplemente no es una `Withdrawable`. La factory clasifica cada cuenta una sola vez, y los clientes reciben listas cuyos tipos ya dicen qué se puede hacer.

Qué evita: un subtipo que rompe el código escrito para su tipo base, y las comprobaciones `instanceof` que se esparcen para compensar. Una prueba lee el código fuente y las cuenta: dos en `before`, ninguna en `after`.

### Segregación de interfaces: un catálogo de productos

`before` tiene un único `ProductCatalog` con `find`, `list`, `save` y `remove`. Un catálogo construido sobre el archivo CSV de un proveedor no puede escribir, así que su `save` y su `remove` lanzan una excepción. Un informe que solo lista sigue dependiendo de los cuatro métodos, y pasar el catálogo CSV a `increasePrices` compila y falla al ejecutarse. `after` tiene `ProductReader` y `ProductWriter`. El catálogo CSV es un lector, el informe pide un lector, y `increasePrices` pide ambos, así que el error es un error de compilación.

Qué evita: implementadores obligados a escribir métodos que no pueden cumplir, y clientes que dependen de métodos que nunca llaman. Los dobles de prueba lo muestran: cuatro métodos para el informe en `before`, dos en `after`.

### Inversión de dependencias: un checkout

`before` tiene un `CheckoutService` que crea un cliente SMTP y una tabla SQL por nombre. En `after` el servicio declara lo que necesita con sus propias palabras, `OrderStore` y `CustomerNotifier`, y los recibe por el constructor. `createCheckout` es la composition root: el único lugar que nombra los detalles concretos y los ajusta a esas interfaces.

Qué evita: una regla de negocio que no se puede probar ni reutilizar sin su infraestructura, y que cambia cuando cambia la infraestructura. Las interfaces pertenecen a la regla, no a los detalles: esa propiedad es lo que significa "inversión".

## Costo del cambio

| Principio | Requisito nuevo | `before` | `after` |
| --- | --- | --- | --- |
| SRP | el recibo también en HTML | 4 ediciones dentro de la función que contiene la regla del impuesto | 1 función nueva, nada editado |
| OCP | los estudiantes reciben 15% | se edita la función probada | 1 regla nueva, nada editado |
| LSP | una cuenta de depósito en garantía (escrow) que no se puede retirar | 1 clase nueva, la factory y todos los clientes | 1 clase nueva y la factory |
| ISP | el catálogo puede archivar un producto | la interfaz, ambos implementadores, todos los dobles de prueba | la interfaz de escritura y la clase que escribe |
| DIP | confirmar a través de una cola de mensajes | la regla de negocio y sus pruebas | la composition root |

Los diffs están en el [README](../../../projects/design-patterns/solid-before-after/README.es.md#costo-del-cambio). Son ilustraciones y no se aplican en el repositorio, excepto el de abierto-cerrado, que una prueba realiza.

Una lectura justa de la tabla: `after` tiene más tipos y más líneas que `before` en todos los módulos. Ese es el precio. Vale la pena donde requisitos como estos realmente llegan, y es un desperdicio donde nunca llegan.

## Qué cambia en Java

- **Un método rechazado.** `FixedTermAccount.withdraw` lanza `UnsupportedOperationException`, la misma excepción que lanza un `List` no modificable en `add`. Las colecciones del JDK son un ejemplo muy conocido de este compromiso.
- **Lector y escritor.** TypeScript escribe el parámetro como `ProductReader & ProductWriter`. Java no tiene ese tipo para un parámetro, y usa una cota genérica: `<C extends ProductReader & ProductWriter> void increasePrices(C catalog, int percent)`. No se necesita una tercera interfaz.
- **Composition root.** Las referencias a métodos y las lambdas (`table::insert`) hacen el papel de los literales de objeto de la versión en TypeScript.
- **Pruebas.** No hay biblioteca de pruebas: `SolidTest` tiene un `main`, y `Check` es un arnés de 30 líneas. Cada suite es un método que recibe el módulo como función y se llama dos veces.

## Cómo ejecutarlo

```sh
cd projects/design-patterns/solid-before-after
docker compose run --rm ts-test      # TypeScript tests
docker compose run --rm java-test    # Java tests
docker compose run --rm ts-demo      # same call on both versions, answers compared
```

Construir la imagen de Java ejecuta `gradle spotlessCheck testClasses`: Spotless 8.10.3 con google-java-format, y `javac -Xlint:all -Werror`. Ese paso necesita red una vez, para descargar el plugin. Todos los contenedores se ejecutan con `network_mode: none`.

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-PAT-2.1 | un módulo que viola cada principio, con pruebas que documentan el comportamiento actual | bloques `before` de `ts/tests/*.test.ts`, líneas `* before` de `SolidTest` |
| MP-PAT-2.2 | las mismas pruebas pasan después de cada refactorización | la misma función llamada con `after` en cada archivo |
| MP-PAT-2.3 | el README muestra, por principio, el diff necesario para un requisito nuevo antes y después | sección "Costo del cambio" de ambos README |

## Temas del quiz relacionados

`design-patterns` / `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion`.
