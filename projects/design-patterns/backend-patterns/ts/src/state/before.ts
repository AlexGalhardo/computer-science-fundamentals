export type Status = "pending" | "paid" | "shipped" | "cancelled";

// EN: FAILING DESIGN. One status field, and every method starts by testing it. The rules of a
//     status are scattered over all the methods: to learn what a paid order can do, the whole
//     class must be read, and a new status means reviewing every method.
// PT: DESENHO COM DEFEITO. Um campo de status, e todo método começa testando esse campo. As
//     regras de um status ficam espalhadas por todos os métodos: para saber o que um pedido
//     pago pode fazer é preciso ler a classe inteira, e um status novo exige rever cada método.
export class Order {
	private current: Status = "pending";

	get status(): Status {
		return this.current;
	}

	pay(): void {
		if (this.current === "pending") {
			this.current = "paid";
		} else {
			throw new Error(`cannot pay a ${this.current} order`);
		}
	}

	ship(): void {
		if (this.current === "paid") {
			this.current = "shipped";
		} else {
			throw new Error(`cannot ship a ${this.current} order`);
		}
	}

	cancel(): void {
		if (this.current === "pending" || this.current === "paid") {
			this.current = "cancelled";
		} else {
			throw new Error(`cannot cancel a ${this.current} order`);
		}
	}
}
