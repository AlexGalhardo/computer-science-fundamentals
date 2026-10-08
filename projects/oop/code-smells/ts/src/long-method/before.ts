import type { FormatReceipt } from "./contract";

// EN: SMELL: Long Method. One function validates, computes four amounts and formats the text.
//     The comments that split it into blocks are the symptom: each block is a function that
//     was never given a name. To test the shipping rule alone you must build a whole order and
//     read the answer out of a string.
// PT: MAU CHEIRO: Método Longo. Uma função valida, calcula quatro valores e formata o texto.
//     Os comentários que a dividem em blocos são o sintoma: cada bloco é uma função que nunca
//     recebeu nome. Para testar só a regra do frete é preciso montar um pedido inteiro e ler a
//     resposta de dentro de uma string.
export const formatReceipt: FormatReceipt = (order) => {
	// validate
	if (order.items.length === 0) {
		throw new Error("empty order");
	}
	for (const item of order.items) {
		if (!Number.isInteger(item.quantity) || item.quantity < 1) {
			throw new Error(`invalid quantity for ${item.name}`);
		}
		if (!Number.isInteger(item.unitCents) || item.unitCents < 0) {
			throw new Error(`invalid price for ${item.name}`);
		}
	}

	// subtotal
	let subtotal = 0;
	for (const item of order.items) {
		subtotal += item.unitCents * item.quantity;
	}

	// discount
	let discount = 0;
	if (order.coupon === "TEN") {
		discount = Math.floor(subtotal / 10);
	} else if (order.coupon === "BULK") {
		let units = 0;
		for (const item of order.items) {
			units += item.quantity;
		}
		if (units >= 10) {
			discount = Math.floor(subtotal / 5);
		}
	}

	// shipping
	let shipping = 1500;
	if (subtotal - discount >= 10000) {
		shipping = 0;
	}

	// format
	let text = `Receipt for ${order.customer}\n`;
	for (const item of order.items) {
		text += `${item.quantity} x ${item.name}  ${((item.unitCents * item.quantity) / 100).toFixed(2)}\n`;
	}
	text += `Subtotal  ${(subtotal / 100).toFixed(2)}\n`;
	if (discount > 0) {
		text += `Discount (${order.coupon})  -${(discount / 100).toFixed(2)}\n`;
	}
	text += `Shipping  ${shipping === 0 ? "free" : (shipping / 100).toFixed(2)}\n`;
	text += `Total  ${((subtotal - discount + shipping) / 100).toFixed(2)}`;
	return text;
};
