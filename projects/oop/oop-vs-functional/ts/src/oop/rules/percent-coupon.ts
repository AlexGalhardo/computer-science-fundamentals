import type { CartLine } from "../cart";
import { requirePercent } from "../cart-error";
import type { DiscountRule } from "../discount-rule";

// EN: A percentage of what is still to pay. Fractions of a cent are dropped.
// PT: Uma porcentagem do que ainda falta pagar. Frações de centavo são descartadas.
export class PercentCoupon implements DiscountRule {
	readonly #code: string;
	readonly #percent: number;

	constructor(code: string, percent: number) {
		requirePercent(percent);
		this.#code = code;
		this.#percent = percent;
	}

	discountCents(_lines: readonly CartLine[], runningCents: number): number {
		return Math.floor((runningCents * this.#percent) / 100);
	}

	describe(): string {
		return `coupon ${this.#code}: ${this.#percent}% off`;
	}
}
