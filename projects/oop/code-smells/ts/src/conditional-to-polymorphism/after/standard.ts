import { type DeliveryMethod, startedKilos } from "./delivery-method";

export class Standard implements DeliveryMethod {
	readonly name = "standard";
	readonly trackingPrefix = "ST";

	costCents(grams: number): number {
		return 1200 + 300 * startedKilos(grams);
	}

	days(): number {
		return 5;
	}
}
