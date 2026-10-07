// EN: The five anomalies of the lab, each one written as a fixed interleaving of two
//     transactions, A and B. The same script runs at every isolation level. Only the level
//     changes, so any difference in the outcome is caused by the level alone.
// PT: As cinco anomalias do laboratório, cada uma escrita como uma intercalação fixa de duas
//     transações, A e B. O mesmo roteiro roda em todos os níveis de isolamento. Só o nível muda,
//     então qualquer diferença no resultado é causada apenas pelo nível.

import type { Outcomes, Step } from "./harness";

// EN: Ordered from the weakest to the strongest. PostgreSQL accepts READ UNCOMMITTED but treats
//     it as READ COMMITTED, which is why the first two columns of the matrix are always equal.
// PT: Ordenados do mais fraco para o mais forte. O PostgreSQL aceita READ UNCOMMITTED mas o trata
//     como READ COMMITTED, e por isso as duas primeiras colunas da matriz são sempre iguais.
export const LEVELS = ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"] as const;
export type Level = (typeof LEVELS)[number];

export const ANOMALY_IDS = ["dirty-read", "non-repeatable-read", "phantom", "lost-update", "write-skew"] as const;
export type AnomalyId = (typeof ANOMALY_IDS)[number];

export interface Anomaly {
	id: AnomalyId;
	name: { en: string; pt: string };
	/** Statements that put the tables in the starting state. Run by the observer session. */
	setup: string[];
	steps: (level: Level) => Step[];
	/** True when the anomaly is visible in the outcomes of the steps. */
	occurred: (outcomes: Outcomes) => boolean;
}

export const SCHEMA = [
	"CREATE TABLE IF NOT EXISTS accounts (id integer PRIMARY KEY, balance integer NOT NULL)",
	"CREATE TABLE IF NOT EXISTS doctors (name text PRIMARY KEY, on_call boolean NOT NULL)",
];

const ACCOUNTS = ["TRUNCATE accounts", "INSERT INTO accounts (id, balance) VALUES (1, 100), (2, 100)"];

function begin(session: "A" | "B", level: Level): Step {
	return { session, label: `${session} begins`, sql: `BEGIN ISOLATION LEVEL ${level}` };
}

function numberAt(outcomes: Outcomes, label: string, column: string): number | undefined {
	const value = outcomes[label]?.rows[0]?.[column];
	return typeof value === "number" ? value : undefined;
}

// EN: Dirty read: B sees a value that A wrote but has not committed. If A rolls back, B acted on
//     data that never existed. PostgreSQL never shows uncommitted data, at any level.
// PT: Leitura suja: B enxerga um valor que A escreveu mas ainda não confirmou. Se A desfizer, B
//     agiu sobre um dado que nunca existiu. O PostgreSQL nunca mostra dado não confirmado, em
//     nenhum nível.
const dirtyRead: Anomaly = {
	id: "dirty-read",
	name: { en: "Dirty read", pt: "Leitura suja" },
	setup: ACCOUNTS,
	steps: (level) => [
		begin("A", level),
		begin("B", level),
		{ session: "A", label: "A writes 999, uncommitted", sql: "UPDATE accounts SET balance = 999 WHERE id = 1" },
		{ session: "B", label: "B reads", sql: "SELECT balance FROM accounts WHERE id = 1" },
		{ session: "A", label: "A rolls back", sql: "ROLLBACK" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
	],
	occurred: (outcomes) => numberAt(outcomes, "B reads", "balance") === 999,
};

// EN: Non-repeatable read: A reads the same row twice in one transaction and gets two different
//     values, because B committed an update in between.
// PT: Leitura não repetível: A lê a mesma linha duas vezes em uma transação e recebe dois valores
//     diferentes, porque B confirmou uma atualização no meio.
const nonRepeatableRead: Anomaly = {
	id: "non-repeatable-read",
	name: { en: "Non-repeatable read", pt: "Leitura não repetível" },
	setup: ACCOUNTS,
	steps: (level) => [
		begin("A", level),
		{ session: "A", label: "A reads first", sql: "SELECT balance FROM accounts WHERE id = 1" },
		begin("B", level),
		{ session: "B", label: "B updates", sql: "UPDATE accounts SET balance = 200 WHERE id = 1" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
		{ session: "A", label: "A reads again", sql: "SELECT balance FROM accounts WHERE id = 1" },
		{ session: "A", label: "A commits", sql: "COMMIT" },
	],
	occurred: (outcomes) =>
		numberAt(outcomes, "A reads first", "balance") !== numberAt(outcomes, "A reads again", "balance"),
};

// EN: Phantom: A runs the same search twice and the second time a new row matches, inserted and
//     committed by B. No row that A had read changed. The set of rows did.
// PT: Fantasma: A roda a mesma busca duas vezes e na segunda uma linha nova passa a casar,
//     inserida e confirmada por B. Nenhuma linha que A tinha lido mudou. O conjunto de linhas mudou.
const phantom: Anomaly = {
	id: "phantom",
	name: { en: "Phantom read", pt: "Leitura fantasma" },
	setup: ACCOUNTS,
	steps: (level) => [
		begin("A", level),
		{
			session: "A",
			label: "A counts first",
			sql: "SELECT count(*)::int AS total FROM accounts WHERE balance >= 100",
		},
		begin("B", level),
		{ session: "B", label: "B inserts", sql: "INSERT INTO accounts (id, balance) VALUES (3, 500)" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
		{
			session: "A",
			label: "A counts again",
			sql: "SELECT count(*)::int AS total FROM accounts WHERE balance >= 100",
		},
		{ session: "A", label: "A commits", sql: "COMMIT" },
	],
	occurred: (outcomes) =>
		numberAt(outcomes, "A counts first", "total") !== numberAt(outcomes, "A counts again", "total"),
};

// EN: Lost update: both read 100, A writes 100 + 10 and B writes 100 + 20. The new balance is
//     computed in the application from the value read earlier, so B's write erases A's deposit:
//     the account ends with 120 instead of 130. B's UPDATE has to wait for A's row lock, and
//     what happens when the lock is released is the whole difference between the levels.
// PT: Atualização perdida: os dois leem 100, A grava 100 + 10 e B grava 100 + 20. O novo saldo é
//     calculado na aplicação a partir do valor lido antes, então a escrita de B apaga o depósito
//     de A: a conta termina com 120 em vez de 130. O UPDATE de B precisa esperar o bloqueio de
//     linha de A, e o que acontece quando o bloqueio é liberado é toda a diferença entre os níveis.
const lostUpdate: Anomaly = {
	id: "lost-update",
	name: { en: "Lost update", pt: "Atualização perdida" },
	setup: ACCOUNTS,
	steps: (level) => [
		begin("A", level),
		begin("B", level),
		{ session: "A", label: "A reads", sql: "SELECT balance FROM accounts WHERE id = 1" },
		{ session: "B", label: "B reads", sql: "SELECT balance FROM accounts WHERE id = 1" },
		{
			session: "A",
			label: "A writes read + 10",
			sql: "UPDATE accounts SET balance = $1 WHERE id = 1",
			params: (outcomes) => [(numberAt(outcomes, "A reads", "balance") ?? 0) + 10],
		},
		{
			session: "B",
			label: "B writes read + 20",
			sql: "UPDATE accounts SET balance = $1 WHERE id = 1",
			params: (outcomes) => [(numberAt(outcomes, "B reads", "balance") ?? 0) + 20],
		},
		{ session: "A", label: "A commits", sql: "COMMIT" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
		{ session: "observer", label: "final balance", sql: "SELECT balance FROM accounts WHERE id = 1" },
	],
	// EN: 130 would be both deposits. 110 means B was refused and knows it must retry. Only 120
	//     is the silent loss: B "succeeded" and A's deposit is gone.
	// PT: 130 seriam os dois depósitos. 110 significa que B foi recusada e sabe que deve tentar
	//     de novo. Só 120 é a perda silenciosa: B "deu certo" e o depósito de A sumiu.
	occurred: (outcomes) => numberAt(outcomes, "final balance", "balance") === 120,
};

// EN: Write skew: the rule is "at least one doctor on call". Each transaction checks the rule,
//     sees two doctors on call, and takes a different one off. Neither wrote a row the other
//     read-and-wrote, so there is no write conflict, yet together they break the rule. A
//     snapshot cannot see this. Only a serializable check of the read/write dependencies can.
// PT: Write skew: a regra é "pelo menos um médico de plantão". Cada transação confere a regra, vê
//     dois médicos de plantão e tira um médico diferente. Nenhuma escreveu uma linha que a outra
//     leu e escreveu, então não há conflito de escrita, mas juntas elas quebram a regra. Um
//     snapshot não enxerga isso. Só a verificação serializável das dependências de leitura e
//     escrita enxerga.
const writeSkew: Anomaly = {
	id: "write-skew",
	name: { en: "Write skew", pt: "Write skew" },
	setup: ["TRUNCATE doctors", "INSERT INTO doctors (name, on_call) VALUES ('alice', true), ('bob', true)"],
	steps: (level) => [
		begin("A", level),
		begin("B", level),
		{ session: "A", label: "A counts on call", sql: "SELECT count(*)::int AS total FROM doctors WHERE on_call" },
		{ session: "B", label: "B counts on call", sql: "SELECT count(*)::int AS total FROM doctors WHERE on_call" },
		{
			session: "A",
			label: "A takes alice off",
			sql: "UPDATE doctors SET on_call = false WHERE name = 'alice'",
		},
		{ session: "B", label: "B takes bob off", sql: "UPDATE doctors SET on_call = false WHERE name = 'bob'" },
		{ session: "A", label: "A commits", sql: "COMMIT" },
		{ session: "B", label: "B commits", sql: "COMMIT" },
		{
			session: "observer",
			label: "final on call",
			sql: "SELECT count(*)::int AS total FROM doctors WHERE on_call",
		},
	],
	occurred: (outcomes) => numberAt(outcomes, "final on call", "total") === 0,
};

export const ANOMALIES: Anomaly[] = [dirtyRead, nonRepeatableRead, phantom, lostUpdate, writeSkew];
