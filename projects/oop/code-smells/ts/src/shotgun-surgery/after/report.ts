import { formatMoney } from "./money";

export function reportRow(label: string, cents: number): string {
	return `${label.padEnd(12, ".")} ${formatMoney(cents)}`;
}
