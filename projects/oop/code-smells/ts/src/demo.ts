// EN: `bun run demo` prints the catalogue: for each smell, how many files and lines of code the
//     two versions have, and one output that both versions produce. The sizes show that removing
//     a smell rarely makes the code shorter. It makes each piece smaller and puts it where a
//     change will look for it.
// PT: `bun run demo` imprime o catálogo: para cada mau cheiro, quantos arquivos e linhas de
//     código as duas versões têm, e uma saída que as duas versões produzem. Os tamanhos mostram
//     que remover um mau cheiro raramente encurta o código. Ele deixa cada parte menor e a põe
//     onde uma mudança vai procurá-la.
// ES: `bun run demo` imprime el catálogo: para cada mal olor, cuántos archivos y líneas de
//     código tienen las dos versiones, y una salida que ambas versiones producen. Los tamaños
//     muestran que eliminar un mal olor rara vez acorta el código. Deja cada parte más pequeña
//     y la pone donde un cambio va a buscarla.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { shippingLine as lineAfter } from "./conditional-to-polymorphism/after/delivery-method";
import { Express } from "./conditional-to-polymorphism/after/express";
import { shippingLine as lineBefore } from "./conditional-to-polymorphism/before/checkout";
import * as envyAfter from "./feature-envy/after";
import * as envyBefore from "./feature-envy/before";
import * as godAfter from "./god-class/after";
import * as godBefore from "./god-class/before";
import type { CreateShop } from "./god-class/contract";
import * as longAfter from "./long-method/after";
import * as longBefore from "./long-method/before";
import * as primitiveAfter from "./primitive-obsession/after";
import * as primitiveBefore from "./primitive-obsession/before";
import { billing as shotgunAfter } from "./shotgun-surgery/after";
import { billing as shotgunBefore } from "./shotgun-surgery/before";

interface Size {
	files: number;
	lines: number;
}

// EN: A version is `before.ts` or a `before/` folder. Comments and blank lines are not counted.
// PT: Uma versão é `before.ts` ou uma pasta `before/`. Comentários e linhas em branco não contam.
// ES: Una versión es `before.ts` o una carpeta `before/`. Los comentarios y las líneas en blanco
//     no cuentan.
function sizeOf(smell: string, version: string): Size {
	const base = fileURLToPath(new URL(`./${smell}/${version}`, import.meta.url));
	const single = `${base}.ts`;
	const files = statSync(single, { throwIfNoEntry: false })
		? [single]
		: readdirSync(base).map((name) => `${base}/${name}`);
	const lines = files
		.flatMap((file) => readFileSync(file, "utf8").split(/\r?\n/))
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith("//"));
	return { files: files.length, lines: lines.length };
}

function shopSample(createShop: CreateShop): string {
	const shop = createShop({ PEN: 250 });
	shop.restock("PEN", 2);
	shop.placeOrder("ana@shop.example", "PEN", 2);
	return shop.outbox().join(" / ");
}

const invoice = {
	customer: { name: "Ana", street: "Rua A", number: "1", city: "Campinas", state: "SP", zip: "13000000" },
	lines: [{ description: "pen", unitCents: 250, quantity: 2 }],
};
const order = { customer: "Ana", items: [{ name: "pen", unitCents: 250, quantity: 4 }], coupon: "TEN" };

const catalogue: { smell: string; refactoring: string; before: string; after: string }[] = [
	{
		smell: "long-method",
		refactoring: "Extract Method",
		before: longBefore.formatReceipt(order).split("\n").join(" / "),
		after: longAfter.formatReceipt(order).split("\n").join(" / "),
	},
	{
		smell: "god-class",
		refactoring: "Extract Class",
		before: shopSample(godBefore.createShop),
		after: shopSample(godAfter.createShop),
	},
	{
		smell: "feature-envy",
		refactoring: "Move Method",
		before: envyBefore.renderInvoice(invoice).split("\n").join(" / "),
		after: envyAfter.renderInvoice(invoice).split("\n").join(" / "),
	},
	{
		smell: "shotgun-surgery",
		refactoring: "Move the knowledge to one place",
		before: shotgunBefore.invoiceTotal([123456, 5]),
		after: shotgunAfter.invoiceTotal([123456, 5]),
	},
	{
		smell: "primitive-obsession",
		refactoring: "Replace Primitive with Object",
		before: primitiveBefore.accounts.describe(
			primitiveBefore.accounts.register("Ana", "ANA@example.com", "11 99999-0000"),
		),
		after: primitiveAfter.accounts.describe(
			primitiveAfter.accounts.register("Ana", "ANA@example.com", "11 99999-0000"),
		),
	},
	{
		smell: "conditional-to-polymorphism",
		refactoring: "Replace Conditional with Polymorphism",
		before: lineBefore("express", 1500, 42),
		after: lineAfter(new Express(), 1500, 42),
	},
];

let different = 0;
for (const entry of catalogue) {
	const before = sizeOf(entry.smell, "before");
	const after = sizeOf(entry.smell, "after");
	const same = entry.before === entry.after;
	different += same ? 0 : 1;
	console.log(`== ${entry.smell} -> ${entry.refactoring}`);
	console.log(`  before: ${before.files} file(s), ${before.lines} lines of code`);
	console.log(`  after:  ${after.files} file(s), ${after.lines} lines of code`);
	console.log(`  output: ${entry.before}`);
	console.log(`  same output in both versions: ${same ? "yes" : "NO"}`);
}
process.exit(different === 0 ? 0 : 1);
