import { type DeliveryMethod, startedKilos } from "./delivery-method";

export class Express implements DeliveryMethod {
	readonly name = "express";
	readonly trackingPrefix = "EX";

	costCents(grams: number): number {
		return 2500 + 500 * startedKilos(grams);
	}

	days(): number {
		return 1;
	}
}
