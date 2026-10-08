import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadCases } from "../../src/cases";
import { createLimiter } from "../../src/factory";
import { LeakyBucket } from "../../src/leaky-bucket";
import { ALGORITHMS } from "../../src/limiter";

// EN: Table-driven tests. Each row of `cases/cases.json` is a timeline: "a request arrives at
//     this millisecond, and it must be admitted (or rejected)". The clock is the `atMs` of the
//     row, passed as an argument, so nothing here waits or depends on the speed of the machine.
//     The Go tests read the same file, which proves both implementations decide alike.
// PT: Testes orientados por tabela. Cada linha de `cases/cases.json` é uma linha do tempo: "uma
//     requisição chega neste milissegundo, e deve ser admitida (ou rejeitada)". O relógio é o
//     `atMs` da linha, passado como argumento, então nada aqui espera nem depende da velocidade
//     da máquina. Os testes em Go leem o mesmo arquivo, o que prova que as duas implementações
//     decidem igual.
const cases = loadCases(join(import.meta.dir, "..", "..", "..", "cases", "cases.json"));

describe("table of allowed and rejected requests over time", () => {
	for (const item of cases) {
		test(item.name, () => {
			const limiter = createLimiter(item.algorithm, { limit: item.limit, windowMs: item.windowMs });
			const decisions = item.requests.map((request) => limiter.allow(request.atMs));
			expect(decisions).toEqual(item.requests.map((request) => request.allowed));
		});
	}

	test("every algorithm has at least three cases", () => {
		for (const algorithm of ALGORITHMS) {
			expect(cases.filter((item) => item.algorithm === algorithm).length).toBeGreaterThanOrEqual(3);
		}
	});
});

describe("leaky bucket as a queue: when each admitted request leaves", () => {
	for (const item of cases.filter((candidate) => candidate.algorithm === "leaky-bucket")) {
		test(item.name, () => {
			const bucket = new LeakyBucket({ limit: item.limit, windowMs: item.windowMs });
			const departures = item.requests.map((request) => bucket.schedule(request.atMs));
			expect(departures).toEqual(item.requests.map((request) => request.departAtMs ?? null));
		});
	}

	test("departures are never closer than windowMs / limit, whatever the input", () => {
		const bucket = new LeakyBucket({ limit: 5, windowMs: 1000 });
		const departures: number[] = [];
		// EN: An irregular flood: several requests per millisecond, then gaps.
		// PT: Uma enxurrada irregular: várias requisições por milissegundo, depois intervalos.
		for (let time = 0; time < 5000; time += time % 700 < 80 ? 1 : 37) {
			const departAt = bucket.schedule(time);
			if (departAt !== null) {
				departures.push(departAt);
			}
		}
		expect(departures.length).toBeGreaterThan(10);
		for (let index = 1; index < departures.length; index++) {
			expect((departures[index] ?? 0) - (departures[index - 1] ?? 0)).toBeGreaterThanOrEqual(200);
		}
	});
});

describe("configuration", () => {
	test("a limit or a window that is not a positive integer is refused", () => {
		for (const algorithm of ALGORITHMS) {
			expect(() => createLimiter(algorithm, { limit: 0, windowMs: 1000 })).toThrow(RangeError);
			expect(() => createLimiter(algorithm, { limit: 10, windowMs: 0.5 })).toThrow(RangeError);
		}
	});
});
