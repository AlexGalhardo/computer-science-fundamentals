import { parentPort, workerData } from "node:worker_threads";
import { GATE, incAtomic, incBuggy, incMutex, type WorkerJob, type WorkerMessage } from "./shared";

const port = parentPort;
if (port === null) {
	throw new Error("worker.ts must run as a worker thread");
}
const send = (message: WorkerMessage): void => port.postMessage(message);

const job = workerData as WorkerJob;
const view = new Int32Array(job.buffer);

// EN: Starting gate. The worker says it is ready and sleeps until the main thread opens the
//     gate for everybody at once. Starting a worker takes far longer than counting, so without
//     the gate the workers would run one after the other and the bug would hide.
// PT: Portão de largada. O worker avisa que está pronto e dorme até a thread principal abrir o
//     portão para todos de uma vez. Iniciar um worker demora muito mais do que contar, então
//     sem o portão os workers rodariam um depois do outro e o bug ficaria escondido.
// ES: Puerta de salida. El worker avisa que está listo y duerme hasta que el thread principal abra
//     la puerta para todos de una vez. Iniciar un worker tarda mucho más que contar, así que
//     sin la puerta los workers correrían uno después del otro y el bug quedaría escondido.
send("ready");
Atomics.wait(view, GATE, 0);

switch (job.variant) {
	case "buggy":
		for (let i = 0; i < job.perWorker; i++) incBuggy(view);
		break;
	case "mutex":
		for (let i = 0; i < job.perWorker; i++) incMutex(view);
		break;
	case "atomic":
		for (let i = 0; i < job.perWorker; i++) incAtomic(view);
		break;
	case "message":
		// EN: No shared counter here: the worker only asks the owner (the main thread) to add one.
		// PT: Aqui não há contador compartilhado: o worker só pede ao dono (a thread principal) que some um.
		// ES: Aquí no hay contador compartido: el worker solo le pide al dueño (el thread principal) que sume uno.
		for (let i = 0; i < job.perWorker; i++) send("inc");
		break;
}
send("done");
