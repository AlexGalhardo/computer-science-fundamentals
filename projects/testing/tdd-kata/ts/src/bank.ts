import type { Money } from "./money";

export class Bank {
	reduce(source: Money, _to: string): Money {
		return source;
	}
}
