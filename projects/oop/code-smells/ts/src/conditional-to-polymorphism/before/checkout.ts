import { costCents } from "./cost";
import { deliveryDays } from "./eta";
import type { Kind } from "./kind";
import { trackingCode } from "./tracking";

export function shippingLine(kind: Kind, grams: number, orderNumber: number): string {
	const cost = (costCents(kind, grams) / 100).toFixed(2);
	return `${kind}: ${cost}, days ${deliveryDays(kind)}, ${trackingCode(kind, orderNumber)}`;
}
