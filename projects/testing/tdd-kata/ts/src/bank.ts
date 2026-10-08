import type { Money } from "./money";

export class Bank {
	private readonly rates = new Map<string, number>();

	addRate(from: string, to: string, rate: number): void {
		this.rates.set([from, to].join("->"), rate);
	}

	rate(from: string, to: string): number {
		if (from === to) {
			return 1;
		}
		const rate = this.rates.get([from, to].join("->"));
		if (rate === undefined) {
			throw new Error(["no rate from", from, "to", to].join(" "));
		}
		return rate;
	}

	reduce(source: Money, to: string): Money {
		return source.reduce(this, to);
	}
}
