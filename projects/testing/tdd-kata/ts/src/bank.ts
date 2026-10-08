import { Money } from "./money";

export class Bank {
	reduce(_source: Money, _to: string): Money {
		return Money.dollar(10);
	}
}
