// EN: The same checkout rule written twice. `priceOrderImpure` reads the clock and keeps a
//     hidden counter; `priceOrder` receives everything it needs as arguments. The rule is
//     identical: add up the items and apply the coupon if it has not expired.
// PT: A mesma regra de checkout escrita duas vezes. `priceOrderImpure` lê o relógio e mantém
//     um contador oculto; `priceOrder` recebe por argumento tudo de que precisa. A regra é
//     idêntica: somar os itens e aplicar o cupom se ele não tiver vencido.

export type Item = { readonly unitCents: number; readonly quantity: number };
export type Coupon = { readonly percent: number; readonly expiresAt: number };
export type Order = { readonly items: readonly Item[]; readonly coupon: Coupon | null };
export type Price = { readonly subtotalCents: number; readonly discountCents: number; readonly totalCents: number };

// EN: PURE. `now` is a parameter (seconds since the epoch), so the answer depends only on
//     the arguments. Money is kept in integer cents and the discount is rounded down, which
//     keeps every result exact.
// PT: PURA. `now` é um parâmetro (segundos desde a época), então a resposta depende só dos
//     argumentos. O dinheiro fica em centavos inteiros e o desconto é arredondado para
//     baixo, o que mantém todo resultado exato.
export function priceOrder(order: Order, now: number): Price {
	const subtotalCents = order.items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0);
	const coupon = order.coupon;
	const discountCents =
		coupon !== null && now <= coupon.expiresAt ? Math.floor((subtotalCents * coupon.percent) / 100) : 0;
	return { subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}

// EN: Hidden state of the impure version: it lives outside every call and changes on each
//     one.
// PT: Estado oculto da versão impura: vive fora de todas as chamadas e muda a cada uma.
let receiptsIssued = 0;

// EN: IMPURE, kept on purpose for comparison. It has a hidden input (the system clock) and
//     a hidden output (the counter), so two calls with the same order can return different
//     values, and a test of the coupon rule would have to replace the clock.
// PT: IMPURA, mantida de propósito para comparação. Ela tem uma entrada oculta (o relógio do
//     sistema) e uma saída oculta (o contador), então duas chamadas com o mesmo pedido podem
//     devolver valores diferentes, e um teste da regra do cupom teria de substituir o
//     relógio.
export function priceOrderImpure(order: Order): Price & { receiptNumber: number } {
	const now = Math.floor(Date.now() / 1000);
	receiptsIssued += 1;
	return { ...priceOrder(order, now), receiptNumber: receiptsIssued };
}

// EN: IMPERATIVE SHELL. The only place that touches the world: it reads the clock once,
//     hands the value to the pure core and returns the text to print. All decisions stay in
//     `priceOrder`.
// PT: CASCA IMPERATIVA. O único lugar que toca o mundo: lê o relógio uma vez, entrega o
//     valor ao núcleo puro e devolve o texto a imprimir. Todas as decisões ficam em
//     `priceOrder`.
export function checkoutNow(order: Order): string {
	const price = priceOrder(order, Math.floor(Date.now() / 1000));
	return `subtotal ${price.subtotalCents} - discount ${price.discountCents} = total ${price.totalCents}`;
}
