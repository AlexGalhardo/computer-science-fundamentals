import type { Kind } from "./kind";

export function deliveryDays(kind: Kind): number {
	if (kind === "standard") {
		return 5;
	} else if (kind === "express") {
		return 1;
	} else if (kind === "pickup") {
		return 0;
	}
	throw new Error(`unknown delivery kind: ${kind}`);
}
