import { type Cart, type CheckoutApp, type Receipt, SmtpMailer, SqlOrderTable } from "./infrastructure";

// EN: VIOLATES THE DEPENDENCY INVERSION PRINCIPLE. The business rule (high level) creates and
//     calls the SMTP client and the SQL table (low level) by name. The rule cannot run without
//     them, cannot be tested with anything else, and changes whenever one of them is replaced.
// PT: QUEBRA O PRINCÍPIO DA INVERSÃO DE DEPENDÊNCIA. A regra de negócio (alto nível) cria e
//     chama o cliente SMTP e a tabela SQL (baixo nível) pelo nome. A regra não roda sem eles,
//     não pode ser testada com outra coisa, e muda sempre que um deles é substituído.
// ES: ROMPE EL PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS. La regla de negocio (alto nivel) crea y
//     llama al cliente SMTP y a la tabla SQL (bajo nivel) por su nombre. La regla no funciona
//     sin ellos, no se puede probar con otra cosa, y cambia cada vez que se sustituye uno.
class CheckoutService {
	readonly mailer = new SmtpMailer();
	readonly table = new SqlOrderTable();
	private next = 1;

	checkout(cart: Cart): Receipt {
		if (cart.items.length === 0) {
			throw new Error("the cart is empty");
		}
		const totalCents = cart.items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
		const orderId = `o-${this.next++}`;
		this.table.insert(orderId, totalCents);
		this.mailer.sendMail(cart.email, `Order ${orderId} confirmed`);
		return { orderId, totalCents };
	}
}

export function createCheckout(): CheckoutApp {
	const service = new CheckoutService();
	return {
		checkout: (cart) => service.checkout(cart),
		sent: () => service.mailer.outbox,
		stored: () => service.table.statements,
	};
}
