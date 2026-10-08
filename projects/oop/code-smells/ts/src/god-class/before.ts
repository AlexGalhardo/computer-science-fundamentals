import type { CreateShop, Shop } from "./contract";

// EN: SMELL: God Class. One class keeps the stock, knows the prices, numbers the orders, writes
//     e-mails and builds the report. It has five reasons to change, every method can touch every
//     field, and nothing can be tested or reused without the rest: to check the stock rule you
//     must also have prices, an outbox and a sales table.
// PT: MAU CHEIRO: Classe Deus. Uma classe guarda o estoque, conhece os preços, numera os pedidos,
//     escreve e-mails e monta o relatório. Ela tem cinco motivos para mudar, todo método pode
//     mexer em todo campo, e nada pode ser testado ou reaproveitado sem o resto: para conferir a
//     regra de estoque é preciso ter também preços, caixa de saída e tabela de vendas.
class GodShop implements Shop {
	private stock = new Map<string, number>();
	private prices: Record<string, number>;
	private nextOrder = 1;
	private sent: string[] = [];
	private soldUnits = new Map<string, number>();
	private soldCents = new Map<string, number>();

	constructor(pricesCents: Record<string, number>) {
		this.prices = pricesCents;
	}

	restock(sku: string, quantity: number): void {
		if (!Number.isInteger(quantity) || quantity < 1) {
			throw new Error("invalid quantity");
		}
		this.stock.set(sku, (this.stock.get(sku) ?? 0) + quantity);
	}

	stockOf(sku: string): number {
		return this.stock.get(sku) ?? 0;
	}

	placeOrder(email: string, sku: string, quantity: number): string {
		if (!Number.isInteger(quantity) || quantity < 1) {
			throw new Error("invalid quantity");
		}
		const price = this.prices[sku];
		if (price === undefined) {
			throw new Error(`unknown product ${sku}`);
		}
		const available = this.stock.get(sku) ?? 0;
		if (available < quantity) {
			throw new Error(`out of stock: ${sku}`);
		}
		this.stock.set(sku, available - quantity);
		const total = price * quantity;
		const id = `ORD-${this.nextOrder}`;
		this.nextOrder += 1;
		this.soldUnits.set(sku, (this.soldUnits.get(sku) ?? 0) + quantity);
		this.soldCents.set(sku, (this.soldCents.get(sku) ?? 0) + total);
		this.sent.push(`To: ${email} | Order ${id}: ${quantity} x ${sku}, total ${(total / 100).toFixed(2)}`);
		if (available - quantity === 0) {
			this.sent.push(`To: stock@shop.example | ${sku} is sold out`);
		}
		return id;
	}

	outbox(): readonly string[] {
		return [...this.sent];
	}

	salesReport(): string {
		const lines: string[] = [];
		let total = 0;
		for (const sku of [...this.soldUnits.keys()].sort()) {
			const cents = this.soldCents.get(sku) ?? 0;
			total += cents;
			lines.push(`${sku}: ${this.soldUnits.get(sku)} units, ${(cents / 100).toFixed(2)}`);
		}
		lines.push(`TOTAL: ${(total / 100).toFixed(2)}`);
		return lines.join("\n");
	}
}

export const createShop: CreateShop = (pricesCents) => new GodShop(pricesCents);
