import type { DeliveryMethod } from "./delivery-method";

export class Pickup implements DeliveryMethod {
	readonly name = "pickup";
	readonly trackingPrefix = "PK";

	costCents(_grams: number): number {
		return 0;
	}

	days(): number {
		return 0;
	}
}
