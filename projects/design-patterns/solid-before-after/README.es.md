# solid-before-after

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un módulo pequeño por cada principio SOLID, dos veces: una versión que viola el principio (`before`) y su refactorización (`after`). Las **mismas pruebas** se ejecutan contra ambas, así que queda demostrado que la refactorización conserva el comportamiento. Enseña **qué evita cada principio**, medido por el diff que un requisito nuevo necesita en cada versión.

Explicación completa: [docs/es/design-patterns/solid-before-after.md](../../../docs/es/design-patterns/solid-before-after.md).

## Temas del quiz que demuestra

- `design-patterns` / `single-responsibility`: motivos para cambiar, cohesión.
- `design-patterns` / `open-closed`: puntos de extensión, condicionales sobre un tipo.
- `design-patterns` / `liskov-substitution`: un subtipo que no puede mantener una promesa heredada, `instanceof` en los clientes.
- `design-patterns` / `interface-segregation`: interfaces gordas, el tipo de parámetro más estrecho.
- `design-patterns` / `dependency-inversion`: quién es dueño de la abstracción, la composition root.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-solid-before-after.sh        # Linux and macOS
./setup-windows-solid-before-after.ps1    # Windows
```

El script construye ambas imágenes, ejecuta las pruebas en TypeScript y en Java y ejecuta la demo.

## Estructura

| Principio | Módulo | TypeScript | Java |
| --- | --- | --- | --- |
| Responsabilidad única | emitir una factura: impuesto, texto del recibo, registro guardado | `ts/src/srp/` | `solid/srp/` |
| Abierto-cerrado | descuento por tipo de cliente | `ts/src/ocp/` | `solid/ocp/` |
| Sustitución de Liskov | cuentas bancarias, una de las cuales no se puede retirar | `ts/src/lsp/` | `solid/lsp/` |
| Segregación de interfaces | un catálogo de productos con lectores y escritores | `ts/src/isp/` | `solid/isp/` |
| Inversión de dependencias | un checkout que guarda un pedido y avisa al cliente | `ts/src/dip/` | `solid/dip/` |

Cada carpeta de TypeScript tiene `before.ts` y `after.ts` (más los datos compartidos). Cada paquete Java, bajo `java/src/main/java/`, tiene `XxxBefore.java` y `XxxAfter.java`. TypeScript es la referencia. Java está aquí porque la lección cambia con los tipos nominales: un método rechazado se convierte en `UnsupportedOperationException`, como en las listas no modificables del propio JDK, y "lector y escritor" necesita una cota genérica, `<C extends ProductReader & ProductWriter>`.

Imágenes: `oven/bun:1.4.2` y `gradle:9.8.0-jdk25`. Sin dependencias de biblioteca en ninguno de los dos lenguajes. El único plugin de construcción es Spotless 8.10.3 con google-java-format, que la construcción de la imagen de Java ejecuta como comprobación, junto con `javac -Xlint:all -Werror`.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

En `ts/tests/<principle>.test.ts` una función describe el comportamiento del módulo y se llama dos veces, con `before` y con `after`. Las pruebas de Java (`java/src/test/java/solid/SolidTest.java`) hacen lo mismo con un arnés de 30 líneas en lugar de una biblioteca de pruebas. Unas pocas pruebas adicionales muestran lo que solo permite la versión refactorizada, como probar la regla del checkout sin ninguna clase de infraestructura.

## Demo

```sh
docker compose run --rm ts-demo
```

Para cada principio ejecuta la misma llamada en ambas versiones, imprime las dos respuestas y dice si son iguales.

## Costo del cambio

Para cada principio, un requisito nuevo y el diff que necesita en cada versión en TypeScript. Los diffs son ilustraciones: no se aplican en el repositorio, para que puedas probarlos tú mismo y ejecutar las pruebas. La excepción es el de abierto-cerrado, que `ts/tests/ocp.test.ts` realiza de verdad desde fuera.

| Principio | Requisito nuevo | `before`: qué se edita | `after`: qué se edita |
| --- | --- | --- | --- |
| SRP | el recibo también en HTML | 4 lugares dentro de la función que también contiene la regla del impuesto | nada: 1 función nueva |
| OCP | los estudiantes reciben 15% | la función probada | nada: 1 regla nueva |
| LSP | una cuenta de depósito en garantía (escrow) que no se puede retirar | 1 clase nueva, la factory y **todos los clientes** | 1 clase nueva y la factory |
| ISP | el catálogo puede archivar un producto | la interfaz, **ambos** implementadores y todo doble de prueba | la interfaz de escritura y la única clase que escribe |
| DIP | confirmar a través de una cola de mensajes, no de SMTP | la regla de negocio y sus pruebas | la composition root |

### Responsabilidad única: el recibo también en HTML

`before.ts`: el cambio se esparce por la función que también calcula el impuesto y construye el registro guardado.

```diff
-export function issueInvoice(order: Order): IssuedInvoice {
+export function issueInvoice(order: Order, format: "text" | "html" = "text"): IssuedInvoice {
 	...
 	const receiptLines = [`Invoice ${order.id} for ${order.customer}`];
+	const htmlRows: string[] = [];
 	for (const line of order.lines) {
 		const lineTotal = line.quantity * line.unitCents;
 		subtotal += lineTotal;
 		receiptLines.push(`${line.quantity} x ${line.description} @ ...`);
+		htmlRows.push(`<tr><td>${line.description}</td><td>${money(lineTotal)}</td></tr>`);
 	}
 	...
 	return {
 		totalCents: total,
-		receipt: receiptLines.join("\n"),
+		receipt: format === "html" ? `<table>${htmlRows.join("")}</table>` : receiptLines.join("\n"),
 		record: `${order.id};${order.customer};${order.state};${total}`,
 	};
```

`after.ts`: una función nueva. `calculateTotals`, `formatReceipt` y `toRecord` no se tocan, así que sus pruebas no pueden romperse.

```diff
+export function formatReceiptHtml(order: Order, totals: Totals): string {
+	const rows = order.lines.map(
+		(line) => `<tr><td>${line.description}</td><td>${money(line.quantity * line.unitCents)}</td></tr>`,
+	);
+	return `<table>${rows.join("")}<tr><td>Total</td><td>${money(totals.totalCents)}</td></tr></table>`;
+}
```

### Abierto-cerrado: los estudiantes reciben 15%

`before.ts`: se vuelve a abrir la función que ya funciona.

```diff
 	if (kind === "employee") {
 		return Math.round(totalCents * 0.3);
 	}
+	if (kind === "student") {
+		return Math.round(totalCents * 0.15);
+	}
 	throw new Error(`unknown customer kind: ${kind}`);
```

`after.ts`: ninguna línea existente cambia. La regla es código nuevo, entregado al calculador donde se ensambla la aplicación.

```diff
+const student: DiscountRule = { kind: "student", discount: (totalCents) => Math.round(totalCents * 0.15) };
+export const discountCents = createDiscounts([...defaultRules, student]);
```

### Sustitución de Liskov: una cuenta de depósito en garantía que no se puede retirar

`before.ts`: una segunda subclase que lanza una excepción, y un `instanceof` más en cada cliente. Un cliente que se olvida cobra una comisión sobre una cuenta bloqueada y recibe una excepción en producción.

```diff
+class EscrowAccount extends Account {
+	withdraw(): void {
+		throw new Error("an escrow account cannot be withdrawn");
+	}
+}

 function open(spec: AccountSpec): Account {
+	if (spec.kind === "escrow") return new EscrowAccount(spec.balanceCents);
 	return spec.kind === "fixed-term" ? ... : ...;
 }

 export function chargeMonthlyFee(...)
-		if (!(account instanceof FixedTermAccount) && account.balance() >= feeCents) {
+		if (!(account instanceof FixedTermAccount) && !(account instanceof EscrowAccount) && account.balance() >= feeCents) {

 export function availableNow(...)
-		if (!(account instanceof FixedTermAccount)) {
+		if (!(account instanceof FixedTermAccount) && !(account instanceof EscrowAccount)) {
```

`after.ts`: una clase que es una `Account` y no una `Withdrawable`, y su línea en la factory. `chargeMonthlyFee` y `availableNow` no se tocan: solo ven la lista `withdrawable`.

```diff
+class EscrowAccount implements Account {
+	constructor(private readonly balanceCents: number) {}
+
+	balance(): number {
+		return this.balanceCents;
+	}
+}

 function open(specs: AccountSpec[]): Portfolio {
 	...
-		if (spec.kind === "fixed-term") {
+		if (spec.kind === "escrow") {
+			portfolio.all.push(new EscrowAccount(spec.balanceCents));
+		} else if (spec.kind === "fixed-term") {
```

### Segregación de interfaces: el catálogo puede archivar un producto

`before.ts`: el método entra en la única interfaz, así que el catálogo de solo lectura recibe un tercer método que solo lanza una excepción, y todo doble de prueba de un informe recibe un tercer método que nunca usa.

```diff
 export interface ProductCatalog {
 	...
 	remove(id: string): void;
+	archive(id: string): void;
 }

 class MemoryCatalog implements ProductCatalog {
+	archive(id: string): void {
+		this.archived.add(id);
+	}
 }

 class CsvCatalog implements ProductCatalog {
+	archive(): void {
+		throw new Error("the CSV catalog is read-only");
+	}
 }
```

```diff
 // tests/isp.test.ts, el doble del informe
 		remove: () => {
 			throw new Error("never called");
 		},
+		archive: () => {
+			throw new Error("never called");
+		},
```

`after.ts`: solo cambia lo que escribe. `CsvCatalog`, `priceReport` y el doble del lector no se tocan.

```diff
 export interface ProductWriter {
 	save(product: Product): void;
 	remove(id: string): void;
+	archive(id: string): void;
 }

 class MemoryCatalog implements ProductReader, ProductWriter {
+	archive(id: string): void {
+		this.archived.add(id);
+	}
 }
```

### Inversión de dependencias: confirmar a través de una cola de mensajes, no de SMTP

`before.ts`: se edita la regla de negocio, y también sus pruebas, que hacen aserciones sobre la bandeja de salida SMTP.

```diff
-import { type Cart, type CheckoutApp, type Receipt, SmtpMailer, SqlOrderTable } from "./infrastructure";
+import { type Cart, type CheckoutApp, MessageQueue, type Receipt, SqlOrderTable } from "./infrastructure";

 class CheckoutService {
-	readonly mailer = new SmtpMailer();
+	readonly queue = new MessageQueue();
 	...
 	checkout(cart: Cart): Receipt {
 		...
-		this.mailer.sendMail(cart.email, `Order ${orderId} confirmed`);
+		this.queue.publish("order-confirmed", JSON.stringify({ email: cart.email, orderId }));
```

`after.ts`: la clase `CheckoutService` no se toca, ni tampoco la prueba que la ejecuta con dos objetos simples. El cambio está en la composition root.

```diff
 export function createCheckout(): CheckoutApp {
-	const mailer = new SmtpMailer();
+	const queue = new MessageQueue();
 	const service = new CheckoutService(
 		{ save: (orderId, totalCents) => table.insert(orderId, totalCents) },
-		{ orderConfirmed: (email, orderId) => mailer.sendMail(email, `Order ${orderId} confirmed`) },
+		{ orderConfirmed: (email, orderId) => queue.publish("order-confirmed", JSON.stringify({ email, orderId })) },
 	);
```
