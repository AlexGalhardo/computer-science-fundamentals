import { describe, expect, test } from "bun:test";
import { EventBus, Order, type OrderPaid } from "../src/observer/after";
import { Order as CoupledOrder } from "../src/observer/before";

describe("observer: before", () => {
	// EN: The flaw: the list of reactions is part of the order. Nothing outside can add one.
	// PT: O defeito: a lista de reações faz parte do pedido. Nada de fora consegue acrescentar
	//     uma reação.
	test("the reactions are fixed inside pay", () => {
		const order = new CoupledOrder("o-1", "ana@example.test");
		order.pay();
		expect(order.effects).toEqual(["receipt sent to ana@example.test", "stock reserved for o-1"]);
	});
});

describe("observer: after", () => {
	test("a new reaction is one more subscription, and the order is not edited", () => {
		const bus = new EventBus<OrderPaid>();
		const effects: string[] = [];
		bus.subscribe((event) => effects.push(`receipt sent to ${event.email}`));
		bus.subscribe((event) => effects.push(`stock reserved for ${event.orderId}`));
		bus.subscribe((event) => effects.push(`loyalty points added for ${event.orderId}`));

		new Order("o-1", "ana@example.test", bus).pay();

		expect(effects).toEqual([
			"receipt sent to ana@example.test",
			"stock reserved for o-1",
			"loyalty points added for o-1",
		]);
	});

	test("a cancelled subscription is no longer called, nor kept by the bus", () => {
		const bus = new EventBus<string>();
		const seen: string[] = [];
		const cancel = bus.subscribe((event) => seen.push(event));
		bus.publish("first");
		cancel();
		bus.publish("second");
		expect(seen).toEqual(["first"]);
		expect(bus.size).toBe(0);
	});

	test("a listener that cancels itself during delivery does not make the next one be skipped", () => {
		const bus = new EventBus<string>();
		const seen: string[] = [];
		const cancelA = bus.subscribe(() => {
			seen.push("A");
			cancelA();
		});
		bus.subscribe(() => seen.push("B"));
		bus.subscribe(() => seen.push("C"));

		bus.publish("event");
		expect(seen).toEqual(["A", "B", "C"]);
	});

	test("a listener subscribed during delivery waits for the next event", () => {
		const bus = new EventBus<string>();
		const seen: string[] = [];
		bus.subscribe(() => {
			bus.subscribe(() => seen.push("late"));
		});
		bus.publish("first");
		expect(seen).toEqual([]);
		bus.publish("second");
		expect(seen).toEqual(["late"]);
	});

	test("a failing listener does not stop the others, and its error is reported", () => {
		const bus = new EventBus<OrderPaid>();
		const effects: string[] = [];
		bus.subscribe(() => {
			throw new Error("mail server down");
		});
		bus.subscribe((event) => effects.push(`stock reserved for ${event.orderId}`));

		const order = new Order("o-2", "bia@example.test", bus);
		const errors = order.pay();

		expect(order.isPaid()).toBe(true);
		expect(effects).toEqual(["stock reserved for o-2"]);
		expect(errors.map((error) => error.message)).toEqual(["mail server down"]);
	});
});
