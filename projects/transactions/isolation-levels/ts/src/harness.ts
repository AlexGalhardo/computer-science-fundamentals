// EN: A two-session test harness. A race between two transactions is normally a matter of luck:
//     run it a thousand times and the anomaly shows up twice. Here nothing is left to luck. The
//     scenario is a list of steps, each one names the session that runs it, and the harness runs
//     them strictly one after the other, so every run interleaves the two transactions the same way.
// PT: Um harness de teste com duas sessões. Uma corrida entre duas transações normalmente depende
//     de sorte: rode mil vezes e a anomalia aparece duas. Aqui nada fica por conta da sorte. O
//     cenário é uma lista de passos, cada um diz qual sessão o executa, e o harness os roda
//     estritamente um depois do outro, então toda execução intercala as transações do mesmo jeito.

import { Client } from "pg";

export type SessionName = "A" | "B" | "observer";

export interface StepOutcome {
	rows: Record<string, unknown>[];
	/** Present when PostgreSQL rejected the statement, for example SQLSTATE 40001. */
	error?: { code: string; message: string };
}

export type Outcomes = Record<string, StepOutcome>;

export interface Step {
	session: SessionName;
	/** Unique name of the step inside the scenario. The outcome is stored under it. */
	label: string;
	sql: string;
	/** Values for `$1`, `$2`... A function receives the outcomes of the earlier steps. */
	params?: unknown[] | ((outcomes: Outcomes) => unknown[]);
}

export interface LogEntry {
	order: number;
	session: SessionName;
	label: string;
	sql: string;
	/** Wall-clock time the step was sent, ISO 8601. */
	wallClock: string;
	/** Milliseconds since the scenario started, from a monotonic clock. */
	startedAtMs: number;
	/** Set when the statement had to wait for a lock held by the other session. */
	blockedAtMs?: number;
	finishedAtMs: number;
	status: "ok" | "error";
	errorCode?: string;
}

export interface ScenarioRun {
	log: LogEntry[];
	outcomes: Outcomes;
}

interface Session {
	client: Client;
	pid: number;
}

export interface Lab {
	sessions: Record<SessionName, Session>;
	close: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2;

// EN: One `Client` is one TCP connection, and one connection is one PostgreSQL session with its
//     own transaction. A connection pool would hide this: two queries could silently land on
//     different sessions. The observer is a third session, outside both transactions, used to
//     prepare the data, to look at the final state and to ask the server who is waiting.
// PT: Um `Client` é uma conexão TCP, e uma conexão é uma sessão do PostgreSQL com sua própria
//     transação. Um pool de conexões esconderia isso: duas consultas poderiam cair em sessões
//     diferentes sem aviso. O observador é uma terceira sessão, fora das duas transações, usada
//     para preparar os dados, olhar o estado final e perguntar ao servidor quem está esperando.
export async function openLab(databaseUrl: string): Promise<Lab> {
	const names: SessionName[] = ["A", "B", "observer"];
	const opened: Session[] = [];
	for (const name of names) {
		const client = new Client({ connectionString: databaseUrl, application_name: `lab-${name}` });
		await client.connect();
		// EN: A safety net. If a scenario is written wrongly and waits forever, the lock wait
		//     fails after five seconds instead of hanging the test run.
		// PT: Uma rede de segurança. Se um cenário for escrito errado e esperar para sempre, a
		//     espera pelo bloqueio falha depois de cinco segundos em vez de travar os testes.
		await client.query("SET lock_timeout = '5s'");
		const result = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
		const pid = result.rows[0]?.pid;
		if (pid === undefined) {
			throw new Error("could not read the backend pid of the session");
		}
		opened.push({ client, pid });
	}
	const [a, b, observer] = opened;
	if (a === undefined || b === undefined || observer === undefined) {
		throw new Error("could not open the three sessions");
	}
	return {
		sessions: { A: a, B: b, observer },
		close: async () => {
			for (const session of opened) {
				await session.client.end();
			}
		},
	};
}

function errorCode(error: unknown): string {
	if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
		return error.code;
	}
	return "unknown";
}

// EN: A failed statement is a result, not a crash. "Could not serialize access" (40001) is
//     exactly how PostgreSQL prevents an anomaly, so the harness records the error and moves on.
// PT: Um comando que falha é um resultado, não uma quebra. "Could not serialize access" (40001)
//     é exatamente como o PostgreSQL evita uma anomalia, então o harness registra o erro e segue.
async function execute(session: Session, sql: string, params: unknown[]): Promise<StepOutcome> {
	try {
		const result = await session.client.query(sql, params);
		return { rows: (result.rows ?? []) as Record<string, unknown>[] };
	} catch (error) {
		return { rows: [], error: { code: errorCode(error), message: error instanceof Error ? error.message : "" } };
	}
}

async function isWaitingForLock(observer: Session, pid: number): Promise<boolean> {
	const result = await observer.client.query<{ wait_event_type: string | null }>(
		"SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1",
		[pid],
	);
	return result.rows[0]?.wait_event_type === "Lock";
}

// EN: How do we know a statement is blocked, and not just slow? Sleeping "long enough" is a
//     guess, and guesses make flaky tests. Instead the observer asks the server: the view
//     `pg_stat_activity` reports `wait_event_type = 'Lock'` for a session that is parked waiting
//     for a lock. The loop ends when the statement finishes or when the server confirms the wait.
// PT: Como saber que um comando está bloqueado, e não apenas lento? Dormir "o suficiente" é um
//     chute, e chutes geram testes instáveis. Em vez disso o observador pergunta ao servidor: a
//     visão `pg_stat_activity` informa `wait_event_type = 'Lock'` para uma sessão parada esperando
//     um bloqueio. O laço termina quando o comando acaba ou quando o servidor confirma a espera.
async function settleOrBlock(
	pending: Promise<unknown>,
	observer: Session,
	pid: number,
): Promise<"settled" | "blocked"> {
	let settled = false;
	void pending.then(() => {
		settled = true;
	});
	while (!settled) {
		if (await isWaitingForLock(observer, pid)) {
			return "blocked";
		}
		await Bun.sleep(POLL_INTERVAL_MS);
	}
	return "settled";
}

export async function runScenario(lab: Lab, steps: Step[]): Promise<ScenarioRun> {
	const log: LogEntry[] = [];
	const outcomes: Outcomes = {};
	const waiting = new Map<SessionName, Promise<void>>();
	const origin = performance.now();
	const now = (): number => Math.round((performance.now() - origin) * 1000) / 1000;
	const observer = lab.sessions.observer;

	// EN: After each step, a session that was blocked may have been released (the other side
	//     committed). It is allowed to finish before the next step starts, so the order of the
	//     log never depends on which of the two happens to be faster.
	// PT: Depois de cada passo, uma sessão que estava bloqueada pode ter sido liberada (o outro
	//     lado fez commit). Ela termina antes de o próximo passo começar, então a ordem do log
	//     nunca depende de qual dos dois calhou de ser mais rápido.
	async function drainReleased(): Promise<void> {
		for (const [name, pending] of waiting) {
			if (!(await isWaitingForLock(observer, lab.sessions[name].pid))) {
				await pending;
				waiting.delete(name);
			}
		}
	}

	for (const [index, step] of steps.entries()) {
		if (step.label in outcomes || log.some((entry) => entry.label === step.label)) {
			throw new Error(`duplicate step label "${step.label}"`);
		}
		const stillWaiting = waiting.get(step.session);
		if (stillWaiting !== undefined) {
			await stillWaiting;
			waiting.delete(step.session);
		}
		const session = lab.sessions[step.session];
		const params = typeof step.params === "function" ? step.params(outcomes) : (step.params ?? []);
		const entry: LogEntry = {
			order: index + 1,
			session: step.session,
			label: step.label,
			sql: step.sql,
			wallClock: new Date().toISOString(),
			startedAtMs: now(),
			finishedAtMs: 0,
			status: "ok",
		};
		log.push(entry);
		const finished = execute(session, step.sql, params).then((outcome) => {
			entry.finishedAtMs = now();
			if (outcome.error !== undefined) {
				entry.status = "error";
				entry.errorCode = outcome.error.code;
			}
			outcomes[step.label] = outcome;
		});
		if ((await settleOrBlock(finished, observer, session.pid)) === "blocked") {
			entry.blockedAtMs = now();
			waiting.set(step.session, finished);
		} else {
			await finished;
		}
		await drainReleased();
	}

	for (const pending of waiting.values()) {
		await pending;
	}
	// EN: Whatever happened, both sessions leave the scenario with no open transaction.
	// PT: Aconteça o que acontecer, as duas sessões saem do cenário sem transação aberta.
	await lab.sessions.A.client.query("ROLLBACK");
	await lab.sessions.B.client.query("ROLLBACK");
	return { log, outcomes };
}

// EN: The proof that the interleaving was the planned one: every step started after the
//     previous one had either finished or been confirmed as blocked. Returns the list of
//     violations, empty when the order held.
// PT: A prova de que a intercalação foi a planejada: todo passo começou depois de o anterior ter
//     terminado ou ter sido confirmado como bloqueado. Devolve a lista de violações, vazia
//     quando a ordem foi respeitada.
export function orderViolations(log: LogEntry[]): string[] {
	const violations: string[] = [];
	for (let index = 1; index < log.length; index += 1) {
		const previous = log[index - 1];
		const current = log[index];
		if (previous === undefined || current === undefined) {
			continue;
		}
		const previousReleasedControlAt = previous.blockedAtMs ?? previous.finishedAtMs;
		if (current.startedAtMs < previousReleasedControlAt) {
			violations.push(`step ${current.order} "${current.label}" started before step ${previous.order} was done`);
		}
	}
	return violations;
}
