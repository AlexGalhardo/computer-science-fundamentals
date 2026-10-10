import { type Cart, type CheckoutApp, type Receipt, SmtpMailer, SqlOrderTable } from "./infrastructure";

// EN: DEPENDENCY INVERSION. The business rule declares what it needs, in its own words: a place
//     to save orders and a way to tell the customer. These interfaces belong to the rule. The
//     details adapt to them, so the source dependency now points from the details to the rule.
// PT: INVERSÃO DE DEPENDÊNCIA. A regra de negócio declara do que precisa, com suas próprias
//     palavras: um lugar para guardar pedidos e um jeito de avisar o cliente. Essas interfaces
//     pertencem à regra. Os detalhes se adaptam a elas, então a dependência do código-fonte
//     passa a apontar dos detalhes para a regra.
// ES: INVERSIÓN DE DEPENDENCIAS. La regla de negocio declara lo que necesita, con sus propias
//     palabras: un lugar para guardar pedidos y una forma de avisar al cliente. Esas interfaces
//     pertenecen a la regla. Los detalles se adaptan a ellas, así que la dependencia del código
//     fuente pasa a apuntar de los detalles hacia la regla.
export interface OrderStore {
	save(orderId: string, totalCents: number): void;
}

export interface CustomerNotifier {
	orderConfirmed(email: string, orderId: string): void;
}

export class CheckoutService {
	private next = 1;

	constructor(
		private readonly orders: OrderStore,
		private readonly notifier: CustomerNotifier,
	) {}

	checkout(cart: Cart): Receipt {
		if (cart.items.length === 0) {
			throw new Error("the cart is empty");
		}
		const totalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
		const orderId = `o-${this.next++}`;
		this.orders.save(orderId, totalCents);
		this.notifier.orderConfirmed(cart.email, orderId);
		return { orderId, totalCents };
	}
}

// EN: The composition root: the only place that names the concrete details and fits them to
//     the interfaces of the rule. Replacing SMTP or SQL is a change here and nowhere else.
// PT: A raiz de composição: o único lugar que cita os detalhes concretos e os encaixa nas
//     interfaces da regra. Trocar o SMTP ou o SQL é uma mudança aqui e em nenhum outro lugar.
// ES: La composition root: el único lugar que cita los detalles concretos y los encaja en las
//     interfaces de la regla. Cambiar SMTP o SQL es un cambio aquí y en ningún otro lugar.
export function createCheckout(): CheckoutApp {
	const mailer = new SmtpMailer();
	const table = new SqlOrderTable();
	const service = new CheckoutService(
		{ save: (orderId, totalCents) => table.insert(orderId, totalCents) },
		{ orderConfirmed: (email, orderId) => mailer.sendMail(email, `Order ${orderId} confirmed`) },
	);
	return {
		checkout: (cart) => service.checkout(cart),
		sent: () => mailer.outbox,
		stored: () => table.statements,
	};
}
