import { describe, expect, test } from "bun:test";
import {
	cpuProfileSchema,
	cpuProfileToFolded,
	formatFolded,
	parseFolded,
	samplesWith,
	shareUnder,
	totalSamples,
} from "../src/folded";

describe("folded stacks", () => {
	test("parses lines, adds repeated stacks and ignores blank lines", () => {
		const stacks = parseFolded("main;a;b 3\n\nmain;a 2\nmain;a;b 4\n");
		expect(stacks.get("main;a;b")).toBe(7);
		expect(stacks.get("main;a")).toBe(2);
		expect(totalSamples(stacks)).toBe(9);
	});

	test("takes the count after the last space, so a frame name may contain spaces", () => {
		const stacks = parseFolded("main;get value [as getter] 5\n");
		expect(stacks.get("main;get value [as getter]")).toBe(5);
	});

	test("rejects a line with no count", () => {
		expect(() => parseFolded("main;a;b\n")).toThrow(/line 1/);
		expect(() => parseFolded("main;a 1.5\n")).toThrow(/line 1/);
	});

	test("formats sorted, and parsing the result gives the same stacks", () => {
		const text = formatFolded(
			new Map([
				["b;c", 2],
				["a", 1],
			]),
		);
		expect(text).toBe("a 1\nb;c 2\n");
		expect(formatFolded(parseFolded(text))).toBe(text);
	});

	test("samplesWith counts a frame and everything it called", () => {
		const stacks = parseFolded("serve;handler;hot;leaf 6\nserve;handler;hot 2\nserve;handler;cold 2\nidle 10\n");
		expect(samplesWith(stacks, "hot")).toBe(8);
		expect(samplesWith(stacks, "handler")).toBe(10);
		// A frame is matched by its whole name, never by a part of it.
		expect(samplesWith(stacks, "ho")).toBe(0);
	});

	test("shareUnder ignores samples outside the parent", () => {
		const stacks = parseFolded(
			"serve;handler;hot;leaf 6\nserve;handler;hot 2\nserve;handler;cold 2\nidle 10\nstartup;hot 30\n",
		);
		// 8 of the 10 samples under the handler; the 30 start-up samples of `hot` do not count.
		expect(shareUnder(stacks, "handler", "hot")).toBeCloseTo(0.8);
		expect(shareUnder(stacks, "missing", "hot")).toBe(0);
	});
});

describe(".cpuprofile to folded stacks", () => {
	// A call tree: (root) -> serve -> handler -> { hot (9 self), cold (1 self) }, handler has 2 self.
	const profile = {
		nodes: [
			{ id: 1, callFrame: { functionName: "(root)" }, hitCount: 0, children: [2] },
			{ id: 2, callFrame: { functionName: "serve" }, hitCount: 0, children: [3] },
			{ id: 3, callFrame: { functionName: "handler" }, hitCount: 2, children: [4, 5] },
			{ id: 4, callFrame: { functionName: "hot" }, hitCount: 9 },
			{ id: 5, callFrame: { functionName: "" }, hitCount: 1 },
		],
		startTime: 0,
		endTime: 1,
	};

	test("each node with self time becomes one stack from the root", () => {
		const stacks = cpuProfileToFolded(cpuProfileSchema.parse(profile));
		expect(formatFolded(stacks)).toBe("serve;handler 2\nserve;handler;(anonymous) 1\nserve;handler;hot 9\n");
	});

	test("self counts add up to the total, so no sample is lost or doubled", () => {
		const stacks = cpuProfileToFolded(cpuProfileSchema.parse(profile));
		expect(totalSamples(stacks)).toBe(12);
		expect(shareUnder(stacks, "handler", "hot")).toBeCloseTo(9 / 12);
	});

	test("a profile with the wrong shape is rejected", () => {
		expect(cpuProfileSchema.safeParse({ nodes: [{ id: "1" }] }).success).toBe(false);
		expect(cpuProfileSchema.safeParse({ error: "busy" }).success).toBe(false);
	});
});
