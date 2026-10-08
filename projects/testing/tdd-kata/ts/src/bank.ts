import type { Expression, Money } from "./money";

function rateKey(from: string, to: string): string {
	return [from, to].join("->");
}

export class Bank {
	private readonly rates = new Map<string, number>();

	addRate(from: string, to: string, rate: number): void {
		this.rates.set(rateKey(from, to), rate);
	}

	rate(from: string, to: string): number {
		if (from === to) {
			return 1;
		}
		const rate = this.rates.get(rateKey(from, to));
		if (rate === undefined) {
			throw new Error(["no rate from", from, "to", to].join(" "));
		}
		return rate;
	}

	reduce(source: Expression, to: string): Money {
		return source.reduce(this, to);
	}
}
