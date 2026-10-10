import type { CartLine } from "../cart";
import { CartError } from "../cart-error";
import type { DiscountRule } from "../discount-rule";

// EN: "Take 3, pay 2": in every complete group of `take` units, `take - pay` units are free.
//     This was the last rule added to the project. In this version it is this one new file:
//     no other production file was touched (see the comparison in the README).
// PT: "Leve 3, pague 2": em cada grupo completo de `take` unidades, `take - pay` unidades saem
//     de graça. Esta foi a última regra acrescentada ao projeto. Nesta versão ela é este único
//     arquivo novo: nenhum outro arquivo de produção foi tocado (veja a comparação no README).
// ES: "Lleve 3, pague 2": en cada grupo completo de `take` unidades, `take - pay` unidades salen
//     gratis. Esta fue la última regla agregada al proyecto. En esta versión es este único
//     archivo nuevo: no se tocó ningún otro archivo de producción (ve la comparación en el README).
export class TakePayDiscount implements DiscountRule {
	readonly #sku: string;
	readonly #take: number;
	readonly #pay: number;

	constructor(sku: string, take: number, pay: number) {
		if (!Number.isInteger(take) || !Number.isInteger(pay) || pay < 1 || pay >= take) {
			throw new CartError("invalid-rule");
		}
		this.#sku = sku;
		this.#take = take;
		this.#pay = pay;
	}

	discountCents(lines: readonly CartLine[], _runningCents: number): number {
		return lines
			.filter((line) => line.sku === this.#sku)
			.reduce(
				(sum, line) =>
					sum + Math.floor(line.quantity / this.#take) * (this.#take - this.#pay) * line.unitPriceCents,
				0,
			);
	}

	describe(): string {
		return `${this.#sku}: take ${this.#take}, pay ${this.#pay}`;
	}
}
