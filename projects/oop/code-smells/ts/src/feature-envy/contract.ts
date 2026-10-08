// EN: Both versions receive the same plain data and must print the same invoice.
// PT: As duas versões recebem os mesmos dados simples e precisam imprimir a mesma fatura.

export interface InvoiceInput {
	customer: { name: string; street: string; number: string; city: string; state: string; zip: string };
	lines: { description: string; unitCents: number; quantity: number }[];
}

export type RenderInvoice = (input: InvoiceInput) => string;
