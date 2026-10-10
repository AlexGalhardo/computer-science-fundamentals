// EN: `bun run demo`. For each principle, runs the same call on the violating module and on the
//     refactored one and prints both answers side by side. They are equal: a refactor changes
//     the shape of the code, not its behaviour. The last line of each block says what the new
//     requirement of the README costs in each version.
// PT: `bun run demo`. Para cada princípio, executa a mesma chamada no módulo com a violação e
//     no refatorado, e mostra as duas respostas lado a lado. Elas são iguais: uma refatoração
//     muda a forma do código, não o comportamento. A última linha de cada bloco diz quanto o
//     requisito novo do README custa em cada versão.
// ES: `bun run demo`. Para cada principio, ejecuta la misma llamada en el módulo con la
//     violación y en el refactorizado, y muestra las dos respuestas lado a lado. Son iguales:
//     una refactorización cambia la forma del código, no el comportamiento. La última línea de
//     cada bloque dice cuánto cuesta el requisito nuevo del README en cada versión.

import * as dipAfter from "./dip/after";
import * as dipBefore from "./dip/before";
import * as ispAfter from "./isp/after";
import * as ispBefore from "./isp/before";
import * as lspAfter from "./lsp/after";
import * as lspBefore from "./lsp/before";
import type { AccountSpec } from "./lsp/types";
import * as ocpAfter from "./ocp/after";
import * as ocpBefore from "./ocp/before";
import * as srpAfter from "./srp/after";
import * as srpBefore from "./srp/before";
import type { Order } from "./srp/types";

interface Block {
	principle: string;
	before: () => string;
	after: () => string;
	requirement: string;
	cost: string;
}

const order: Order = {
	id: "inv-7",
	customer: "Ana",
	state: "SP",
	lines: [{ description: "Book", quantity: 2, unitCents: 5000 }],
};
const accounts: AccountSpec[] = [
	{ kind: "checking", balanceCents: 10000 },
	{ kind: "fixed-term", balanceCents: 50000 },
];
const cart = { email: "ana@example.test", items: [{ sku: "book", quantity: 2, unitCents: 5000 }] };
const csv = "s1,Cable,1500";

const blocks: Block[] = [
	{
		principle: "SRP  single responsibility",
		before: () => srpBefore.issueInvoice(order).record,
		after: () => srpAfter.issueInvoice(order).record,
		requirement: "receipt also in HTML",
		cost: "before: edit the function that also holds tax and storage; after: one new function",
	},
	{
		principle: "OCP  open-closed",
		before: () => String(ocpBefore.discountCents("premium", 20000)),
		after: () => String(ocpAfter.discountCents("premium", 20000)),
		requirement: "student discount of 15%",
		cost: "before: edit the tested function; after: one new rule, calculator untouched",
	},
	{
		principle: "LSP  Liskov substitution",
		before: () => lspBefore.chargeMonthlyFee(accounts, 1200).join(", "),
		after: () => lspAfter.chargeMonthlyFee(accounts, 1200).join(", "),
		requirement: "escrow account that cannot be withdrawn",
		cost: "before: new subclass and an edit in every client; after: one new class, clients untouched",
	},
	{
		principle: "ISP  interface segregation",
		before: () => ispBefore.priceReport(ispBefore.createCsvCatalog(csv)),
		after: () => ispAfter.priceReport(ispAfter.createCsvCatalog(csv)),
		requirement: "archive a product",
		cost: "before: every implementer and every test double; after: only the classes that write",
	},
	{
		principle: "DIP  dependency inversion",
		before: () => JSON.stringify(dipBefore.createCheckout().checkout(cart)),
		after: () => JSON.stringify(dipAfter.createCheckout().checkout(cart)),
		requirement: "confirm through a message queue instead of SMTP",
		cost: "before: edit the business rule; after: edit the composition root only",
	},
];

export function runDemo(): string[] {
	const lines: string[] = [];
	for (const block of blocks) {
		const before = block.before();
		const after = block.after();
		lines.push(block.principle);
		lines.push(`  before: ${before}`);
		lines.push(`  after:  ${after}`);
		lines.push(`  same behaviour: ${before === after ? "yes" : "NO"}`);
		lines.push(`  new requirement (${block.requirement}): ${block.cost}`);
	}
	return lines;
}

if (import.meta.main) {
	console.log(runDemo().join("\n"));
}
