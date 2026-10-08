import type { Kind } from "./kind";

export function trackingCode(kind: Kind, orderNumber: number): string {
	const number = String(orderNumber).padStart(6, "0");
	if (kind === "standard") {
		return `ST-${number}`;
	} else if (kind === "express") {
		return `EX-${number}`;
	} else if (kind === "pickup") {
		return `PK-${number}`;
	}
	throw new Error(`unknown delivery kind: ${kind}`);
}
