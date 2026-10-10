// EN: OBSERVER. The subject keeps a list of listeners and tells all of them when something
//     happens, without knowing who they are. A new reaction is one more subscription.
// PT: OBSERVER. O sujeito mantém uma lista de ouvintes e avisa todos quando algo acontece, sem
//     saber quem são. Uma reação nova é mais uma inscrição.
// ES: OBSERVER. El sujeto mantiene una lista de oyentes y avisa a todos cuando algo ocurre, sin
//     saber quiénes son. Una reacción nueva es una suscripción más.
export type Listener<E> = (event: E) => void;

export class EventBus<E> {
	private listeners: Listener<E>[] = [];

	// EN: Subscribing returns the function that cancels it. A listener that lives less than
	//     the bus must call it, or the bus keeps it reachable forever (lapsed listener leak).
	// PT: Inscrever devolve a função que cancela a inscrição. Um ouvinte que vive menos que o
	//     barramento precisa chamá-la, ou o barramento o mantém alcançável para sempre
	//     (vazamento do ouvinte esquecido).
	// ES: Suscribirse devuelve la función que cancela la suscripción. Un oyente que vive menos
	//     que el bus necesita llamarla, o el bus lo mantiene alcanzable para siempre (fuga del
	//     oyente olvidado).
	subscribe(listener: Listener<E>): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter((item) => item !== listener);
		};
	}

	// EN: Two protections. The loop walks a snapshot, so whoever was subscribed when the event
	//     happened receives it, even if listeners subscribe or cancel during delivery. And each
	//     listener is isolated: one that throws does not stop the others, and the errors are
	//     returned to the publisher instead of being lost.
	// PT: Duas proteções. O laço percorre uma fotografia da lista, então recebe o evento quem
	//     estava inscrito quando ele ocorreu, mesmo que ouvintes se inscrevam ou cancelem
	//     durante a entrega. E cada ouvinte fica isolado: um que lança exceção não interrompe
	//     os outros, e os erros voltam para quem publicou em vez de se perderem.
	// ES: Dos protecciones. El bucle recorre una fotografía de la lista, así que recibe el evento
	//     quien estaba suscrito cuando ocurrió, aunque haya oyentes que se suscriban o cancelen
	//     durante la entrega. Y cada oyente queda aislado: uno que lanza una excepción no
	//     interrumpe a los otros, y los errores vuelven a quien publicó en lugar de perderse.
	publish(event: E): Error[] {
		const errors: Error[] = [];
		for (const listener of [...this.listeners]) {
			try {
				listener(event);
			} catch (error) {
				errors.push(error instanceof Error ? error : new Error(String(error)));
			}
		}
		return errors;
	}

	get size(): number {
		return this.listeners.length;
	}
}

export interface OrderPaid {
	orderId: string;
	email: string;
}

// EN: The order only announces what happened. It has no idea which reactions exist.
// PT: O pedido só anuncia o que aconteceu. Ele não sabe quais reações existem.
// ES: El pedido solo anuncia lo que ocurrió. No sabe qué reacciones existen.
export class Order {
	private paid = false;

	constructor(
		readonly id: string,
		readonly email: string,
		private readonly events: EventBus<OrderPaid>,
	) {}

	isPaid(): boolean {
		return this.paid;
	}

	pay(): Error[] {
		if (this.paid) {
			throw new Error(`order ${this.id} is already paid`);
		}
		this.paid = true;
		return this.events.publish({ orderId: this.id, email: this.email });
	}
}
