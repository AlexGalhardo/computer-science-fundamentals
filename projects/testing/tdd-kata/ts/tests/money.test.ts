import { expect, test } from "bun:test";
import { Dollar } from "../src/money";

test("$5 times 2 is $10", () => {
	const five = new Dollar(5);
	const product = five.times(2);
	expect(product.amount).toBe(10);
});
