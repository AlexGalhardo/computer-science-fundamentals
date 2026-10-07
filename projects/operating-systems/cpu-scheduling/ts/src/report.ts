import { renderGantt } from "./gantt";
import {
	type Averages,
	fcfs,
	mlfq,
	type Policy,
	type Process,
	priority,
	roundRobin,
	type Schedule,
	simulate,
	sjf,
} from "./scheduler";
import { generate, WORKLOADS, type WorkloadKind } from "./workload";

export const SEED = 2026;
export const WORKLOAD_SIZE = 200;

// EN: A small example that can be followed by hand. B and E are short, C is long, and the
//     priorities do not follow the arrival order, so every policy draws a different chart.
// PT: Um exemplo pequeno, que dá para acompanhar à mão. B e E são curtos, C é longo, e as
//     prioridades não seguem a ordem de chegada, então cada política desenha um gráfico diferente.
export const EXAMPLE: Process[] = [
	{ id: "A", arrival: 0, burst: 8, priority: 3 },
	{ id: "B", arrival: 1, burst: 4, priority: 1 },
	{ id: "C", arrival: 2, burst: 9, priority: 4 },
	{ id: "D", arrival: 3, burst: 5, priority: 2 },
	{ id: "E", arrival: 6, burst: 2, priority: 5 },
];

// EN: Policies are created fresh for every run because a policy object may keep state.
// PT: As políticas são criadas de novo a cada execução porque um objeto de política pode guardar estado.
export function policies(): Policy[] {
	return [fcfs(), sjf(), roundRobin(4), priority(), mlfq(2, 3)];
}

export interface WorkloadResult {
	workload: WorkloadKind;
	processes: number;
	rows: Array<{ policy: string } & Averages>;
}

export interface Report {
	project: string;
	seed: number;
	command: string;
	example: { processes: Process[]; schedules: Schedule[] };
	workloads: WorkloadResult[];
}

export function buildReport(): Report {
	return {
		project: "cpu-scheduling",
		seed: SEED,
		command: "docker compose run --rm demo",
		example: { processes: EXAMPLE, schedules: policies().map((policy) => simulate(EXAMPLE, policy)) },
		workloads: WORKLOADS.map((workload) => {
			const processes = generate(workload, WORKLOAD_SIZE, SEED);
			return {
				workload,
				processes: processes.length,
				rows: policies().map((policy) => {
					const schedule = simulate(processes, policy);
					return { policy: schedule.policy, ...schedule.averages };
				}),
			};
		}),
	};
}

function fixed(value: number): string {
	return value.toFixed(2);
}

export function ganttText(report: Report): string {
	const lines: string[] = ["Example: A(0,8) B(1,4) C(2,9) D(3,5) E(6,2), written as id(arrival,burst)", ""];
	for (const schedule of report.example.schedules) {
		const { waiting, turnaround, response } = schedule.averages;
		lines.push(
			schedule.policy,
			renderGantt(schedule.slices),
			`average waiting ${fixed(waiting)}, turnaround ${fixed(turnaround)}, response ${fixed(response)}`,
			"",
		);
	}
	return lines.join("\n");
}

export function compareText(report: Report): string {
	const lines: string[] = [];
	for (const result of report.workloads) {
		lines.push(`Workload: ${result.workload} (${result.processes} processes, seed ${report.seed})`);
		lines.push(
			`${"policy".padEnd(22)}${"waiting".padStart(10)}${"turnaround".padStart(12)}${"response".padStart(10)}${"max wait".padStart(10)}`,
		);
		for (const row of result.rows) {
			lines.push(
				`${row.policy.padEnd(22)}${fixed(row.waiting).padStart(10)}${fixed(row.turnaround).padStart(12)}${fixed(row.response).padStart(10)}${String(row.maxWaiting).padStart(10)}`,
			);
		}
		lines.push("");
	}
	return lines.join("\n");
}

export function markdown(report: Report): string {
	const lines: string[] = [
		"# cpu-scheduling: results",
		"",
		`Command: \`${report.command}\``,
		"",
		`The simulation is deterministic: abstract time units, workloads from a linear congruential generator with seed ${report.seed}. The numbers do not depend on the machine, and the Python implementation prints the same values.`,
		"",
		"## Example schedule",
		"",
		"Processes as id(arrival, burst, priority): " +
			report.example.processes.map((p) => `${p.id}(${p.arrival}, ${p.burst}, ${p.priority})`).join(" "),
		"",
	];
	for (const schedule of report.example.schedules) {
		lines.push(`### ${schedule.policy}`, "", "```", renderGantt(schedule.slices), "```", "");
	}
	lines.push(
		"| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |",
		"| --- | ---: | ---: | ---: | ---: |",
	);
	for (const schedule of report.example.schedules) {
		const a = schedule.averages;
		lines.push(
			`| ${schedule.policy} | ${fixed(a.waiting)} | ${fixed(a.turnaround)} | ${fixed(a.response)} | ${a.maxWaiting} |`,
		);
	}
	lines.push("");
	for (const result of report.workloads) {
		lines.push(
			`## Workload: ${result.workload} (${result.processes} processes)`,
			"",
			"| Policy | Avg waiting | Avg turnaround | Avg response | Max waiting |",
			"| --- | ---: | ---: | ---: | ---: |",
		);
		for (const row of result.rows) {
			lines.push(
				`| ${row.policy} | ${fixed(row.waiting)} | ${fixed(row.turnaround)} | ${fixed(row.response)} | ${row.maxWaiting} |`,
			);
		}
		lines.push("");
	}
	return lines.join("\n");
}
