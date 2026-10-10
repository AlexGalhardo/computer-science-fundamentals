import { afterAll, beforeAll, expect, test } from "bun:test";
import { loadConfig } from "../src/config";
import { type Lab, type LogEntry, openLab, orderViolations, runScenario, type Step } from "../src/harness";
import { prepareSchema } from "../src/matrix";

let lab: Lab;

beforeAll(async () => {
	lab = await openLab(loadConfig().DATABASE_URL);
	await prepareSchema(lab);
});

afterAll(async () => {
	await lab.close();
});

const BLOCKING: Step[] = [
	{ session: "observer", label: "reset", sql: "TRUNCATE accounts" },
	{ session: "observer", label: "seed", sql: "INSERT INTO accounts (id, balance) VALUES (1, 100)" },
	{ session: "A", label: "A begins", sql: "BEGIN" },
	{ session: "B", label: "B begins", sql: "BEGIN" },
	{ session: "A", label: "A locks the row", sql: "UPDATE accounts SET balance = 110 WHERE id = 1" },
	{ session: "B", label: "B waits for the row", sql: "UPDATE accounts SET balance = balance + 20 WHERE id = 1" },
	{ session: "A", label: "A commits", sql: "COMMIT" },
	{ session: "B", label: "B commits", sql: "COMMIT" },
	{ session: "observer", label: "final", sql: "SELECT balance FROM accounts WHERE id = 1" },
];

function entry(log: LogEntry[], label: string): LogEntry {
	const found = log.find((item) => item.label === label);
	if (found === undefined) {
		throw new Error(`no log entry "${label}"`);
	}
	return found;
}

test("steps run in the fixed order, proven by the timestamps of the log", async () => {
	const run = await runScenario(lab, BLOCKING);
	expect(run.log.map((item) => item.label)).toEqual(BLOCKING.map((step) => step.label));
	expect(run.log.map((item) => item.order)).toEqual(BLOCKING.map((_, index) => index + 1));
	expect(orderViolations(run.log)).toEqual([]);
	for (const item of run.log) {
		expect(item.finishedAtMs).toBeGreaterThanOrEqual(item.startedAtMs);
		expect(Number.isNaN(Date.parse(item.wallClock))).toBe(false);
	}
});

test("a statement waiting for a lock is detected and finishes only after the lock is released", async () => {
	const run = await runScenario(lab, BLOCKING);
	const waiter = entry(run.log, "B waits for the row");
	const release = entry(run.log, "A commits");
	const next = entry(run.log, "B commits");
	expect(waiter.blockedAtMs).toBeDefined();
	expect(waiter.blockedAtMs ?? 0).toBeLessThanOrEqual(release.startedAtMs);
	expect(waiter.finishedAtMs).toBeGreaterThanOrEqual(release.finishedAtMs);
	expect(next.startedAtMs).toBeGreaterThanOrEqual(waiter.finishedAtMs);
	// EN: `balance + 20` is computed by the database on the row as it is after A's commit.
	// PT: `balance + 20` é calculado pelo banco sobre a linha como ela ficou depois do commit de A.
	// ES: `balance + 20` lo calcula la base de datos sobre la fila como quedó después del commit de A.
	expect(run.outcomes.final?.rows[0]?.balance).toBe(130);
});

test("at READ COMMITTED a blocked UPDATE re-checks its WHERE on the new version of the row", async () => {
	const run = await runScenario(lab, [
		{ session: "observer", label: "reset", sql: "TRUNCATE accounts" },
		{ session: "observer", label: "seed", sql: "INSERT INTO accounts (id, balance) VALUES (1, 100)" },
		{ session: "A", label: "A begins", sql: "BEGIN ISOLATION LEVEL READ COMMITTED" },
		{ session: "B", label: "B begins", sql: "BEGIN ISOLATION LEVEL READ COMMITTED" },
		{ session: "A", label: "A withdraws 100", sql: "UPDATE accounts SET balance = balance - 100 WHERE id = 1" },
		{
			session: "B",
			label: "B withdraws 100 if there is balance",
			sql: "UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100 RETURNING balance",
		},
		{ session: "A", label: "A commits", sql: "COMMIT" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
		{ session: "observer", label: "final", sql: "SELECT balance FROM accounts WHERE id = 1" },
	]);
	// EN: When B started, the row had balance 100 and matched. After waiting for A, PostgreSQL
	//     evaluates the WHERE again on the committed row (balance 0), which no longer matches,
	//     so B updates nothing and the balance does not go negative.
	// PT: Quando B começou, a linha tinha saldo 100 e casava. Depois de esperar A, o PostgreSQL
	//     avalia o WHERE de novo na linha confirmada (saldo 0), que não casa mais, então B não
	//     atualiza nada e o saldo não fica negativo.
	// ES: Cuando B empezó, la fila tenía saldo 100 y coincidía. Después de esperar a A, PostgreSQL
	//     evalúa el WHERE de nuevo en la fila confirmada (saldo 0), que ya no coincide, así que B no
	//     actualiza nada y el saldo no queda negativo.
	expect(entry(run.log, "B withdraws 100 if there is balance").blockedAtMs).toBeDefined();
	expect(run.outcomes["B withdraws 100 if there is balance"]?.rows).toEqual([]);
	expect(run.outcomes.final?.rows[0]?.balance).toBe(0);
});

test("a failed statement is recorded as an outcome and does not stop the scenario", async () => {
	const run = await runScenario(lab, [
		{ session: "A", label: "bad", sql: "SELECT * FROM table_that_does_not_exist" },
		{ session: "A", label: "good", sql: "SELECT 1 AS one" },
	]);
	expect(run.outcomes.bad?.error?.code).toBe("42P01");
	expect(entry(run.log, "bad").status).toBe("error");
	expect(run.outcomes.good?.rows[0]?.one).toBe(1);
});

test("the order check reports a step that started too early", () => {
	const base = { session: "A" as const, sql: "", wallClock: "", status: "ok" as const };
	const log: LogEntry[] = [
		{ ...base, order: 1, label: "first", startedAtMs: 0, finishedAtMs: 10 },
		{ ...base, order: 2, label: "second", startedAtMs: 5, finishedAtMs: 12 },
	];
	expect(orderViolations(log)).toHaveLength(1);
});
