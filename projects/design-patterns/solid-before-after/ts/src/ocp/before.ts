// EN: VIOLATES THE OPEN-CLOSED PRINCIPLE. The list of customer kinds is written inside the
//     function. Every new kind is an edit to code that already works and is already tested,
//     and nobody outside this file can add one.
// PT: QUEBRA O PRINCÍPIO ABERTO-FECHADO. A lista de tipos de cliente está escrita dentro da
//     função. Todo tipo novo é uma edição em código que já funciona e já está testado, e
//     ninguém de fora deste arquivo consegue acrescentar um.
// ES: ROMPE EL PRINCIPIO ABIERTO-CERRADO. La lista de tipos de cliente está escrita dentro de
//     la función. Todo tipo nuevo es una edición en código que ya funciona y ya está probado, y
//     nadie fuera de este archivo puede añadir uno.
export function discountCents(kind: string, totalCents: number): number {
	if (kind === "regular") {
		return 0;
	}
	if (kind === "premium") {
		return Math.round(totalCents * 0.1);
	}
	if (kind === "employee") {
		return Math.round(totalCents * 0.3);
	}
	throw new Error(`unknown customer kind: ${kind}`);
}
