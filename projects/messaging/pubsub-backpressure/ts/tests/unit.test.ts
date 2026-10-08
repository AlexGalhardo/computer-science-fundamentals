// EN: Tests that need no broker: the bounded queue and the acceptance criterion about memory.
//     A producer faster than its consumer makes memory grow without bound when nothing pushes
//     back, and keeps it flat when the queue is bounded.
// PT: Testes que não precisam de broker: a fila limitada e o critério de aceitação sobre
//     memória. Um produtor mais rápido que o consumidor faz a memória crescer sem limite quando
//     nada o segura, e a mantém estável quando a fila é limitada.

import { describe, expect, test } from "bun:test";
import { BoundedQueue, DEFAULT_PRESSURE, runPressure } from "../src/backpressure";
import { renderReport } from "../src/demo";
import { loadConfig } from "../src/rabbit";

describe("bounded queue", () => {
	test("push waits while the queue is full and resumes when an item leaves", async () => {
		const queue = new BoundedQueue<number>(2);
		await queue.push(1);
		await queue.push(2);
		let third = "waiting";
		const pending = queue.push(3).then(() => {
			third = "accepted";
		});
		await Bun.sleep(20);
		expect(third).toBe("waiting");
		expect(queue.size).toBe(2);

		expect(await queue.shift()).toBe(1);
		await pending;
		expect(third).toBe("accepted");
		expect(queue.size).toBe(2);
	});

	test("items leave in the order they entered", async () => {
		const queue = new BoundedQueue<string>(10);
		for (const item of ["a", "b", "c"]) {
			await queue.push(item);
		}
		expect([await queue.shift(), await queue.shift(), await queue.shift()]).toEqual(["a", "b", "c"]);
	});

	test("shift waits for an item", async () => {
		const queue = new BoundedQueue<string>(1);
		const next = queue.shift();
		await queue.push("late");
		expect(await next).toBe("late");
	});

	test("a capacity below 1 is refused", () => {
		expect(() => new BoundedQueue<number>(0)).toThrow(RangeError);
	});
});

describe("producer faster than consumer", () => {
	// EN: The bounded run comes first on purpose. Both runs share one process, and resident
	//     memory measured after the unbounded run would only show that run's buffer being freed.
	// PT: A execução limitada vem primeiro de propósito. As duas dividem um processo, e a memória
	//     residente medida depois da execução ilimitada só mostraria o buffer dela sendo liberado.
	test("with backpressure, memory stays flat", async () => {
		const capacity = 100;
		const result = await runPressure({ ...DEFAULT_PRESSURE, capacity });
		console.log(
			`bounded: produced ${result.produced}, consumed ${result.consumed}, peak waiting ${result.peakBuffered}, RSS change ${result.rssGrowthMb.toFixed(1)} MiB`,
		);
		// The buffer never passes its capacity: at most 100 x 4 KiB, under half a MiB.
		expect(result.peakBuffered).toBeLessThanOrEqual(capacity);
		expect(Math.max(...result.samples.map((sample) => sample.bufferedMb))).toBeLessThan(0.5);
		// The producer was slowed down to the pace of the consumer.
		expect(result.produced - result.consumed).toBeLessThanOrEqual(capacity + 1);
		expect(result.consumed).toBeGreaterThan(100);
		expect(result.rssGrowthMb).toBeLessThan(10);
	}, 30_000);

	test("without backpressure, memory grows without bound", async () => {
		const result = await runPressure({ ...DEFAULT_PRESSURE, capacity: Number.POSITIVE_INFINITY });
		const { samples } = result;
		console.log(
			`unbounded: produced ${result.produced}, consumed ${result.consumed}, peak waiting ${result.peakBuffered}, RSS change ${result.rssGrowthMb.toFixed(1)} MiB`,
		);
		// The producer was never slowed down: it produced several times what was consumed.
		expect(result.produced).toBeGreaterThan(result.consumed * 3);
		// The buffer never stops growing: every quarter of the run ends higher than the one before.
		const quarter = Math.floor((samples.length - 1) / 4);
		const marks = [1, 2, 3, 4].map(
			(index) => samples[Math.min(index * quarter, samples.length - 1)]?.bufferedMb ?? 0,
		);
		expect(marks[0]).toBeGreaterThan(0);
		expect(marks[1]).toBeGreaterThan(marks[0] ?? 0);
		expect(marks[2]).toBeGreaterThan(marks[1] ?? 0);
		expect(marks[3]).toBeGreaterThan(marks[2] ?? 0);
		// And it is real memory: tens of MiB of payloads, visible in the resident memory.
		expect(marks[3]).toBeGreaterThan(20);
		expect(result.rssGrowthMb).toBeGreaterThan(15);
	}, 30_000);
});

describe("configuration and report", () => {
	test("the default broker is the docker-compose service", () => {
		expect(new URL(loadConfig({}).AMQP_URL).hostname).toBe("broker");
		expect(() => loadConfig({ AMQP_URL: "not a url" })).toThrow();
	});

	test("the report shows one row per topology and per buffer", () => {
		const delivery = (perConsumer: string[][]) => ({
			messages: 2,
			perConsumer,
			totalDeliveries: perConsumer.flat().length,
		});
		const text = renderReport({
			work: delivery([["a"], ["b"]]),
			fan: delivery([
				["a", "b"],
				["a", "b"],
			]),
			combined: delivery([["a"], ["b"], ["a", "b"], []]),
			prefetch: [{ prefetch: 0, backlog: 3000, peakHeldByConsumer: 3000, leftInBroker: 0, processed: 250 }],
			pressure: [
				{
					capacity: Number.POSITIVE_INFINITY,
					produced: 30000,
					consumed: 1500,
					peakBuffered: 28500,
					rssGrowthMb: 110.2,
					samples: [{ atMs: 0, buffered: 19, bufferedMb: 0.07, rssMb: 60 }],
				},
			],
		});
		expect(text).toContain("| Work queue: one queue, competing consumers | 1 | 2 | 2 | 1, 1 | 2 |");
		expect(text).toContain("| Fan-out: one queue per subscriber | 2 | 2 | 2 | 2, 2 | 4 |");
		expect(text).toContain("| no limit | 3000 | 3000 | 0 | 250 |");
		expect(text).toContain("| unbounded queue | 30000 | 1500 | 28500 | 110.2 MiB |");
	});
});
