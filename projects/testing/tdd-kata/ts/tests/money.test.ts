import { expect, test } from "bun:test";
import { Dollar, Franc } from "../src/money";

test("$5 times 2 is $10 and times 3 is $15", () => {
	const five = new Dollar(5);
	expect(five.times(2).equals(new Dollar(10))).toBe(true);
	expect(five.times(3).equals(new Dollar(15))).toBe(true);
});

test("dollars are equal when their amounts are equal", () => {
	expect(new Dollar(5).equals(new Dollar(5))).toBe(true);
	expect(new Dollar(5).equals(new Dollar(6))).toBe(false);
});

test("5 CHF times 2 is 10 CHF", () => {
	const five = new Franc(5);
	expect(five.times(2).equals(new Franc(10))).toBe(true);
});

test("5 CHF is not equal to $5", () => {
	expect(new Franc(5).equals(new Dollar(5))).toBe(false);
});
