// EN: Three parts of a billing system that all show money to the user.
// PT: Três partes de um sistema de cobrança que mostram dinheiro para o usuário.
// ES: Tres partes de un sistema de cobro que muestran dinero al usuario.

export interface Billing {
	cartLine(name: string, unitCents: number, quantity: number): string;
	invoiceTotal(amountsCents: readonly number[]): string;
	reportRow(label: string, cents: number): string;
}
