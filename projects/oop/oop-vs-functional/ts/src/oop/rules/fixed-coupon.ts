import type { CartLine } from "../cart";
import { CartError } from "../cart-error";
import type { DiscountRule } from "../discount-rule";

// EN: A fixed amount. The cart clamps it, so a coupon bigger than the cart makes the total zero,
//     never negative.
// PT: Um valor fixo. O carrinho o limita, então um cupom maior que o carrinho zera o total,
//     nunca o deixa negativo.
export class FixedCoupon implements DiscountRule {
	readonly #code: string;
	readonly #amountCents: number;

	constructor(code: string, amountCents: number) {
		if (!Number.isInteger(amountCents) || amountCents < 0) {
			throw new CartError("invalid-rule");
		}
		this.#code = code;
		this.#amountCents = amountCents;
	}

	discountCents(_lines: readonly CartLine[], _runningCents: number): number {
		return this.#amountCents;
	}

	describe(): string {
		const whole = Math.floor(this.#amountCents / 100);
		const cents = String(this.#amountCents % 100).padStart(2, "0");
		return `coupon ${this.#code}: ${whole}.${cents} off`;
	}
}
