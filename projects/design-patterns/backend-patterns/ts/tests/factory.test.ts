import { describe, expect, test } from "bun:test";
import { CHANNELS, createNotifier, isChannel, orderShipped, welcome } from "../src/factory/after";
import * as before from "../src/factory/before";

describe("factory: before", () => {
	test("both functions work for the channels they both remember", () => {
		expect(before.welcome("email", "ana")).toBe("email to ana: Welcome!");
		expect(before.orderShipped("sms", "ana")).toBe("sms to ana: Your order was shipped");
	});

	// EN: The flaw: the creation decision is duplicated, and one copy is out of date.
	// PT: O defeito: a decisão de criação está duplicada, e uma das cópias está desatualizada.
	// ES: El defecto: la decisión de creación está duplicada, y una de las copias está desactualizada.
	test("a forgotten copy of the decision fails for a channel the other copy supports", () => {
		expect(before.welcome("push", "ana")).toBe("push to ana: Welcome!");
		expect(() => before.orderShipped("push", "ana")).toThrow("unknown channel: push");
	});
});

describe("factory: after", () => {
	test("every client supports every channel, because the decision lives in one place", () => {
		for (const channel of CHANNELS) {
			expect(welcome(channel, "ana")).toBe(`${channel} to ana: Welcome!`);
			expect(orderShipped(channel, "ana")).toBe(`${channel} to ana: Your order was shipped`);
		}
	});

	test("the client receives the abstract type and only calls notify", () => {
		expect(createNotifier("sms").notify("bia", "hi")).toBe("sms to bia: hi");
	});

	test("text from outside is checked once, at the border", () => {
		expect(isChannel("push")).toBe(true);
		expect(isChannel("fax")).toBe(false);
	});
});
