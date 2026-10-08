# solid-before-after

> English version: [README.md](README.md)

Um módulo pequeno por princípio SOLID, duas vezes: uma versão que quebra o princípio (`before`) e a sua refatoração (`after`). Os **mesmos testes** rodam contra as duas, então fica provado que a refatoração mantém o comportamento. Ensina **o que cada princípio evita**, medido pelo diff que um requisito novo exige em cada versão.

Explicação completa: [docs/pt/design-patterns/solid-before-after.md](../../../docs/pt/design-patterns/solid-before-after.md).

## Tópicos do quiz que ele demonstra

- `design-patterns` / `single-responsibility`: motivos de mudança, coesão.
- `design-patterns` / `open-closed`: pontos de extensão, condicionais sobre um tipo.
- `design-patterns` / `liskov-substitution`: um subtipo que não consegue cumprir uma promessa herdada, `instanceof` nos clientes.
- `design-patterns` / `interface-segregation`: interfaces gordas, o tipo de parâmetro mais estreito.
- `design-patterns` / `dependency-inversion`: quem é dono da abstração, a raiz de composição.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-solid-before-after.sh        # Linux e macOS
./setup-windows-solid-before-after.ps1    # Windows
```

O script constrói as duas imagens, roda os testes em TypeScript e em Java e roda a demo.

## Estrutura

| Princípio | Módulo | TypeScript | Java |
| --- | --- | --- | --- |
| Responsabilidade única | emissão de uma nota: imposto, texto do recibo, registro gravado | `ts/src/srp/` | `solid/srp/` |
| Aberto-fechado | desconto por tipo de cliente | `ts/src/ocp/` | `solid/ocp/` |
| Substituição de Liskov | contas bancárias, uma das quais não permite saque | `ts/src/lsp/` | `solid/lsp/` |
| Segregação de interfaces | um catálogo de produtos com leitores e escritores | `ts/src/isp/` | `solid/isp/` |
| Inversão de dependência | um checkout que grava um pedido e avisa o cliente | `ts/src/dip/` | `solid/dip/` |

Cada pasta em TypeScript tem `before.ts` e `after.ts` (mais os dados compartilhados). Cada pacote Java, em `java/src/main/java/`, tem `XxxBefore.java` e `XxxAfter.java`. TypeScript é a referência. O Java está aqui porque a lição muda com tipos nominais: um método recusado vira `UnsupportedOperationException`, como nas listas não modificáveis do próprio JDK, e "leitor e escritor" exige um limite genérico, `<C extends ProductReader & ProductWriter>`.

Imagens: `oven/bun:1.4.2` e `gradle:9.8.0-jdk25`. Nenhuma dependência de biblioteca nas duas linguagens. O único plugin de build é o Spotless 8.10.3 com google-java-format, que o build da imagem Java executa como verificação, junto com `javac -Xlint:all -Werror`.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

Em `ts/tests/<princípio>.test.ts`, uma função descreve o comportamento do módulo e é chamada duas vezes, com `before` e com `after`. Os testes em Java (`java/src/test/java/solid/SolidTest.java`) fazem o mesmo com um arcabouço de 30 linhas no lugar de uma biblioteca de testes. Alguns testes a mais mostram o que só a versão refatorada permite, como testar a regra do checkout sem nenhuma classe de infraestrutura.

## Demo

```sh
docker compose run --rm ts-demo
```

Para cada princípio, executa a mesma chamada nas duas versões, mostra as duas respostas e diz se são iguais.

## Custo da mudança

Para cada princípio, um requisito novo e o diff que ele exige em cada versão em TypeScript. Os diffs são ilustrações: não estão aplicados no repositório, para que você possa aplicá-los e rodar os testes. A exceção é o do aberto-fechado, que `ts/tests/ocp.test.ts` realmente executa de fora.

| Princípio | Requisito novo | `before`: o que é editado | `after`: o que é editado |
| --- | --- | --- | --- |
| SRP | o recibo também em HTML | 4 pontos dentro da função que também guarda a regra de imposto | nada: 1 função nova |
| OCP | estudantes ganham 15% | a função já testada | nada: 1 regra nova |
| LSP | uma conta em custódia que não permite saque | 1 classe nova, a fábrica e **todos os clientes** | 1 classe nova e a fábrica |
| ISP | o catálogo pode arquivar um produto | a interface, os **dois** implementadores e todo dublê de teste | a interface de escrita e a única classe que grava |
| DIP | confirmar por uma fila de mensagens, e não por SMTP | a regra de negócio e os testes dela | a raiz de composição |

### Responsabilidade única: o recibo também em HTML

`before.ts`: a mudança fica espalhada pela função que também calcula o imposto e monta o registro gravado.

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

`after.ts`: uma função nova. `calculateTotals`, `formatReceipt` e `toRecord` não são tocadas, então os testes delas não têm como quebrar.

```diff
+export function formatReceiptHtml(order: Order, totals: Totals): string {
+	const rows = order.lines.map(
+		(line) => `<tr><td>${line.description}</td><td>${money(line.quantity * line.unitCents)}</td></tr>`,
+	);
+	return `<table>${rows.join("")}<tr><td>Total</td><td>${money(totals.totalCents)}</td></tr></table>`;
+}
```

### Aberto-fechado: estudantes ganham 15%

`before.ts`: a função que já funciona é aberta de novo.

```diff
 	if (kind === "employee") {
 		return Math.round(totalCents * 0.3);
 	}
+	if (kind === "student") {
+		return Math.round(totalCents * 0.15);
+	}
 	throw new Error(`unknown customer kind: ${kind}`);
```

`after.ts`: nenhuma linha existente muda. A regra é código novo, entregue à calculadora no ponto em que a aplicação é montada.

```diff
+const student: DiscountRule = { kind: "student", discount: (totalCents) => Math.round(totalCents * 0.15) };
+export const discountCents = createDiscounts([...defaultRules, student]);
```

### Substituição de Liskov: uma conta em custódia que não permite saque

`before.ts`: uma segunda subclasse que lança exceção, e mais um `instanceof` em cada cliente. Um cliente esquecido cobra tarifa de uma conta bloqueada e recebe uma exceção em produção.

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

`after.ts`: uma classe que é um `Account` e não é um `Withdrawable`, e a linha dela na fábrica. `chargeMonthlyFee` e `availableNow` não são tocadas: elas só enxergam a lista `withdrawable`.

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

### Segregação de interfaces: o catálogo pode arquivar um produto

`before.ts`: o método entra na única interface, então o catálogo somente leitura ganha um terceiro método que só lança exceção, e todo dublê de teste de um relatório ganha um terceiro método que nunca usa.

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
 // tests/isp.test.ts, o dublê do relatório
 		remove: () => {
 			throw new Error("never called");
 		},
+		archive: () => {
+			throw new Error("never called");
+		},
```

`after.ts`: só muda o que grava. `CsvCatalog`, `priceReport` e o dublê de leitura não são tocados.

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

### Inversão de dependência: confirmar por uma fila de mensagens, e não por SMTP

`before.ts`: a regra de negócio é editada, e os testes dela também, porque verificam a caixa de saída do SMTP.

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

`after.ts`: a classe `CheckoutService` não é tocada, nem o teste que a executa com dois objetos simples. A mudança fica na raiz de composição.

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
