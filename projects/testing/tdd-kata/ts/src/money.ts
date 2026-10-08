export class Money {
	readonly amount: number;
	readonly currency: string;

	constructor(amount: number, currency: string) {
		this.amount = amount;
		this.currency = currency;
	}

	times(multiplier: number): Money {
		return new Money(this.amount * multiplier, this.currency);
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}
}

export class Dollar extends Money {
	constructor(amount: number) {
		super(amount, "USD");
	}
}

export class Franc extends Money {
	constructor(amount: number) {
		super(amount, "CHF");
	}
}
