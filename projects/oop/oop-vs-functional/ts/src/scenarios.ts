// EN: Reader of the shared `scenarios.txt`. It is support code, used by the tests and the demo
//     of both TypeScript versions, and it is not counted in the comparison. The file is text
//     typed by a person, so every line is checked here, at the border, and a line that does not
//     follow the format stops the run with its line number.
// PT: Leitor do `scenarios.txt` compartilhado. É código de apoio, usado pelos testes e pela demo
//     das duas versões em TypeScript, e não entra na comparação. O arquivo é texto digitado por
//     uma pessoa, então cada linha é conferida aqui, na borda, e uma linha fora do formato
//     interrompe a execução com o número da linha.
// ES: Lector del `scenarios.txt` compartido. Es código de apoyo, usado por las pruebas y por la demo
//     de las dos versiones en TypeScript, y no entra en la comparación. El archivo es texto escrito
//     por una persona, así que cada línea se verifica aquí, en el borde, y una línea que no siga
//     el formato detiene la ejecución con su número de línea.

import { readFileSync } from "node:fs";

export type RuleSpec =
	| { kind: "percent-coupon"; code: string; percent: number }
	| { kind: "fixed-coupon"; code: string; amountCents: number }
	| { kind: "bulk"; sku: string; minQuantity: number; percent: number }
	| { kind: "take-pay"; sku: string; take: number; pay: number };

export type TaxSpec = { kind: "none" } | { kind: "flat"; basisPoints: number };

export interface ItemSpec {
	sku: string;
	unitPriceCents: number;
	quantity: number;
}

export interface ReceiptSpec {
	subtotalCents: number;
	discounts: { label: string; amountCents: number }[];
	taxCents: number;
	totalCents: number;
}

export type Outcome = { kind: "receipt"; receipt: ReceiptSpec } | { kind: "error"; code: string };

export interface Scenario {
	name: string;
	items: ItemSpec[];
	rules: RuleSpec[];
	tax: TaxSpec;
	expected: Outcome;
}

export const SCENARIOS_FILE = new URL("../../scenarios.txt", import.meta.url);

interface Draft {
	name: string;
	items: ItemSpec[];
	rules: RuleSpec[];
	tax: TaxSpec;
	receipt: ReceiptSpec;
	error?: string;
}

function finish(draft: Draft): Scenario {
	const expected: Outcome =
		draft.error === undefined ? { kind: "receipt", receipt: draft.receipt } : { kind: "error", code: draft.error };
	return { name: draft.name, items: draft.items, rules: draft.rules, tax: draft.tax, expected };
}

export function parseScenarios(text: string): Scenario[] {
	const scenarios: Scenario[] = [];
	let draft: Draft | undefined;
	for (const [index, raw] of text.split(/\r?\n/).entries()) {
		const line = raw.trim();
		if (line === "" || line.startsWith("#")) {
			continue;
		}
		const fail = (): never => {
			throw new Error(`scenarios.txt line ${index + 1}: cannot read "${line}"`);
		};
		const words = line.split(" ");
		const word = (position: number): string => words[position] ?? fail();
		const int = (position: number): number => {
			const value = Number(word(position));
			return Number.isInteger(value) ? value : fail();
		};
		if (words[0] === "scenario") {
			if (draft !== undefined) {
				scenarios.push(finish(draft));
			}
			draft = {
				name: words.slice(1).join(" "),
				items: [],
				rules: [],
				tax: { kind: "none" },
				receipt: { subtotalCents: 0, discounts: [], taxCents: 0, totalCents: 0 },
			};
			continue;
		}
		if (draft === undefined) {
			return fail();
		}
		switch (`${words[0]} ${words[1]}`) {
			case "rule percent-coupon":
				draft.rules.push({ kind: "percent-coupon", code: word(2), percent: int(3) });
				break;
			case "rule fixed-coupon":
				draft.rules.push({ kind: "fixed-coupon", code: word(2), amountCents: int(3) });
				break;
			case "rule bulk":
				draft.rules.push({ kind: "bulk", sku: word(2), minQuantity: int(3), percent: int(4) });
				break;
			case "rule take-pay":
				draft.rules.push({ kind: "take-pay", sku: word(2), take: int(3), pay: int(4) });
				break;
			case "tax none":
				draft.tax = { kind: "none" };
				break;
			case "tax flat":
				draft.tax = { kind: "flat", basisPoints: int(2) };
				break;
			case "expect subtotal":
				draft.receipt.subtotalCents = int(2);
				break;
			case "expect discount":
				draft.receipt.discounts.push({ amountCents: int(2), label: words.slice(3).join(" ") });
				break;
			case "expect tax":
				draft.receipt.taxCents = int(2);
				break;
			case "expect total":
				draft.receipt.totalCents = int(2);
				break;
			case "expect error":
				draft.error = word(2);
				break;
			default:
				if (words[0] !== "item") {
					fail();
				}
				draft.items.push({ sku: word(1), unitPriceCents: int(2), quantity: int(3) });
		}
	}
	if (draft !== undefined) {
		scenarios.push(finish(draft));
	}
	return scenarios;
}

export function loadScenarios(): Scenario[] {
	return parseScenarios(readFileSync(SCENARIOS_FILE, "utf8"));
}
