import { describe, expect, test } from "bun:test";
import { main } from "../src/cli";

describe("command line", () => {
	test("a full order exits with 0", () => {
		const result = main(["pay", "ship", "deliver"]);
		expect(result.exitCode).toBe(0);
		expect(result.output).toContain("ship     paid -> shipped");
		expect(result.output).toContain("end: delivered");
	});

	test("a rejected event exits with 1 and says where the order stays", () => {
		const result = main(["pay", "deliver"]);
		expect(result.exitCode).toBe(1);
		expect(result.output).toContain("deliver  REJECTED: not allowed in paid, the order stays in paid");
		expect(result.output).toContain("end: paid");
	});

	test("a terminal state is marked", () => {
		expect(main(["cancel"]).output).toContain("end: cancelled (terminal)");
	});

	test("an unknown event is bad usage, not a transition", () => {
		const result = main(["pay", "teleport"]);
		expect(result.exitCode).toBe(2);
		expect(result.output).toContain("usage:");
	});

	test("the final state is described in English, Portuguese and Spanish", () => {
		const output = main(["pay", "ship", "deliver"]).output;
		expect(output).toContain("EN: delivered to the customer");
		expect(output).toContain("PT: entregue ao cliente");
		expect(output).toContain("ES: entregado al cliente");
	});

	test("the demo shows a full order and a rejected transition", () => {
		const result = main(["demo"]);
		expect(result.exitCode).toBe(0);
		expect(result.output).toContain("A full order");
		expect(result.output).toContain("REJECTED");
	});
});
