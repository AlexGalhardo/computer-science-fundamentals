import type { Bank } from "./bank";

export interface Expression {
	plus(addend: Expression): Expression;
	times(multiplier: number): Expression;
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

	plus(addend: Expression): Expression {
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
	readonly augend: Expression;
	readonly addend: Expression;

	constructor(augend: Expression, addend: Expression) {
		this.augend = augend;
		this.addend = addend;
	}

	plus(addend: Expression): Expression {
		return new Sum(this, addend);
	}

	times(multiplier: number): Expression {
		return new Sum(this.augend.times(multiplier), this.addend.times(multiplier));
	}

	reduce(bank: Bank, to: string): Money {
		const amount = this.augend.reduce(bank, to).amount + this.addend.reduce(bank, to).amount;
		return new Money(amount, to);
	}
}
