// EN: What both versions of the shop must do. `createShop` receives the price of each product.
// PT: O que as duas versões da loja precisam fazer. `createShop` recebe o preço de cada produto.

export interface Shop {
	restock(sku: string, quantity: number): void;
	stockOf(sku: string): number;
	/** Returns the order number, or throws when the product is unknown or out of stock. */
	placeOrder(email: string, sku: string, quantity: number): string;
	/** The e-mails "sent" so far. Nothing leaves the process. */
	outbox(): readonly string[];
	salesReport(): string;
}

export type CreateShop = (pricesCents: Record<string, number>) => Shop;
