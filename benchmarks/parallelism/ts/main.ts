// EN: Parallelism workload in TypeScript on Bun: count the primes below n, range cut into 256
//     chunks. JavaScript model: one thread per "isolate". Code in one thread never touches the
//     objects of another, so the only way to use more cores is to start Workers, each with its
//     own heap and event loop, and exchange messages. The main thread hands a chunk number to
//     each worker and gives it the next one when the answer arrives.
// PT: Carga de paralelismo em TypeScript no Bun: conta os primos abaixo de n, intervalo cortado
//     em 256 pedaços. Modelo do JavaScript: uma thread por "isolate". O código de uma thread
//     nunca toca nos objetos de outra, então o único jeito de usar mais núcleos é subir Workers,
//     cada um com seu heap e seu event loop, e trocar mensagens. A thread principal entrega um
//     número de pedaço a cada worker e manda o próximo quando a resposta chega.

import { readFileSync } from "node:fs";

const CHUNKS = 256;

function countPrimes(n: number, workers: number): Promise<number> {
	return new Promise((resolve, reject) => {
		let next = 0;
		let total = 0;
		let alive = workers;
		for (let w = 0; w < workers; w++) {
			const worker = new Worker(new URL("./worker.ts", import.meta.url).href);
			const dispatch = (): void => {
				if (next < CHUNKS) {
					worker.postMessage({ chunk: next++, n });
					return;
				}
				worker.terminate();
				alive--;
				if (alive === 0) {
					resolve(total);
				}
			};
			worker.onmessage = (event: MessageEvent<number>): void => {
				total += event.data;
				dispatch();
			};
			worker.onerror = (event: ErrorEvent): void => reject(new Error(event.message));
			dispatch();
		}
	});
}

// EN: VmHWM covers the whole process, and the workers are threads of this process.
// PT: O VmHWM cobre o processo inteiro, e os workers são threads deste processo.
function peakMemoryKb(): number {
	const match = /VmHWM:\s+(\d+)/.exec(readFileSync("/proc/self/status", "utf8"));
	return match?.[1] === undefined ? 0 : Number(match[1]);
}

const [implementation = "primes", size = "100000", workerCount = "1"] = process.argv.slice(2);
const n = Number(size);

// EN: Starting the workers is inside the timed section, like thread creation elsewhere.
// PT: Subir os workers fica dentro do trecho cronometrado, como a criação de threads nas outras.
const start = performance.now();
const total = await countPrimes(n, Number(workerCount));
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({
		n,
		elapsedMs,
		memoryKb: peakMemoryKb(),
		language: "ts",
		implementation,
		checksum: String(total),
	}),
);
