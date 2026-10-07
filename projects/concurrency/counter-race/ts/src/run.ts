import { Worker } from "node:worker_threads";
import { COUNTER, GATE, SLOTS, type Variant, type WorkerJob, type WorkerMessage } from "./shared";

const workerFile = new URL("./worker.ts", import.meta.url);

/**
 * Increments a counter `perWorker` times from each of `workers` threads and resolves with the
 * final value. The expected value is `workers * perWorker`.
 */
export function runCounter(variant: Variant, workers: number, perWorker: number): Promise<number> {
	const buffer = new SharedArrayBuffer(SLOTS * Int32Array.BYTES_PER_ELEMENT);
	const view = new Int32Array(buffer);
	// EN: In the "message" variant this plain variable is the counter. Only the main thread can
	//     see it, and the event loop handles one message at a time, so the increments can never
	//     overlap. The main thread plays the role of the owner (an actor with a mailbox).
	// PT: Na variante "message" esta variável comum é o contador. Só a thread principal a
	//     enxerga, e o event loop trata uma mensagem por vez, então os incrementos nunca se
	//     sobrepõem. A thread principal faz o papel de dona (um ator com caixa de mensagens).
	let owned = 0;
	let ready = 0;
	let done = 0;

	return new Promise((resolve, reject) => {
		const pool: Worker[] = [];
		const finish = (): void => {
			for (const worker of pool) {
				void worker.terminate();
			}
			resolve(variant === "message" ? owned : Atomics.load(view, COUNTER));
		};
		for (let i = 0; i < workers; i++) {
			const job: WorkerJob = { buffer, variant, perWorker };
			const worker = new Worker(workerFile, { workerData: job });
			worker.on("error", reject);
			worker.on("message", (message: WorkerMessage) => {
				if (message === "inc") {
					owned += 1;
				} else if (message === "ready") {
					ready += 1;
					if (ready === workers) {
						Atomics.store(view, GATE, 1);
						Atomics.notify(view, GATE);
					}
				} else {
					// EN: Messages of one worker arrive in the order they were sent, so its "done"
					//     comes after all of its "inc" messages.
					// PT: As mensagens de um worker chegam na ordem em que foram enviadas, então o
					//     "done" dele vem depois de todas as suas mensagens "inc".
					done += 1;
					if (done === workers) {
						finish();
					}
				}
			});
			pool.push(worker);
		}
	});
}
