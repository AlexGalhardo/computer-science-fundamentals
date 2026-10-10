export type Status = "pending" | "paid" | "shipped" | "cancelled";

// EN: STATE. Each status is an object that answers every operation for that phase and returns
//     the next state. Everything a paid order can do is in `paid`, in one place, and a new
//     status is a new object plus the transitions that lead to it.
// PT: STATE. Cada status é um objeto que responde a todas as operações naquela fase e devolve o
//     próximo estado. Tudo o que um pedido pago pode fazer está em `paid`, em um lugar só, e um
//     status novo é um objeto novo mais as transições que levam a ele.
// ES: STATE. Cada estado es un objeto que responde a todas las operaciones en esa fase y
//     devuelve el siguiente estado. Todo lo que puede hacer un pedido pagado está en `paid`, en
//     un solo lugar, y un estado nuevo es un objeto nuevo más las transiciones que llevan a él.
interface OrderState {
	readonly status: Status;
	pay(): OrderState;
	ship(): OrderState;
	cancel(): OrderState;
}

function refuse(action: string, status: Status): never {
	throw new Error(`cannot ${action} a ${status} order`);
}

const cancelled: OrderState = {
	status: "cancelled",
	pay: () => refuse("pay", "cancelled"),
	ship: () => refuse("ship", "cancelled"),
	cancel: () => refuse("cancel", "cancelled"),
};

const shipped: OrderState = {
	status: "shipped",
	pay: () => refuse("pay", "shipped"),
	ship: () => refuse("ship", "shipped"),
	cancel: () => refuse("cancel", "shipped"),
};

const paid: OrderState = {
	status: "paid",
	pay: () => refuse("pay", "paid"),
	ship: () => shipped,
	cancel: () => cancelled,
};

const pending: OrderState = {
	status: "pending",
	pay: () => paid,
	ship: () => refuse("ship", "pending"),
	cancel: () => cancelled,
};

// EN: The context has no conditional. It delegates to the current state and stores the state
//     that comes back, so the transition is part of the behaviour of each state.
// PT: O contexto não tem condicional. Ele delega para o estado atual e guarda o estado que
//     volta, então a transição faz parte do comportamento de cada estado.
// ES: El contexto no tiene condicionales. Delega en el estado actual y guarda el estado que
//     vuelve, así que la transición es parte del comportamiento de cada estado.
export class Order {
	private state: OrderState = pending;

	get status(): Status {
		return this.state.status;
	}

	pay(): void {
		this.state = this.state.pay();
	}

	ship(): void {
		this.state = this.state.ship();
	}

	cancel(): void {
		this.state = this.state.cancel();
	}
}
