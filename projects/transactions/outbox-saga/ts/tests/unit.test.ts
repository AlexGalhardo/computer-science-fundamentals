import { expect, test } from "bun:test";
import { createOrderBody } from "../src/orders";
import { decide, LIMIT_CENTS } from "../src/payments";
import { renderOutcomes } from "../src/scenarios";
import { eventSchema, newEvent, ROUTING_KEYS } from "../src/shared/events";

test("the fake card limit decides between COMPLETED and FAILED", () => {
	expect(decide(LIMIT_CENTS)).toEqual({ status: "COMPLETED", reason: null });
	expect(decide(LIMIT_CENTS + 1).status).toBe("FAILED");
});

test("a new event is valid, unique and routed by its type", () => {
	const first = newEvent("OrderCreated", crypto.randomUUID(), 100);
	const second = newEvent("OrderCreated", first.orderId, 100);
	expect(eventSchema.safeParse(first).success).toBe(true);
	expect(first.id).not.toBe(second.id);
	expect(ROUTING_KEYS[first.type]).toBe("order.created");
	expect("reason" in first).toBe(false);
});

test("a malformed event is rejected by the schema", () => {
	expect(eventSchema.safeParse({ id: "not-a-uuid", type: "OrderCreated" }).success).toBe(false);
	expect(
		eventSchema.safeParse({ ...newEvent("OrderCreated", crypto.randomUUID(), 100), type: "Refunded" }).success,
	).toBe(false);
});

test("the order body defaults to the outbox mode without a crash", () => {
	const body = createOrderBody.parse({ orderId: crypto.randomUUID(), customerId: "fake", amountCents: 1 });
	expect(body.mode).toBe("outbox");
	expect(body.crashAfterCommit).toBe(false);
	expect(createOrderBody.safeParse({ orderId: "x", customerId: "fake", amountCents: 1 }).success).toBe(false);
});

test("the results table marks a lost event", () => {
	const text = renderOutcomes([
		{ scenario: "crash", mode: "dual-write", answered: false, order: null, payment: null },
	]);
	expect(text).toContain("| crash | `dual-write` | no (connection lost) | missing | none | **no, lost** |");
});
