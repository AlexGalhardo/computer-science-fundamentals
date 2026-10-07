import { expect, test } from "bun:test";
import { renderGantt } from "../src/gantt";
import { buildReport } from "../src/report";
import { fcfs, mlfq, type Process, priority, roundRobin, simulate, sjf } from "../src/scheduler";
import { generate, Lcg } from "../src/workload";

function jobs(bursts: number[], priorities: number[] = []): Process[] {
	return bursts.map((burst, index) => ({
		id: `P${index + 1}`,
		arrival: 0,
		burst,
		priority: priorities[index] ?? 0,
	}));
}

// EN: The expected numbers below are the ones documented in docs/en/operating-systems/cpu-scheduling.md,
//     each worked out by hand there.
// PT: Os números esperados abaixo são os documentados em docs/pt/operating-systems/cpu-scheduling.md,
//     cada um calculado à mão lá.

test("FCFS: bursts 24, 3, 3 wait 0, 24 and 27 (average 17)", () => {
	const schedule = simulate(jobs([24, 3, 3]), fcfs());
	expect(schedule.metrics.map((m) => m.waiting)).toEqual([0, 24, 27]);
	expect(schedule.averages.waiting).toBe(17);
	expect(schedule.averages.turnaround).toBe(27);
});

test("FCFS: bursts 6, 3, 3 give average waiting 5 and turnaround 9", () => {
	const schedule = simulate(jobs([6, 3, 3]), fcfs());
	expect(schedule.averages.waiting).toBe(5);
	expect(schedule.averages.turnaround).toBe(9);
});

test("SJF: bursts 8, 4, 2, 6 give average waiting 5 and turnaround 10", () => {
	const schedule = simulate(jobs([8, 4, 2, 6]), sjf());
	expect(schedule.slices.map((s) => s.id)).toEqual(["P3", "P2", "P4", "P1"]);
	expect(schedule.averages.waiting).toBe(5);
	expect(schedule.averages.turnaround).toBe(10);
});

test("SJF never has a higher average waiting time than FCFS when all jobs arrive together", () => {
	const random = new Lcg(7);
	for (let round = 0; round < 50; round++) {
		const set = jobs(Array.from({ length: 8 }, () => random.between(1, 30)));
		expect(simulate(set, sjf()).averages.waiting).toBeLessThanOrEqual(simulate(set, fcfs()).averages.waiting);
	}
});

test("round-robin q=4: bursts 24, 3, 3 wait 6, 4 and 7", () => {
	const schedule = simulate(jobs([24, 3, 3]), roundRobin(4));
	expect(schedule.metrics.map((m) => m.waiting)).toEqual([6, 4, 7]);
	expect(schedule.slices).toEqual([
		{ id: "P1", start: 0, end: 4 },
		{ id: "P2", start: 4, end: 7 },
		{ id: "P3", start: 7, end: 10 },
		{ id: "P1", start: 10, end: 30 },
	]);
});

test("round-robin q=2: bursts 3, 5, 2 finish at 7, 10 and 6", () => {
	const schedule = simulate(jobs([3, 5, 2]), roundRobin(2));
	expect(schedule.metrics.map((m) => m.turnaround)).toEqual([7, 10, 6]);
	expect(schedule.metrics.map((m) => m.response)).toEqual([0, 2, 4]);
});

test("priority: bursts 10, 1, 2, 1, 5 with priorities 3, 1, 4, 5, 2 give average waiting 8.2", () => {
	const schedule = simulate(jobs([10, 1, 2, 1, 5], [3, 1, 4, 5, 2]), priority());
	expect(schedule.slices.map((s) => s.id)).toEqual(["P2", "P5", "P1", "P3", "P4"]);
	expect(schedule.metrics.map((m) => m.waiting)).toEqual([6, 0, 16, 18, 1]);
	expect(schedule.averages.waiting).toBeCloseTo(8.2, 10);
});

test("multilevel feedback: a CPU-bound job of 40 quanta is dispatched 6 times (1+2+4+8+16+9)", () => {
	const schedule = simulate(jobs([40]), mlfq(1, 8));
	expect(schedule.metrics[0]?.dispatches).toBe(6);
});

test("multilevel feedback: a short job overtakes a long one that was demoted", () => {
	const set: Process[] = [
		{ id: "A", arrival: 0, burst: 8, priority: 0 },
		{ id: "B", arrival: 1, burst: 2, priority: 0 },
	];
	const schedule = simulate(set, mlfq(2, 3));
	expect(schedule.slices).toEqual([
		{ id: "A", start: 0, end: 2 },
		{ id: "B", start: 2, end: 4 },
		{ id: "A", start: 4, end: 10 },
	]);
	expect(schedule.metrics).toEqual([
		{ id: "A", waiting: 2, turnaround: 10, response: 0, dispatches: 3 },
		{ id: "B", waiting: 1, turnaround: 3, response: 1, dispatches: 1 },
	]);
});

test("the CPU idles until the next arrival", () => {
	const set: Process[] = [
		{ id: "A", arrival: 0, burst: 2, priority: 0 },
		{ id: "B", arrival: 5, burst: 1, priority: 0 },
	];
	const schedule = simulate(set, fcfs());
	expect(schedule.slices[1]).toEqual({ id: "B", start: 5, end: 6 });
	expect(schedule.metrics[1]?.waiting).toBe(0);
});

test("every policy gives each process exactly its burst, with no overlap", () => {
	const set = generate("mixed", 60, 99);
	const total = set.reduce((sum, p) => sum + p.burst, 0);
	for (const policy of [fcfs(), sjf(), roundRobin(3), priority(), mlfq(2, 3)]) {
		const schedule = simulate(set, policy);
		let busy = 0;
		let cursor = 0;
		for (const slice of schedule.slices) {
			expect(slice.start).toBeGreaterThanOrEqual(cursor);
			cursor = slice.end;
			busy += slice.end - slice.start;
		}
		expect(busy).toBe(total);
		for (const metric of schedule.metrics) {
			expect(metric.waiting).toBeGreaterThanOrEqual(0);
			expect(metric.response).toBeLessThanOrEqual(metric.waiting);
		}
	}
});

test("invalid input is rejected", () => {
	expect(() => simulate([{ id: "A", arrival: 0, burst: 0, priority: 0 }], fcfs())).toThrow();
	expect(() => simulate([...jobs([1]), ...jobs([1])], fcfs())).toThrow();
	expect(() => roundRobin(0)).toThrow();
});

test("the Gantt chart is printed with one bar per slice and the time axis below", () => {
	const schedule = simulate(jobs([2, 1]), fcfs());
	expect(renderGantt(schedule.slices)).toBe("| P1  |P2|\n0     6  9".replace("6  9", "2  3"));
	const gap = renderGantt([
		{ id: "A", start: 0, end: 1 },
		{ id: "B", start: 2, end: 3 },
	]);
	expect(gap).toBe("|A |- |B |\n0  1  2  3");
});

test("the generator is reproducible and the report has every policy for every workload", () => {
	expect(generate("mixed", 5, 1)).toEqual(generate("mixed", 5, 1));
	const random = new Lcg(1);
	expect([random.next(), random.next(), random.next()]).toEqual([15496, 24200, 33046]);
	const report = buildReport();
	expect(report.workloads.map((w) => w.workload)).toEqual(["interactive", "cpu-bound", "mixed"]);
	for (const workload of report.workloads) {
		expect(workload.rows).toHaveLength(5);
	}
	// EN: Round-robin exists to answer quickly: its response time beats FCFS on the mixed workload.
	// PT: O round-robin existe para responder rápido: seu tempo de resposta ganha do FCFS na carga mista.
	const mixed = report.workloads[2]?.rows ?? [];
	expect(mixed[2]?.response).toBeLessThan(mixed[0]?.response ?? 0);
});
