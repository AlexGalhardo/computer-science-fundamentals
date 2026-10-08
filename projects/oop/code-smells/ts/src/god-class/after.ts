import type { CreateShop, Shop } from "./contract";

// EN: REFACTORED with Extract Class. Each responsibility of the god class became a small class
//     with its own private state: Inventory, PriceList, Outbox, SalesLedger. What is left of
//     the shop only coordinates them. Each class has one reason to change and can be tested
//     alone, and the fields of one are out of reach of the others.
// PT: REFATORADO com Extrair Classe. Cada responsabilidade da classe deus virou uma classe
//     pequena com seu próprio estado privado: Inventory, PriceList, Outbox, SalesLedger. O que
//     sobrou da loja só as coordena. Cada classe tem um motivo para mudar e pode ser testada
//     sozinha, e os campos de uma ficam fora do alcance das outras.

const money = (cents: number): string => (cents / 100).toFixed(2);

function requireQuantity(quantity: number): void {
	if (!Number.isInteger(quantity) || quantity < 1) {
		throw new Error("invalid quantity");
	}
}

export class Inventory {
	readonly #stock = new Map<string, number>();

	add(sku: string, quantity: number): void {
		requireQuantity(quantity);
		this.#stock.set(sku, this.of(sku) + quantity);
	}

	of(sku: string): number {
		return this.#stock.get(sku) ?? 0;
	}

	/** Takes the units out and returns how many are left. */
	remove(sku: string, quantity: number): number {
		requireQuantity(quantity);
		const left = this.of(sku) - quantity;
		if (left < 0) {
			throw new Error(`out of stock: ${sku}`);
		}
		this.#stock.set(sku, left);
		return left;
	}
}

export class PriceList {
	readonly #pricesCents: Record<string, number>;

	constructor(pricesCents: Record<string, number>) {
		this.#pricesCents = { ...pricesCents };
	}

	totalCents(sku: string, quantity: number): number {
		const price = this.#pricesCents[sku];
		if (price === undefined) {
			throw new Error(`unknown product ${sku}`);
		}
		return price * quantity;
	}
}

export class Outbox {
	readonly #sent: string[] = [];

	send(to: string, body: string): void {
		this.#sent.push(`To: ${to} | ${body}`);
	}

	messages(): readonly string[] {
		return [...this.#sent];
	}
}

export class SalesLedger {
	readonly #bySku = new Map<string, { units: number; cents: number }>();

	record(sku: string, units: number, cents: number): void {
		const current = this.#bySku.get(sku) ?? { units: 0, cents: 0 };
		this.#bySku.set(sku, { units: current.units + units, cents: current.cents + cents });
	}

	report(): string {
		const skus = [...this.#bySku.keys()].sort();
		const rows = skus.map((sku) => {
			const sold = this.#bySku.get(sku) ?? { units: 0, cents: 0 };
			return { text: `${sku}: ${sold.units} units, ${money(sold.cents)}`, cents: sold.cents };
		});
		const total = rows.reduce((sum, row) => sum + row.cents, 0);
		return [...rows.map((row) => row.text), `TOTAL: ${money(total)}`].join("\n");
	}
}

// EN: The coordinator receives its collaborators ready-made (dependency injection), so a test
//     can hand it an Outbox of its own and look inside afterwards.
// PT: O coordenador recebe seus colaboradores prontos (injeção de dependência), então um teste
//     pode entregar a ele um Outbox próprio e olhar dentro depois.
export class CoordinatingShop implements Shop {
	readonly #inventory: Inventory;
	readonly #prices: PriceList;
	readonly #outbox: Outbox;
	readonly #ledger: SalesLedger;
	#nextOrder = 1;

	constructor(inventory: Inventory, prices: PriceList, outbox: Outbox, ledger: SalesLedger) {
		this.#inventory = inventory;
		this.#prices = prices;
		this.#outbox = outbox;
		this.#ledger = ledger;
	}

	restock(sku: string, quantity: number): void {
		this.#inventory.add(sku, quantity);
	}

	stockOf(sku: string): number {
		return this.#inventory.of(sku);
	}

	placeOrder(email: string, sku: string, quantity: number): string {
		requireQuantity(quantity);
		const total = this.#prices.totalCents(sku, quantity);
		const left = this.#inventory.remove(sku, quantity);
		const id = `ORD-${this.#nextOrder}`;
		this.#nextOrder += 1;
		this.#ledger.record(sku, quantity, total);
		this.#outbox.send(email, `Order ${id}: ${quantity} x ${sku}, total ${money(total)}`);
		if (left === 0) {
			this.#outbox.send("stock@shop.example", `${sku} is sold out`);
		}
		return id;
	}

	outbox(): readonly string[] {
		return this.#outbox.messages();
	}

	salesReport(): string {
		return this.#ledger.report();
	}
}

export const createShop: CreateShop = (pricesCents) =>
	new CoordinatingShop(new Inventory(), new PriceList(pricesCents), new Outbox(), new SalesLedger());
