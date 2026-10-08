import type { Bank } from "./bank";

export class Money {
	readonly amount: number;
	readonly currency: string;

	constructor(amount: number, currency: string) {
		this.amount = amount;
		this.currency = currency;
	}

	static dollar(amount: number): Money {
		return new Money(amount, "USD");
	}

	static franc(amount: number): Money {
		return new Money(amount, "CHF");
	}

	times(multiplier: number): Money {
		return new Money(this.amount * multiplier, this.currency);
	}

	plus(addend: Money): Money {
		return new Money(this.amount + addend.amount, this.currency);
	}

	reduce(bank: Bank, to: string): Money {
		return new Money(this.amount / bank.rate(this.currency, to), to);
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}
}
