# solid-before-after

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

One small module per SOLID principle, twice: a version that violates the principle (`before`) and its refactor (`after`). The **same tests** run against both, so the refactor is proven to keep the behaviour. It teaches **what each principle prevents**, measured by the diff a new requirement needs in each version.

Full explanation: [docs/en/design-patterns/solid-before-after.md](../../../docs/en/design-patterns/solid-before-after.md).

## Quiz topics it demonstrates

- `design-patterns` / `single-responsibility`: reasons to change, cohesion.
- `design-patterns` / `open-closed`: extension points, conditionals on a type.
- `design-patterns` / `liskov-substitution`: a subtype that cannot keep an inherited promise, `instanceof` in clients.
- `design-patterns` / `interface-segregation`: fat interfaces, the narrowest parameter type.
- `design-patterns` / `dependency-inversion`: who owns the abstraction, the composition root.

## Run

The only requirement is Docker.

```sh
./setup-unix-solid-before-after.sh        # Linux and macOS
./setup-windows-solid-before-after.ps1    # Windows
```

The script builds both images, runs the TypeScript and the Java tests and runs the demo.

## Structure

| Principle | Module | TypeScript | Java |
| --- | --- | --- | --- |
| Single responsibility | issuing an invoice: tax, receipt text, stored record | `ts/src/srp/` | `solid/srp/` |
| Open-closed | discount by customer kind | `ts/src/ocp/` | `solid/ocp/` |
| Liskov substitution | bank accounts, one of which cannot be withdrawn | `ts/src/lsp/` | `solid/lsp/` |
| Interface segregation | a product catalog with readers and writers | `ts/src/isp/` | `solid/isp/` |
| Dependency inversion | a checkout that stores an order and tells the customer | `ts/src/dip/` | `solid/dip/` |

Each TypeScript folder has `before.ts` and `after.ts` (plus the shared data). Each Java package, under `java/src/main/java/`, has `XxxBefore.java` and `XxxAfter.java`. TypeScript is the reference. Java is here because the lesson changes with nominal types: a refused method becomes `UnsupportedOperationException`, as in the JDK's own unmodifiable lists, and "reader and writer" needs a generic bound, `<C extends ProductReader & ProductWriter>`.

Images: `oven/bun:1.4.2` and `gradle:9.8.0-jdk25`. No library dependency in either language. The only build plugin is Spotless 8.10.3 with google-java-format, which the Java image build runs as a check, together with `javac -Xlint:all -Werror`.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

In `ts/tests/<principle>.test.ts` a function describes the behaviour of the module and is called twice, with `before` and with `after`. The Java tests (`java/src/test/java/solid/SolidTest.java`) do the same with a 30-line harness instead of a test library. A few extra tests show what only the refactored version allows, such as testing the checkout rule with no infrastructure class.

## Demo

```sh
docker compose run --rm ts-demo
```

For each principle it runs the same call on both versions, prints the two answers and says whether they are equal.

## Cost of change

For each principle, one new requirement and the diff it needs in each TypeScript version. The diffs are illustrations: they are not applied in the repository, so you can try them yourself and run the tests. The exception is the open-closed one, which `ts/tests/ocp.test.ts` really performs from outside.

| Principle | New requirement | `before`: what is edited | `after`: what is edited |
| --- | --- | --- | --- |
| SRP | the receipt also in HTML | 4 places inside the function that also holds the tax rule | nothing: 1 new function |
| OCP | students get 15% | the tested function | nothing: 1 new rule |
| LSP | an escrow account that cannot be withdrawn | 1 new class, the factory and **every client** | 1 new class and the factory |
| ISP | the catalog can archive a product | the interface, **both** implementers and every test double | the writer interface and the 1 class that writes |
| DIP | confirm through a message queue, not SMTP | the business rule and its tests | the composition root |

### Single responsibility: the receipt also in HTML

`before.ts`: the change is spread through the function that also computes the tax and builds the stored record.

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

`after.ts`: one new function. `calculateTotals`, `formatReceipt` and `toRecord` are not touched, so their tests cannot break.

```diff
+export function formatReceiptHtml(order: Order, totals: Totals): string {
+	const rows = order.lines.map(
+		(line) => `<tr><td>${line.description}</td><td>${money(line.quantity * line.unitCents)}</td></tr>`,
+	);
+	return `<table>${rows.join("")}<tr><td>Total</td><td>${money(totals.totalCents)}</td></tr></table>`;
+}
```

### Open-closed: students get 15%

`before.ts`: the function that already works is opened again.

```diff
 	if (kind === "employee") {
 		return Math.round(totalCents * 0.3);
 	}
+	if (kind === "student") {
+		return Math.round(totalCents * 0.15);
+	}
 	throw new Error(`unknown customer kind: ${kind}`);
```

`after.ts`: no existing line changes. The rule is new code, handed to the calculator where the application is assembled.

```diff
+const student: DiscountRule = { kind: "student", discount: (totalCents) => Math.round(totalCents * 0.15) };
+export const discountCents = createDiscounts([...defaultRules, student]);
```

### Liskov substitution: an escrow account that cannot be withdrawn

`before.ts`: a second subclass that throws, and one more `instanceof` in every client. A client that is forgotten charges a fee on a blocked account and gets an exception in production.

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

`after.ts`: a class that is an `Account` and not a `Withdrawable`, and its line in the factory. `chargeMonthlyFee` and `availableNow` are not touched: they only ever see the `withdrawable` list.

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

### Interface segregation: the catalog can archive a product

`before.ts`: the method goes into the one interface, so the read-only catalog gets a third method that only throws, and every test double of a report gets a third method it never uses.

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
 // tests/isp.test.ts, the double for the report
 		remove: () => {
 			throw new Error("never called");
 		},
+		archive: () => {
+			throw new Error("never called");
+		},
```

`after.ts`: only what writes changes. `CsvCatalog`, `priceReport` and the reader double are not touched.

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

### Dependency inversion: confirm through a message queue, not SMTP

`before.ts`: the business rule is edited, and so are its tests, which assert on the SMTP outbox.

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

`after.ts`: the class `CheckoutService` is not touched, and neither is the test that runs it with two plain objects. The change is in the composition root.

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
