import { CartError } from "./cart-error";
import type { AppliedDiscount, DiscountRule } from "./discount-rule";
import { NoTax, type TaxPolicy } from "./tax-policy";

// EN: A line validates itself in the constructor, so an invalid line can never exist. Every
//     other class may then trust any CartLine it receives without checking it again.
// PT: Uma linha se valida no construtor, então uma linha inválida nunca chega a existir. Todas
//     as outras classes podem confiar em qualquer CartLine que recebem, sem conferir de novo.
// ES: Una línea se valida en el constructor, así que una línea inválida nunca llega a existir.
//     Todas las demás clases pueden confiar en cualquier CartLine que reciban, sin verificarla
//     de nuevo.
export class CartLine {
	readonly sku: string;
	readonly unitPriceCents: number;
	readonly quantity: number;

	constructor(sku: string, unitPriceCents: number, quantity: number) {
		if (!Number.isInteger(quantity) || quantity < 1) {
			throw new CartError("invalid-quantity");
		}
		if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
			throw new CartError("invalid-price");
		}
		this.sku = sku;
		this.unitPriceCents = unitPriceCents;
		this.quantity = quantity;
	}

	totalCents(): number {
		return this.unitPriceCents * this.quantity;
	}
}

export interface Receipt {
	readonly subtotalCents: number;
	readonly discounts: readonly AppliedDiscount[];
	readonly taxCents: number;
	readonly totalCents: number;
}

// EN: The cart owns its state. The fields are private (`#`), so the only way to change the
//     cart is through its methods, and the only way to learn the total is to ask the cart to
//     compute it ("tell, don't ask"). The cart is mutable: `add` changes this very object.
// PT: O carrinho é dono do seu estado. Os campos são privados (`#`), então a única forma de
//     alterar o carrinho é pelos seus métodos, e a única forma de saber o total é pedir que o
//     carrinho o calcule ("tell, don't ask"). O carrinho é mutável: `add` altera este mesmo
//     objeto.
// ES: El carrito es dueño de su estado. Los campos son privados (`#`), así que la única forma de
//     modificar el carrito es mediante sus métodos, y la única forma de conocer el total es pedirle
//     al carrito que lo calcule ("tell, don't ask"). El carrito es mutable: `add` modifica este
//     mismo objeto.
export class Cart {
	readonly #lines: CartLine[] = [];
	readonly #rules: DiscountRule[] = [];
	#tax: TaxPolicy = new NoTax();

	add(line: CartLine): void {
		this.#lines.push(line);
	}

	addRule(rule: DiscountRule): void {
		this.#rules.push(rule);
	}

	setTaxPolicy(tax: TaxPolicy): void {
		this.#tax = tax;
	}

	// EN: A copy goes out, never the internal array. A caller that changes the returned list
	//     does not change the cart.
	// PT: Sai uma cópia, nunca o array interno. Quem alterar a lista devolvida não altera o
	//     carrinho.
	// ES: Sale una copia, nunca el array interno. Quien modifique la lista devuelta no modifica el
	//     carrito.
	lines(): readonly CartLine[] {
		return [...this.#lines];
	}

	// EN: The cart knows only the two interfaces. Each rule object answers `discountCents` and
	//     `describe` in its own way (polymorphism), so this loop never changes when a rule is
	//     added. A rule can never take more than what is left to pay.
	// PT: O carrinho conhece só as duas interfaces. Cada objeto de regra responde a
	//     `discountCents` e a `describe` do seu jeito (polimorfismo), então este laço nunca muda
	//     quando uma regra é adicionada. Uma regra nunca tira mais do que resta a pagar.
	// ES: El carrito conoce solo las dos interfaces. Cada objeto de regla responde a
	//     `discountCents` y a `describe` a su manera (polimorfismo), así que este ciclo nunca cambia
	//     cuando se agrega una regla. Una regla nunca quita más de lo que queda por pagar.
	checkout(): Receipt {
		const subtotalCents = this.#lines.reduce((sum, line) => sum + line.totalCents(), 0);
		const discounts: AppliedDiscount[] = [];
		let runningCents = subtotalCents;
		for (const rule of this.#rules) {
			const amountCents = Math.min(rule.discountCents(this.#lines, runningCents), runningCents);
			if (amountCents > 0) {
				discounts.push({ label: rule.describe(), amountCents });
				runningCents -= amountCents;
			}
		}
		const taxCents = this.#tax.taxCents(runningCents);
		return { subtotalCents, discounts, taxCents, totalCents: runningCents + taxCents };
	}
}
