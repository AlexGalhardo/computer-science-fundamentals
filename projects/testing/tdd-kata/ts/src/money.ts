export class Dollar {
	readonly amount: number;

	constructor(amount: number) {
		this.amount = amount;
	}

	times(multiplier: number): Dollar {
		return new Dollar(this.amount * multiplier);
	}

	equals(other: Dollar): boolean {
		return this.amount === other.amount;
	}
}

export class Franc {
	readonly amount: number;

	constructor(amount: number) {
		this.amount = amount;
	}

	times(multiplier: number): Franc {
		return new Franc(this.amount * multiplier);
	}

	equals(other: Franc): boolean {
		return this.amount === other.amount;
	}
}
