import { expect, test } from "bun:test";
import { Bank } from "../src/bank";
import { Money } from "../src/money";

test("$5 times 2 is $10 and times 3 is $15", () => {
	const five = Money.dollar(5);
	expect(five.times(2).equals(Money.dollar(10))).toBe(true);
	expect(five.times(3).equals(Money.dollar(15))).toBe(true);
});

test("dollars are equal when their amounts are equal", () => {
	expect(Money.dollar(5).equals(Money.dollar(5))).toBe(true);
	expect(Money.dollar(5).equals(Money.dollar(6))).toBe(false);
});

test("5 CHF times 2 is 10 CHF", () => {
	const five = Money.franc(5);
	expect(five.times(2).equals(Money.franc(10))).toBe(true);
});

test("5 CHF is not equal to $5", () => {
	expect(Money.franc(5).equals(Money.dollar(5))).toBe(false);
});

test("$5 + $5 is $10", () => {
	const sum = Money.dollar(5).plus(Money.dollar(5));
	const bank = new Bank();
	expect(bank.reduce(sum, "USD").equals(Money.dollar(10))).toBe(true);
});
