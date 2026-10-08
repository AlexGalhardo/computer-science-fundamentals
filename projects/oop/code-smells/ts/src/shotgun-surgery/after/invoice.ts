import { formatMoney } from "./money";

export function invoiceTotal(amountsCents: readonly number[]): string {
	return `Total: ${formatMoney(amountsCents.reduce((sum, amount) => sum + amount, 0))}`;
}
