export class Money {
	readonly amount: number;

	constructor(amount: number) {
		this.amount = amount;
	}

	equals(other: Money): boolean {
		return this.amount === other.amount;
	}
}

export class Dollar extends Money {
	times(multiplier: number): Dollar {
		return new Dollar(this.amount * multiplier);
	}
}

export class Franc extends Money {
	times(multiplier: number): Franc {
		return new Franc(this.amount * multiplier);
	}
}
