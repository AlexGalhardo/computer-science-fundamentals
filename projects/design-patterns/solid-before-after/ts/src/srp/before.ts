import { type IssuedInvoice, money, type Order } from "./types";

// EN: VIOLATES THE SINGLE RESPONSIBILITY PRINCIPLE. One function holds three subjects that
//     change for different reasons and at the request of different people: the tax rule
//     (finance), the layout of the receipt (customer service) and the format of the stored
//     record (whoever owns the storage). Any of the three changes opens this function, and
//     the local variables make it easy to break one subject while editing another.
// PT: QUEBRA O PRINCÍPIO DA RESPONSABILIDADE ÚNICA. Uma função guarda três assuntos que mudam
//     por motivos diferentes e a pedido de pessoas diferentes: a regra de imposto (financeiro),
//     o layout do recibo (atendimento) e o formato do registro gravado (quem cuida do
//     armazenamento). Qualquer uma das três mudanças abre esta função, e as variáveis locais
//     tornam fácil quebrar um assunto enquanto se edita outro.
// ES: ROMPE EL PRINCIPIO DE RESPONSABILIDAD ÚNICA. Una función guarda tres asuntos que cambian
//     por motivos distintos y a pedido de personas distintas: la regla del impuesto
//     (finanzas), el diseño del recibo (atención al cliente) y el formato del registro
//     guardado (quien cuida el almacenamiento). Cualquiera de los tres cambios abre esta
//     función, y las variables locales hacen fácil romper un asunto mientras se edita otro.
export function issueInvoice(order: Order): IssuedInvoice {
	if (order.lines.length === 0) {
		throw new Error("an invoice needs at least one line");
	}

	let subtotal = 0;
	const receiptLines = [`Invoice ${order.id} for ${order.customer}`];
	for (const line of order.lines) {
		const lineTotal = line.quantity * line.unitCents;
		subtotal += lineTotal;
		receiptLines.push(`${line.quantity} x ${line.description} @ ${money(line.unitCents)} = ${money(lineTotal)}`);
	}

	const ratePercent = order.state === "SP" ? 18 : 20;
	const tax = Math.round((subtotal * ratePercent) / 100);
	const total = subtotal + tax;

	receiptLines.push(`Subtotal: ${money(subtotal)}`);
	receiptLines.push(`Tax (${ratePercent}%): ${money(tax)}`);
	receiptLines.push(`Total: ${money(total)}`);

	return {
		totalCents: total,
		receipt: receiptLines.join("\n"),
		record: `${order.id};${order.customer};${order.state};${total}`,
	};
}
