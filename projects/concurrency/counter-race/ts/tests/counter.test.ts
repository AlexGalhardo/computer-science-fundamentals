import { expect, test } from "bun:test";
import { runCounter } from "../src/run";
import { VARIANTS } from "../src/shared";

const WORKERS = 8;
const PER_WORKER = 125_000;
const EXPECTED = WORKERS * PER_WORKER; // 1,000,000
const FIXED_RUNS = Number(process.env.FIXED_RUNS ?? 100);

// EN: A race is a matter of probability, so one run proves nothing. The experiment is repeated
//     10 times and the bug must show in at least 9 of them.
// PT: Uma corrida é questão de probabilidade, então uma execução não prova nada. O experimento
//     é repetido 10 vezes e o bug precisa aparecer em pelo menos 9 delas.
// ES: Una carrera es cuestión de probabilidad, así que una ejecución no prueba nada. El
//     experimento se repite 10 veces y el bug debe aparecer en al menos 9 de ellas.
test("buggy counter loses updates in at least 9 of 10 runs", async () => {
	let lostRuns = 0;
	for (let run = 1; run <= 10; run++) {
		const total = await runCounter("buggy", WORKERS, PER_WORKER);
		console.log(`run ${run}: final=${total} lost=${EXPECTED - total}`);
		expect(total).toBeLessThanOrEqual(EXPECTED);
		if (total < EXPECTED) {
			lostRuns += 1;
		}
	}
	console.log(`buggy counter lost updates in ${lostRuns} of 10 runs`);
	expect(lostRuns).toBeGreaterThanOrEqual(9);
}, 120_000);

// EN: A fix is only a fix if it is right every time: 100 runs in a row, each exactly 1,000,000.
// PT: Uma correção só é correção se acerta sempre: 100 execuções seguidas, cada uma com
//     exatamente 1.000.000.
// ES: Una corrección solo es corrección si acierta siempre: 100 ejecuciones seguidas, cada una con
//     exactamente 1,000,000.
for (const variant of VARIANTS.filter((name) => name !== "buggy")) {
	test(`${variant} counter is exact in ${FIXED_RUNS} consecutive runs`, async () => {
		for (let run = 1; run <= FIXED_RUNS; run++) {
			const total = await runCounter(variant, WORKERS, PER_WORKER);
			if (total !== EXPECTED) {
				throw new Error(`${variant}, run ${run}: final=${total}, want ${EXPECTED}`);
			}
		}
		console.log(`${variant}: ${FIXED_RUNS} of ${FIXED_RUNS} runs reached exactly ${EXPECTED}`);
	}, 900_000);
}
