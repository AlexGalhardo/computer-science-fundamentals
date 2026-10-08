import type { Bank } from "./bank";

export interface Expression {
	reduce(bank: Bank, to: string): Money;
}

export class Money implements Expression {
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

	plus(addend: Money): Expression {
		return new Sum(this, addend);
	}

	reduce(bank: Bank, to: string): Money {
		return new Money(this.amount / bank.rate(this.currency, to), to);
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}
}

export class Sum implements Expression {
	readonly augend: Money;
	readonly addend: Money;

	constructor(augend: Money, addend: Money) {
		this.augend = augend;
		this.addend = addend;
	}

	reduce(bank: Bank, to: string): Money {
		const amount = this.augend.reduce(bank, to).amount + this.addend.reduce(bank, to).amount;
		return new Money(amount, to);
	}
}
