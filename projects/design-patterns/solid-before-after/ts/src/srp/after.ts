import { type IssuedInvoice, money, type Order } from "./types";

export interface Totals {
	subtotalCents: number;
	ratePercent: number;
	taxCents: number;
	totalCents: number;
}

// EN: SINGLE RESPONSIBILITY. Three functions, one reason to change each. The tax rule knows
//     nothing about text, the receipt layout does no arithmetic on rates, and the record format
//     is one line. Each can be tested, changed and reused without the other two.
// PT: RESPONSABILIDADE ÚNICA. Três funções, um motivo de mudança para cada. A regra de imposto
//     não sabe nada de texto, o layout do recibo não faz conta com alíquotas, e o formato do
//     registro é uma linha. Cada uma pode ser testada, alterada e reaproveitada sem as outras.
export function calculateTotals(order: Order): Totals {
	if (order.lines.length === 0) {
		throw new Error("an invoice needs at least one line");
	}
	const subtotalCents = order.lines.reduce((sum, line) => sum + line.quantity * line.unitCents, 0);
	const ratePercent = order.state === "SP" ? 18 : 20;
	const taxCents = Math.round((subtotalCents * ratePercent) / 100);
	return { subtotalCents, ratePercent, taxCents, totalCents: subtotalCents + taxCents };
}

export function formatReceipt(order: Order, totals: Totals): string {
	return [
		`Invoice ${order.id} for ${order.customer}`,
		...order.lines.map(
			(line) =>
				`${line.quantity} x ${line.description} @ ${money(line.unitCents)} = ${money(line.quantity * line.unitCents)}`,
		),
		`Subtotal: ${money(totals.subtotalCents)}`,
		`Tax (${totals.ratePercent}%): ${money(totals.taxCents)}`,
		`Total: ${money(totals.totalCents)}`,
	].join("\n");
}

export function toRecord(order: Order, totals: Totals): string {
	return `${order.id};${order.customer};${order.state};${totals.totalCents}`;
}

// EN: What is left here is coordination: call the three in order. It has no rule of its own.
// PT: O que sobra aqui é coordenação: chamar as três em ordem. Não há regra própria.
export function issueInvoice(order: Order): IssuedInvoice {
	const totals = calculateTotals(order);
	return {
		totalCents: totals.totalCents,
		receipt: formatReceipt(order, totals),
		record: toRecord(order, totals),
	};
}
