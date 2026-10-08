import type { FormatReceipt, Order, OrderItem } from "./contract";

// EN: REFACTORED with Extract Method. Each block of the long version became a function whose
//     name says what the comment used to say. `formatReceipt` now reads like a summary, and
//     each rule can be called, and tested, on its own.
// PT: REFATORADO com Extrair Método. Cada bloco da versão longa virou uma função cujo nome diz o
//     que o comentário dizia. `formatReceipt` agora se lê como um resumo, e cada regra pode ser
//     chamada, e testada, sozinha.

const FREE_SHIPPING_FROM_CENTS = 10000;
const SHIPPING_CENTS = 1500;

const money = (cents: number): string => (cents / 100).toFixed(2);
const lineTotal = (item: OrderItem): number => item.unitCents * item.quantity;

export function validate(order: Order): void {
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
}

export function subtotalCents(order: Order): number {
	return order.items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function discountCents(order: Order): number {
	const subtotal = subtotalCents(order);
	if (order.coupon === "TEN") {
		return Math.floor(subtotal / 10);
	}
	const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
	return order.coupon === "BULK" && units >= 10 ? Math.floor(subtotal / 5) : 0;
}

export function shippingCents(amountCents: number): number {
	return amountCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_CENTS;
}

export const formatReceipt: FormatReceipt = (order) => {
	validate(order);
	const subtotal = subtotalCents(order);
	const discount = discountCents(order);
	const shipping = shippingCents(subtotal - discount);
	return [
		`Receipt for ${order.customer}`,
		...order.items.map((item) => `${item.quantity} x ${item.name}  ${money(lineTotal(item))}`),
		`Subtotal  ${money(subtotal)}`,
		...(discount > 0 ? [`Discount (${order.coupon})  -${money(discount)}`] : []),
		`Shipping  ${shipping === 0 ? "free" : money(shipping)}`,
		`Total  ${money(subtotal - discount + shipping)}`,
	].join("\n");
};
