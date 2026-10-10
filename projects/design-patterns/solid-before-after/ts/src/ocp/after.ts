// EN: OPEN-CLOSED. A discount rule is an object behind an interface, and the calculator only
//     walks the rules it was given. The calculator is closed (it never changes again) and the
//     system is open (a new kind is a new rule handed to `createDiscounts`).
// PT: ABERTO-FECHADO. Uma regra de desconto é um objeto atrás de uma interface, e a calculadora
//     só percorre as regras que recebeu. A calculadora fica fechada (não muda mais) e o sistema
//     fica aberto (um tipo novo é uma regra nova entregue a `createDiscounts`).
// ES: ABIERTO-CERRADO. Una regla de descuento es un objeto detrás de una interfaz, y la
//     calculadora solo recorre las reglas que recibió. La calculadora queda cerrada (ya no
//     cambia) y el sistema queda abierto (un tipo nuevo es una regla nueva entregada a
//     `createDiscounts`).
export interface DiscountRule {
	readonly kind: string;
	discount(totalCents: number): number;
}

export const defaultRules: DiscountRule[] = [
	{ kind: "regular", discount: () => 0 },
	{ kind: "premium", discount: (totalCents) => Math.round(totalCents * 0.1) },
	{ kind: "employee", discount: (totalCents) => Math.round(totalCents * 0.3) },
];

export function createDiscounts(rules: DiscountRule[]): (kind: string, totalCents: number) => number {
	return (kind, totalCents) => {
		const rule = rules.find((item) => item.kind === kind);
		if (rule === undefined) {
			throw new Error(`unknown customer kind: ${kind}`);
		}
		return rule.discount(totalCents);
	};
}

export const discountCents = createDiscounts(defaultRules);
