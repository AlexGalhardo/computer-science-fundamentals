// EN: The one task every broker carries in this mini-project: an "order placed" message that
//     makes a consumer send a (simulated) confirmation e-mail. A message comes from the network,
//     so it is validated with a schema before anything trusts its fields.
// PT: A única tarefa que todo broker carrega neste mini-projeto: uma mensagem "pedido realizado"
//     que faz um consumidor enviar um e-mail de confirmação (simulado). Uma mensagem vem da rede,
//     então é validada com um schema antes de qualquer código confiar nos seus campos.

import { z } from "zod";

export const orderPlacedSchema = z.object({
	/** Stable id chosen by the producer. A redelivery carries the same id. */
	id: z.string().min(1),
	/** Position in the sequence sent by the producer, used to check ordering. */
	seq: z.number().int().min(0),
	customerId: z.string().min(1),
	email: z.email(),
	totalCents: z.number().int().min(0),
});

export type OrderPlaced = z.infer<typeof orderPlacedSchema>;

const CUSTOMERS = 4;

// EN: Orders rotate among a few customers. The customer id is the ordering key: Kafka uses it to
//     choose the partition, so the orders of one customer stay in order.
// PT: Os pedidos alternam entre poucos clientes. O id do cliente é a chave de ordenação: o Kafka
//     a usa para escolher a partição, então os pedidos de um cliente ficam em ordem.
export function makeOrders(count: number, prefix: string): OrderPlaced[] {
	return Array.from({ length: count }, (_, seq) => {
		const customer = seq % CUSTOMERS;
		return {
			id: `${prefix}-${String(seq).padStart(6, "0")}`,
			seq,
			customerId: `customer-${customer}`,
			email: `customer-${customer}@example.test`,
			totalCents: 1000 + seq,
		};
	});
}

export function encodeOrder(order: OrderPlaced): string {
	return JSON.stringify(order);
}

export function decodeOrder(raw: string): OrderPlaced {
	return orderPlacedSchema.parse(JSON.parse(raw));
}

export interface SentEmail {
	to: string;
	subject: string;
	orderId: string;
}

// EN: The e-mail is simulated: nothing leaves the process. The outbox only remembers what would
//     have been sent, which is what the tests count.
// PT: O e-mail é simulado: nada sai do processo. A caixa de saída só lembra o que teria sido
//     enviado, que é o que os testes contam.
export class FakeMailer {
	readonly sent: SentEmail[] = [];

	send(order: OrderPlaced): SentEmail {
		const email: SentEmail = {
			to: order.email,
			subject: `Order ${order.id} confirmed`,
			orderId: order.id,
		};
		this.sent.push(email);
		return email;
	}
}
