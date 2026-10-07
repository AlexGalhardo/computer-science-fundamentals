import { expect, describe as suite, test } from "bun:test";
import { CASES } from "../src/cases";
import { table } from "../src/cli";
import { contains, describe, formatIpv4, maskOf, parseIpv4, split } from "../src/subnet";

// Acceptance criterion of MP-NET-3.3: network, broadcast, range and mask are correct for a table
// of CIDR cases.
suite("table of CIDR cases", () => {
	for (const expected of CASES) {
		test(`${expected.address}/${expected.prefix}`, () => {
			expect(describe(`${expected.address}/${expected.prefix}`)).toEqual(expected);
		});
	}
});

suite("addresses and masks", () => {
	test("addresses above 127.255.255.255 stay unsigned", () => {
		expect(parseIpv4("255.255.255.255")).toBe(4294967295);
		expect(parseIpv4("192.168.0.1")).toBe(3232235521);
		expect(formatIpv4(3232235521)).toBe("192.168.0.1");
	});

	test("every prefix gives a mask with that many leading ones", () => {
		for (let prefix = 0; prefix <= 32; prefix++) {
			const bits = maskOf(prefix).toString(2).padStart(32, "0");
			expect(bits).toBe("1".repeat(prefix) + "0".repeat(32 - prefix));
		}
	});

	test("invalid input is rejected", () => {
		for (const bad of ["192.168.1", "192.168.1.256", "192.168.1.1.1", "a.b.c.d", "1.2.3.-4", ""]) {
			expect(() => parseIpv4(bad)).toThrow();
		}
		for (const bad of ["192.168.1.1", "192.168.1.1/33", "192.168.1.1/x", "192.168.1.1/24/8", "/24"]) {
			expect(() => describe(bad)).toThrow();
		}
		expect(() => maskOf(1.5)).toThrow();
	});
});

suite("membership and splitting", () => {
	test("two addresses with different third octets can share a /22", () => {
		expect(contains("10.20.37.130/22", "10.20.38.5")).toBe(true);
		expect(contains("10.20.37.130/22", "10.20.40.1")).toBe(false);
		expect(contains("0.0.0.0/0", "203.0.113.9")).toBe(true);
	});

	test("a /24 splits into four /26", () => {
		expect(split("192.168.10.0/24", 26)).toEqual([
			"192.168.10.0/26",
			"192.168.10.64/26",
			"192.168.10.128/26",
			"192.168.10.192/26",
		]);
		expect(split("192.168.10.77/26", 26)).toEqual(["192.168.10.64/26"]);
		expect(() => split("192.168.10.0/24", 16)).toThrow();
		expect(() => split("10.0.0.0/8", 24)).toThrow();
	});
});

test("the table has one row per subnet", () => {
	const rows = table(CASES).split("\n");
	expect(rows).toHaveLength(CASES.length + 2);
	expect(rows[2]).toBe(
		"| 192.168.10.77/26 | 255.255.255.192 | 192.168.10.64 | 192.168.10.127 | 192.168.10.65 | 192.168.10.126 | 62 |",
	);
});
