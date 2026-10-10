// EN: The same checkout rule written twice. `priceOrderImpure` reads the clock and keeps a
//     hidden counter; `priceOrder` receives everything it needs as arguments. The rule is
//     identical: add up the items and apply the coupon if it has not expired.
// PT: A mesma regra de checkout escrita duas vezes. `priceOrderImpure` lê o relógio e mantém
//     um contador oculto; `priceOrder` recebe por argumento tudo de que precisa. A regra é
//     idêntica: somar os itens e aplicar o cupom se ele não tiver vencido.
// ES: La misma regla de checkout escrita dos veces. `priceOrderImpure` lee el reloj y mantiene
//     un contador oculto; `priceOrder` recibe por argumento todo lo que necesita. La regla es
//     idéntica: sumar los ítems y aplicar el cupón si no ha vencido.

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
// ES: PURA. `now` es un parámetro (segundos desde la época), así que la respuesta depende solo de
//     los argumentos. El dinero se guarda en centavos enteros y el descuento se redondea hacia
//     abajo, lo que mantiene exacto todo resultado.
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
// ES: Estado oculto de la versión impura: vive fuera de todas las llamadas y cambia en cada una.
let receiptsIssued = 0;

// EN: IMPURE, kept on purpose for comparison. It has a hidden input (the system clock) and
//     a hidden output (the counter), so two calls with the same order can return different
//     values, and a test of the coupon rule would have to replace the clock.
// PT: IMPURA, mantida de propósito para comparação. Ela tem uma entrada oculta (o relógio do
//     sistema) e uma saída oculta (o contador), então duas chamadas com o mesmo pedido podem
//     devolver valores diferentes, e um teste da regra do cupom teria de substituir o
//     relógio.
// ES: IMPURA, mantenida a propósito para comparar. Tiene una entrada oculta (el reloj del
//     sistema) y una salida oculta (el contador), así que dos llamadas con el mismo pedido pueden
//     devolver valores distintos, y una prueba de la regla del cupón tendría que reemplazar el
//     reloj.
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
// ES: CASCARÓN IMPERATIVO. El único lugar que toca el mundo: lee el reloj una vez, entrega el
//     valor al núcleo puro y devuelve el texto a imprimir. Todas las decisiones están en
//     `priceOrder`.
export function checkoutNow(order: Order): string {
	const price = priceOrder(order, Math.floor(Date.now() / 1000));
	return `subtotal ${price.subtotalCents} - discount ${price.discountCents} = total ${price.totalCents}`;
}
