// EN: The receiver: a cart that only knows how to hold quantities.
// PT: O receptor: um carrinho que só sabe guardar quantidades.
export class Cart {
	private readonly items = new Map<string, number>();

	quantity(sku: string): number {
		return this.items.get(sku) ?? 0;
	}

	set(sku: string, quantity: number): void {
		if (quantity <= 0) {
			this.items.delete(sku);
		} else {
			this.items.set(sku, quantity);
		}
	}
}

// EN: COMMAND. A request becomes an object that carries its data and knows both how to run and
//     how to reverse itself. A new operation is a new class, and the history below never
//     changes.
// PT: COMMAND. Um pedido vira um objeto que carrega seus dados e sabe tanto se executar quanto
//     se reverter. Uma operação nova é uma classe nova, e o histórico abaixo nunca muda.
export interface Command {
	execute(): void;
	undo(): void;
}

export class AddItem implements Command {
	constructor(
		private readonly cart: Cart,
		private readonly sku: string,
		private readonly quantity: number,
	) {}

	execute(): void {
		this.cart.set(this.sku, this.cart.quantity(this.sku) + this.quantity);
	}

	undo(): void {
		this.cart.set(this.sku, this.cart.quantity(this.sku) - this.quantity);
	}
}

export class RemoveItem implements Command {
	private previous = 0;

	constructor(
		private readonly cart: Cart,
		private readonly sku: string,
	) {}

	// EN: The command remembers what it destroyed, which is what makes the undo exact.
	// PT: O comando lembra o que destruiu, e é isso que torna o desfazer exato.
	execute(): void {
		this.previous = this.cart.quantity(this.sku);
		this.cart.set(this.sku, 0);
	}

	undo(): void {
		this.cart.set(this.sku, this.previous);
	}
}

// EN: The invoker. Two stacks: undo reverses the most recent command first, because each
//     command ran on the result of the previous one. Running a new command clears the redo
//     stack, since the undone future no longer applies.
// PT: O invocador. Duas pilhas: desfazer reverte primeiro o comando mais recente, porque cada
//     comando rodou sobre o resultado do anterior. Executar um comando novo esvazia a pilha de
//     refazer, já que o futuro desfeito deixou de valer.
export class History {
	private readonly done: Command[] = [];
	private readonly undone: Command[] = [];

	run(command: Command): void {
		command.execute();
		this.done.push(command);
		this.undone.length = 0;
	}

	undo(): boolean {
		const command = this.done.pop();
		if (command === undefined) {
			return false;
		}
		command.undo();
		this.undone.push(command);
		return true;
	}

	redo(): boolean {
		const command = this.undone.pop();
		if (command === undefined) {
			return false;
		}
		command.execute();
		this.done.push(command);
		return true;
	}
}
