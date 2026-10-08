// EN: Three parts of a billing system that all show money to the user.
// PT: Três partes de um sistema de cobrança que mostram dinheiro para o usuário.

export interface Billing {
	cartLine(name: string, unitCents: number, quantity: number): string;
	invoiceTotal(amountsCents: readonly number[]): string;
	reportRow(label: string, cents: number): string;
}
