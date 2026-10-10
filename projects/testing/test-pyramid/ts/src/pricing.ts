import { bugIs } from "./seeded-bugs";

// EN: Pure pricing rules: no database, no HTTP, no clock. The same input always gives the same
//     output, which is what makes this module the natural target of unit tests. Money is kept in
//     cents, as integers, because 0.1 + 0.2 is not 0.3 in floating point.
// PT: Regras de preço puras: sem banco, sem HTTP, sem relógio. A mesma entrada sempre dá a mesma
//     saída, e é isso que faz deste módulo o alvo natural dos testes unitários. O dinheiro fica
//     em centavos, como inteiros, porque 0.1 + 0.2 não é 0.3 em ponto flutuante.
// ES: Reglas de precio puras: sin base de datos, sin HTTP, sin reloj. La misma entrada siempre da la
//     misma salida, y eso es lo que hace de este módulo el blanco natural de las pruebas unitarias.
//     El dinero queda en centavos, como enteros, porque 0.1 + 0.2 no es 0.3 en punto flotante.
export interface CartLine {
	productId: string;
	name: string;
	unitPriceCents: number;
	quantity: number;
}

export const DISCOUNT_THRESHOLD_CENTS = 10_000;
export const DISCOUNT_PERCENT = 10;

export function subtotalCents(lines: readonly CartLine[]): number {
	return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
}

export function discountCents(subtotal: number): number {
	// EN: SEEDED BUG "unit": `>` instead of `>=`. Only a cart of exactly 100.00 behaves
	//     differently, so only a test written for the boundary value notices.
	// PT: BUG SEMEADO "unit": `>` no lugar de `>=`. Só um carrinho de exatamente 100,00 se
	//     comporta diferente, então só um teste escrito para o valor-limite percebe.
	// ES: BUG SEMBRADO "unit": `>` en lugar de `>=`. Solo un carrito de exactamente 100,00 se
	//     comporta distinto, así que solo una prueba escrita para el valor límite lo nota.
	const qualifies = bugIs("unit") ? subtotal > DISCOUNT_THRESHOLD_CENTS : subtotal >= DISCOUNT_THRESHOLD_CENTS;
	if (!qualifies) {
		return 0;
	}
	const exact = (subtotal * DISCOUNT_PERCENT) / 100;
	// EN: SEEDED BUG "regression": the rounding is removed, which brings back bug report #17
	//     (a total with half a cent). The fix was this `Math.round`, and the regression suite
	//     exists so that nobody can undo it without a test turning red.
	// PT: BUG SEMEADO "regression": o arredondamento é removido, o que traz de volta o relato de
	//     bug #17 (um total com meio centavo). A correção foi este `Math.round`, e a suíte de
	//     regressão existe para que ninguém a desfaça sem um teste ficar vermelho.
	// ES: BUG SEMBRADO "regression": se quita el redondeo, lo que trae de vuelta el reporte de
	//     bug #17 (un total con medio centavo). La corrección fue este `Math.round`, y la suite de
	//     regresión existe para que nadie la deshaga sin que una prueba se ponga roja.
	return bugIs("regression") ? exact : Math.round(exact);
}

export function totalCents(lines: readonly CartLine[]): number {
	const subtotal = subtotalCents(lines);
	return subtotal - discountCents(subtotal);
}

export function formatCents(cents: number): string {
	return (cents / 100).toFixed(2);
}
