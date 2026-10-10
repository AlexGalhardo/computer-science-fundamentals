# Catálogo ejecutable de malos olores de código

> English version: [docs/en/oop/code-smells.md](../../en/oop/code-smells.md) · Versão em português: [docs/pt/oop/code-smells.md](../../pt/oop/code-smells.md)

Miniproyecto MP-OOP-2, en [`projects/oop/code-smells`](../../../projects/oop/code-smells). Enseña a reconocer malos olores comunes y a eliminarlos. Lenguajes: TypeScript y Java.

## Un mal olor no es un error

Un mal olor es un síntoma en código que funciona. El programa da las respuestas correctas y las pruebas pasan, pero la estructura hace que el siguiente cambio sea lento o arriesgado. Por eso cada entrada de este catálogo tiene dos versiones con comportamiento idéntico, `before` y `after`, y una suite de pruebas que corre en ambas.

Esa suite compartida también es la definición de refactorización: cambiar la estructura sin cambiar el comportamiento. Si hay que editar una prueba para que la versión nueva pase, el cambio no fue una refactorización.

## Las seis entradas

### Método Largo, eliminado con Extraer Método

`formatReceipt` valida un pedido, calcula el subtotal, el descuento y el envío, y arma el texto, todo en una sola función. Los comentarios `// validate`, `// discount`, `// shipping` son el síntoma: cada uno marca una función a la que nunca se le dio nombre. Después de la refactorización cada bloque es una función con nombre y `formatReceipt` se lee como un resumen. La ganancia se ve en las pruebas: la regla de envío se puede verificar con una sola llamada, sin construir un pedido ni leer la respuesta dentro de un string.

### Clase Dios, eliminada con Extraer Clase

`GodShop` guarda el inventario, conoce los precios, numera los pedidos, escribe correos electrónicos y arma el informe de ventas. Tiene cinco razones para cambiar, y cualquier método puede tocar cualquier campo. Después de la refactorización hay cuatro clases pequeñas (`Inventory`, `PriceList`, `Outbox`, `SalesLedger`), cada una con estado privado, y un coordinador que las recibe ya armadas. La cohesión subió: cada campo de una clase es usado ahora por cada método de esa clase. El código quedó más largo, de 60 a 105 líneas, que es el precio honesto de darle a cada responsabilidad un nombre y un límite.

### Envidia de Características, eliminada con Mover Método

`InvoicePrinter.render` no tiene datos propios. Lee `invoice.customer.address.zip` y formatea un código postal, multiplica los campos de una línea, suma las líneas. El comportamiento está en una clase y los datos que necesita están en otras. Después de la refactorización `Address.label()`, `InvoiceLine.totalCents()` e `Invoice.render()` viven junto a los datos que usan, los campos son privados, y se puede producir una etiqueta de envío sin ninguna factura a la vista. Esto es "tell, don't ask".

### Cirugía con Escopeta, eliminada dándole un hogar al conocimiento

Tres módulos muestran dinero, y cada uno lleva su propia copia del formato (símbolo, coma decimal, un punto cada tres dígitos), cada una escrita un poco distinta. Cambiar la moneda significa encontrar y editar los tres. Después de la refactorización `money.ts` es dueño del formato. Una prueba lee los archivos fuente y cuenta dónde se escribe el símbolo de la moneda: tres archivos antes, uno después. Ese número es el tamaño de la cirugía.

### Obsesión con los Primitivos, eliminada con tipos pequeños

Un correo electrónico y un teléfono se pasan como strings. Nada dice si un string dado ya fue verificado, así que cada función verifica de nuevo, y el compilador no distingue un correo de un teléfono. Después de la refactorización `Email` y `Phone` son tipos cuya única entrada es una función que valida, así que un valor que existe es válido, y la regla se escribe una sola vez.

La lección cambia con el lenguaje. Los tipos de Java son nominales: `record Email(String value)` y `record Phone(String digits)` son tipos distintos porque tienen nombres distintos, y la construcción de la imagen lo prueba verificando que `javac` rechaza un archivo con argumentos intercambiados. Los tipos de TypeScript son estructurales: dos clases con un string público cada una serían intercambiables. Un miembro privado es lo que hace que cada clase sea compatible solo consigo misma, y una línea `@ts-expect-error` verificada por `tsc` en la construcción de la imagen prueba que el intercambio ya no compila.

### Cadena de condicionales sobre un código de tipo, eliminada con polimorfismo

El costo, el plazo y el código de seguimiento de una entrega dependen cada uno de su tipo, y cada uno se calcula con su propia cadena `if / else if`. Agregar un tipo significa editar todas las cadenas. Después de la refactorización cada tipo es una clase que implementa `DeliveryMethod`, y el checkout llama a la interfaz.

Se midió agregar un cuarto tipo en una copia de borrador: cuatro archivos existentes editados en la versión con condicionales, un archivo nuevo y nada más en la refactorizada. El diff está en el [README](../../../projects/oop/code-smells/README.es.md#polimorfismo-en-lugar-de-una-cadena-de-condicionales-el-diff), y una prueba mantiene verdadera la afirmación declarando un tipo nuevo dentro del archivo de prueba.

El intercambio no es gratis. Con condicionales, una pregunta nueva sobre todos los tipos es una función nueva. Con polimorfismo es una edición de la interfaz y de cada clase. Elige según lo que cambie con más frecuencia.

## Más pequeño no es el objetivo

La demo imprime el tamaño de ambas versiones de cada entrada. Solo eliminar la duplicación hizo el código más corto. Las otras refactorizaciones mantuvieron el tamaño o crecieron. Lo que cambian es dónde cae un cambio: en un solo lugar con nombre en vez de varios anónimos.

## Cómo ejecutar

```sh
./setup-unix-code-smells.sh        # Linux y macOS
./setup-windows-code-smells.ps1    # Windows
```

Solo se requiere Docker. Las construcciones de las imágenes ejecutan el verificador de tipos, la verificación de formato y la prueba negativa de compilación; luego corren las pruebas de ambos lenguajes y la demo imprime el catálogo.

## Temas relacionados del quiz

`oop`: `coupling-cohesion-code-smells`, `polymorphism-dynamic-dispatch`.
