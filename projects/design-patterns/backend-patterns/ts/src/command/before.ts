type Entry = { kind: "add"; sku: string; quantity: number } | { kind: "remove"; sku: string; previous: number };

// EN: FAILING DESIGN. The cart executes each operation in its own method and undoes all of them
//     in one `switch`. The knowledge of an operation is split in two places, so every new
//     operation (apply a coupon, change a quantity) edits the cart twice, and there is no
//     object that could be queued, logged or redone.
// PT: DESENHO COM DEFEITO. O carrinho executa cada operação em um método próprio e desfaz todas
//     em um único `switch`. O conhecimento de uma operação fica dividido em dois lugares, então
//     toda operação nova (aplicar cupom, mudar quantidade) edita o carrinho duas vezes, e não
//     existe um objeto que possa ser enfileirado, registrado ou refeito.
export class Cart {
	private readonly items = new Map<string, number>();
	private readonly log: Entry[] = [];

	quantity(sku: string): number {
		return this.items.get(sku) ?? 0;
	}

	add(sku: string, quantity: number): void {
		this.items.set(sku, this.quantity(sku) + quantity);
		this.log.push({ kind: "add", sku, quantity });
	}

	remove(sku: string): void {
		this.log.push({ kind: "remove", sku, previous: this.quantity(sku) });
		this.items.delete(sku);
	}

	undo(): void {
		const entry = this.log.pop();
		if (entry === undefined) {
			return;
		}
		switch (entry.kind) {
			case "add":
				this.items.set(entry.sku, this.quantity(entry.sku) - entry.quantity);
				break;
			case "remove":
				this.items.set(entry.sku, entry.previous);
				break;
		}
	}
}
