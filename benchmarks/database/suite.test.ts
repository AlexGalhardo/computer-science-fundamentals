// EN: Host-side test of the database workload (`bun run test:database`). The seven clients run
//     against the same PostgreSQL with a small input, and all of them must report the same
//     checksum, equal to a reference calculated here without any database. That proves they
//     inserted the same rows and read back the same values. Requires Docker.
// PT: Teste da carga de banco de dados no lado do host (`bun run test:database`). Os sete
//     clientes rodam contra o mesmo PostgreSQL com uma entrada pequena, e todos precisam
//     informar o mesmo checksum, igual a uma referência calculada aqui sem banco nenhum. Isso
//     prova que eles inseriram as mesmas linhas e leram os mesmos valores. Precisa do Docker.

import { afterAll, beforeAll, expect, test } from "bun:test";
import { LANGUAGES, run } from "../scripts/lib";
import { compose, runClient } from "./collect";

const ROWS = 300;
const WORKERS = 8;

// EN: Row i has price (i * 37) % 1000 and category i % 10. The clients add the prices twice
//     (single connection and pool) and, for 200 queries, the count and the sum of one category.
// PT: A linha i tem preço (i * 37) % 1000 e categoria i % 10. Os clientes somam os preços duas
//     vezes (conexão única e pool) e, em 200 consultas, a contagem e a soma de uma categoria.
function reference(rows: number): string {
	let prices = 0;
	const count = new Array<number>(10).fill(0);
	const sum = new Array<number>(10).fill(0);
	for (let i = 1; i <= rows; i++) {
		const price = (i * 37) % 1000;
		prices += price;
		count[i % 10] = (count[i % 10] ?? 0) + 1;
		sum[i % 10] = (sum[i % 10] ?? 0) + price;
	}
	let queries = 0;
	for (let i = 0; i < 200; i++) {
		queries += (count[i % 10] ?? 0) + (sum[i % 10] ?? 0);
	}
	return String(2 * prices + queries);
}

beforeAll(() => {
	compose(["build", ...LANGUAGES.map((language) => `client-${language}`)]);
	compose(["up", "-d", "--wait", "postgres"]);
}, 1_800_000);

afterAll(() => {
	run(["docker", "compose", "--profile", "clients", "down", "-v", "--remove-orphans"], { cwd: import.meta.dir });
}, 120_000);

test.each([...LANGUAGES])(
	"client-%s reads back what it inserted",
	(language) => {
		const result = runClient(language, ROWS, WORKERS);
		expect(result.language).toBe(language);
		expect(result.checksum).toBe(reference(ROWS));
		expect(result.phases.insert.ops).toBe(ROWS);
		expect(result.phases.read.ops).toBe(ROWS);
		expect(result.phases.query.ops).toBe(200);
		expect(result.phases.pool.ops).toBe(ROWS);
		expect(result.memoryKb).toBeGreaterThan(0);
	},
	120_000,
);

test("the database is not reachable from the host: no port is published", () => {
	const listing = compose(["ps", "--format", "json"]);
	expect(listing).not.toContain('"PublishedPort":5432');
	expect(listing).not.toMatch(/"PublishedPort":[1-9]/);
});
