export class Money {
	readonly amount: number;
	readonly currency: string;

	constructor(amount: number, currency: string) {
		this.amount = amount;
		this.currency = currency;
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}
}

export class Dollar extends Money {
	constructor(amount: number) {
		super(amount, "USD");
	}

	times(multiplier: number): Dollar {
		return new Dollar(this.amount * multiplier);
	}
}

export class Franc extends Money {
	constructor(amount: number) {
		super(amount, "CHF");
	}

	times(multiplier: number): Franc {
		return new Franc(this.amount * multiplier);
	}
}
