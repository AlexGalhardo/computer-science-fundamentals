// EN: FAILING DESIGN. The order knows every reaction to its own payment. Each new reaction
//     (loyalty points, analytics, invoice) is one more line inside `pay`, so the business
//     rule changes for reasons that have nothing to do with paying.
// PT: DESENHO COM DEFEITO. O pedido conhece todas as reações ao próprio pagamento. Cada reação
//     nova (pontos de fidelidade, métricas, nota fiscal) é mais uma linha dentro de `pay`,
//     então a regra de negócio muda por motivos que não têm relação com pagar.
export class Order {
	readonly effects: string[] = [];
	private paid = false;

	constructor(
		readonly id: string,
		readonly email: string,
	) {}

	isPaid(): boolean {
		return this.paid;
	}

	pay(): void {
		if (this.paid) {
			throw new Error(`order ${this.id} is already paid`);
		}
		this.paid = true;
		this.effects.push(`receipt sent to ${this.email}`);
		this.effects.push(`stock reserved for ${this.id}`);
	}
}
