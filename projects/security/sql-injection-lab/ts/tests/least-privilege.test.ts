// EN: Least privilege is the safety net under the parameterised queries. These tests talk to
//     PostgreSQL with the role of the fixed app and check what the database itself refuses.
//     SQLSTATE 42501 means "insufficient privilege".
// PT: Menor privilégio é a rede de proteção embaixo das consultas parametrizadas. Estes testes
//     falam com o PostgreSQL usando o papel do app corrigido e conferem o que o próprio banco
//     recusa. SQLSTATE 42501 significa "privilégio insuficiente".
// ES: El mínimo privilegio es la red de protección debajo de las consultas parametrizadas. Estas pruebas
//     hablan con PostgreSQL usando el rol de la app corregida y comprueban lo que la propia base de datos
//     rechaza. SQLSTATE 42501 significa "privilegio insuficiente".

import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Pool } from "pg";
import { loadConfig } from "../src/config";
import { createPool } from "../src/db";
import { UNION_SEARCH } from "../src/scenario";
import { vulnerableSearchProducts } from "../src/vulnerable/vulnerable-queries";

const INSUFFICIENT_PRIVILEGE = "42501";

let readonlyPool: Pool;

beforeAll(() => {
	readonlyPool = createPool(loadConfig().READONLY_DATABASE_URL);
});

afterAll(async () => {
	await readonlyPool.end();
});

/** Runs the action and returns the SQLSTATE of the error it raised, or null when it succeeded. */
async function sqlStateOf(action: () => Promise<unknown>): Promise<string | null> {
	try {
		await action();
		return null;
	} catch (error) {
		if (error instanceof Error && "code" in error && typeof error.code === "string") {
			return error.code;
		}
		throw error;
	}
}

test("the read-only role reads the tables the routes need", async () => {
	const users = await readonlyPool.query<{ total: number }>("SELECT count(*)::int AS total FROM users");
	const products = await readonlyPool.query<{ total: number }>("SELECT count(*)::int AS total FROM products");
	expect(users.rows[0]?.total).toBe(3);
	expect(products.rows[0]?.total).toBe(3);
});

test("the read-only role cannot read the secrets table", async () => {
	expect(await sqlStateOf(() => readonlyPool.query("SELECT secret_value FROM secrets"))).toBe(INSUFFICIENT_PRIVILEGE);
});

test("the read-only role cannot write", async () => {
	const insert = "INSERT INTO products (id, name, description) VALUES (99, 'Fake intruder', 'never stored')";
	expect(await sqlStateOf(() => readonlyPool.query(insert))).toBe(INSUFFICIENT_PRIVILEGE);
	expect(await sqlStateOf(() => readonlyPool.query("UPDATE users SET username = 'changed-fake' WHERE id = 1"))).toBe(
		INSUFFICIENT_PRIVILEGE,
	);
	expect(await sqlStateOf(() => readonlyPool.query("DELETE FROM products WHERE id = 1"))).toBe(
		INSUFFICIENT_PRIVILEGE,
	);
	expect(await sqlStateOf(() => readonlyPool.query("CREATE TABLE fake_intruder (id integer)"))).toBe(
		INSUFFICIENT_PRIVILEGE,
	);
});

// EN: Defence in depth: even the vulnerable, concatenated query cannot leak the secrets when the
//     connection has no right to read that table. The role does not fix the injection (the
//     login bypass would still work), it only limits what an injection can reach.
// PT: Defesa em profundidade: nem a consulta vulnerável, concatenada, vaza os segredos quando a
//     conexão não tem direito de ler aquela tabela. O papel não corrige a injeção (o desvio do
//     login continuaria funcionando), ele só limita o que uma injeção alcança.
// ES: Defensa en profundidad: ni siquiera la consulta vulnerable, concatenada, filtra los secretos cuando
//     la conexión no tiene derecho a leer esa tabla. El rol no corrige la inyección (el desvío del
//     inicio de sesión seguiría funcionando), solo limita lo que una inyección alcanza.
test("the UNION of the lab fails when the vulnerable query runs with the read-only role", async () => {
	expect(await sqlStateOf(() => vulnerableSearchProducts(readonlyPool, UNION_SEARCH))).toBe(INSUFFICIENT_PRIVILEGE);
});
