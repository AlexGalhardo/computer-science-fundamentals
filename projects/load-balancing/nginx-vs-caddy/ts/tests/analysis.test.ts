import { expect, test } from "bun:test";
import {
	countByInstance,
	expectedFromServiceTimes,
	expectedFromWeights,
	shares,
	spread,
	stickyClients,
	summariseFailure,
	withinTolerance,
} from "../src/lab/analysis";
import { clientAddress, PLANS } from "../src/lab/experiments";
import type { Sample } from "../src/lab/load";

const sample = (startMs: number, status: number, instance: string | null, latencyMs = 5): Sample => ({
	index: 0,
	startMs,
	latencyMs,
	status,
	instance,
});

test("counts and shares per instance", () => {
	const samples = [sample(0, 200, "a"), sample(1, 200, "b"), sample(2, 200, "a"), sample(3, 0, null)];
	expect(countByInstance(samples, ["a", "b", "c"])).toEqual([2, 1, 0]);
	expect(shares([2, 1, 1])).toEqual([0.5, 0.25, 0.25]);
	expect(shares([0, 0])).toEqual([0, 0]);
});

test("weights 3, 2, 1 promise one half, one third and one sixth", () => {
	const expected = expectedFromWeights([3, 2, 1]);
	expect(expected[0]).toBeCloseTo(1 / 2);
	expect(expected[1]).toBeCloseTo(1 / 3);
	expect(expected[2]).toBeCloseTo(1 / 6);
});

// EN: The worked example of the README: 10, 10 and 40 ms give 4 : 4 : 1.
// PT: O exemplo resolvido do README: 10, 10 e 40 ms dão 4 : 4 : 1.
// ES: El ejemplo resuelto del README: 10, 10 y 40 ms dan 4 : 4 : 1.
test("least connections shares follow the inverse of the service time", () => {
	const expected = expectedFromServiceTimes([10, 10, 40]);
	expect(expected[0]).toBeCloseTo(4 / 9);
	expect(expected[1]).toBeCloseTo(4 / 9);
	expect(expected[2]).toBeCloseTo(1 / 9);
	expect(PLANS["least-connections"].expected[2]).toBeCloseTo(1 / 9);
});

test("the tolerance is measured in percentage points on the worst instance", () => {
	const expected = [1 / 3, 1 / 3, 1 / 3];
	expect(withinTolerance([0.34, 0.33, 0.33], expected).ok).toBe(true);
	expect(withinTolerance([0.38, 0.31, 0.31], expected).ok).toBe(true);
	const outside = withinTolerance([0.4, 0.3, 0.3], expected);
	expect(outside.ok).toBe(false);
	expect(outside.worst).toBeCloseTo(0.4 - 1 / 3);
});

test("a client is sticky only when every request reached one instance", () => {
	const result = stickyClients([
		{ client: "1", instance: "a" },
		{ client: "1", instance: "a" },
		{ client: "2", instance: "a" },
		{ client: "2", instance: "b" },
		{ client: "3", instance: null },
	]);
	expect(result).toEqual({ clients: 3, sticky: 1 });
});

test("simulated clients live in different /24 networks of the benchmark range", () => {
	expect(clientAddress(0)).toBe("198.18.0.10");
	expect(clientAddress(255)).toBe("198.18.255.10");
	expect(clientAddress(256)).toBe("198.19.0.10");
	const networks = new Set(Array.from({ length: 500 }, (_, client) => clientAddress(client).replace(/\.\d+$/, "")));
	expect(networks.size).toBe(500);
});

const window = { outageStartMs: 2000, outageEndMs: 6000, victim: "c", slowMs: 250 };

test("a failure that no client noticed has zero errors and zero recovery time", () => {
	const samples = [sample(1000, 200, "c"), sample(2500, 200, "a"), sample(5000, 200, "b"), sample(9000, 200, "c")];
	expect(summariseFailure(samples, window)).toEqual({
		requests: 4,
		errors: 0,
		slow: 0,
		recoveryMs: 0,
		backInRotationMs: 3000,
	});
});

test("recovery is measured up to the last lost or slow request", () => {
	const samples = [
		sample(1000, 200, "c"),
		sample(2100, 502, null),
		sample(2400, 0, null, 3000),
		sample(3200, 200, "a", 1005),
		sample(4000, 200, "a"),
		sample(7000, 200, "b"),
	];
	const summary = summariseFailure(samples, window);
	expect(summary.errors).toBe(2);
	expect(summary.slow).toBe(1);
	expect(summary.recoveryMs).toBe(1200);
	expect(summary.backInRotationMs).toBeNull();
});

test("median, smallest and largest value of several runs", () => {
	expect(spread([5, 1, 3])).toEqual({ median: 3, min: 1, max: 5 });
	expect(spread([4, 2])).toEqual({ median: 3, min: 2, max: 4 });
	expect(() => spread([])).toThrow();
});
