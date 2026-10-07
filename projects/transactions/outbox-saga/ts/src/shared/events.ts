// EN: The events the two services exchange. An event is a fact in the past tense ("an order was
//     created"), not a command. Every event carries a unique `id`: that id is what lets a
//     consumer recognise a message it has already processed.
// PT: Os eventos que os dois serviços trocam. Um evento é um fato no passado ("um pedido foi
//     criado"), não um comando. Todo evento carrega um `id` único: é esse id que deixa um
//     consumidor reconhecer uma mensagem que já processou.

import { z } from "zod";

export const EVENT_TYPES = ["OrderCreated", "PaymentCompleted", "PaymentFailed"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// EN: A message from the broker is external input like any HTTP body, so it has a schema.
// PT: Uma mensagem do broker é entrada externa como qualquer corpo HTTP, então tem um schema.
export const eventSchema = z.object({
	id: z.uuid(),
	type: z.enum(EVENT_TYPES),
	orderId: z.uuid(),
	amountCents: z.number().int().min(1),
	reason: z.string().max(200).optional(),
	occurredAt: z.iso.datetime(),
});

export type DomainEvent = z.infer<typeof eventSchema>;

export const ROUTING_KEYS: Record<EventType, string> = {
	OrderCreated: "order.created",
	PaymentCompleted: "payment.completed",
	PaymentFailed: "payment.failed",
};

export function newEvent(type: EventType, orderId: string, amountCents: number, reason?: string): DomainEvent {
	return {
		id: crypto.randomUUID(),
		type,
		orderId,
		amountCents,
		...(reason === undefined ? {} : { reason }),
		occurredAt: new Date().toISOString(),
	};
}
