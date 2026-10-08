import { expect, test } from "bun:test";
import { Dollar } from "../src/money";

test("$5 times 2 is $10", () => {
	const five = new Dollar(5);
	const product = five.times(2);
	expect(product.amount).toBe(10);
});

test("$5 times 3 is $15", () => {
	const five = new Dollar(5);
	expect(five.times(3).amount).toBe(15);
});
