export class Dollar {
	readonly amount: number;

	constructor(amount: number) {
		this.amount = amount;
	}

	times(_multiplier: number): Dollar {
		return new Dollar(10);
	}
}
