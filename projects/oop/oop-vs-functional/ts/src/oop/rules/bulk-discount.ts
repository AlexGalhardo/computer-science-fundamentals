import type { CartLine } from "../cart";
import { CartError, requirePercent } from "../cart-error";
import type { DiscountRule } from "../discount-rule";

// EN: A percentage off the lines of one product, from a minimum quantity on. This rule looks at
//     the lines and ignores the running total, the opposite of the coupons.
// PT: Uma porcentagem sobre as linhas de um produto, a partir de uma quantidade mínima. Esta
//     regra olha as linhas e ignora o total corrente, o oposto dos cupons.
// ES: Un porcentaje sobre las líneas de un producto, a partir de una cantidad mínima. Esta regla
//     mira las líneas e ignora el total corriente, lo opuesto a los cupones.
export class BulkDiscount implements DiscountRule {
	readonly #sku: string;
	readonly #minQuantity: number;
	readonly #percent: number;

	constructor(sku: string, minQuantity: number, percent: number) {
		if (!Number.isInteger(minQuantity) || minQuantity < 1) {
			throw new CartError("invalid-rule");
		}
		requirePercent(percent);
		this.#sku = sku;
		this.#minQuantity = minQuantity;
		this.#percent = percent;
	}

	discountCents(lines: readonly CartLine[], _runningCents: number): number {
		return lines
			.filter((line) => line.sku === this.#sku && line.quantity >= this.#minQuantity)
			.reduce((sum, line) => sum + Math.floor((line.totalCents() * this.#percent) / 100), 0);
	}

	describe(): string {
		return `bulk ${this.#sku}: ${this.#percent}% off from ${this.#minQuantity} units`;
	}
}
