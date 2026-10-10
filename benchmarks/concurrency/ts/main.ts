// EN: Concurrency workload in TypeScript on Bun: n async functions wait at a gate, the gate
//     opens, and each one delivers its number. The sum is the checksum.
//     JavaScript model: one thread and an event loop. An `async` function runs until its first
//     `await`, then returns a promise and leaves the stack. When the awaited promise settles,
//     the rest of the function is queued as a microtask and the loop runs it later. Tasks
//     never run at the same time, so there are no data races, and a long computation blocks
//     everything else. A parked task is a promise plus a small closure on the heap.
// PT: Carga de concorrência em TypeScript no Bun: n funções assíncronas esperam em um portão, o
//     portão abre, e cada uma entrega seu número. A soma é o checksum.
//     Modelo do JavaScript: uma thread e um event loop. Uma função `async` roda até o primeiro
//     `await`, devolve uma promise e sai da pilha. Quando a promise aguardada resolve, o resto
//     da função entra na fila de microtarefas e o loop o executa depois. As tarefas nunca rodam
//     ao mesmo tempo, então não há corrida de dados, e um cálculo longo bloqueia todo o resto.
//     Uma tarefa parada é uma promise mais uma pequena closure no heap.
// ES: Carga de concurrencia en TypeScript sobre Bun: n funciones asíncronas esperan en una compuerta, la
//     compuerta se abre, y cada una entrega su número. La suma es el checksum.
//     Modelo de JavaScript: un thread y un event loop. Una función `async` corre hasta el primer
//     `await`, devuelve una promesa y sale del stack. Cuando la promesa esperada se resuelve, el resto
//     de la función entra en la cola de microtareas y el loop lo ejecuta después. Las tareas nunca corren
//     al mismo tiempo, así que no hay carreras de datos, y un cálculo largo bloquea todo lo demás.
//     Una tarea detenida es una promesa más una pequeña closure en el heap.

import { readFileSync } from "node:fs";

async function run(n: number): Promise<number> {
	let open: () => void = () => {};
	const gate = new Promise<void>((resolve) => {
		open = resolve;
	});
	const mailbox: number[] = [];

	async function worker(id: number): Promise<void> {
		await gate;
		mailbox.push(id);
	}

	const tasks: Promise<void>[] = [];
	for (let id = 0; id < n; id++) {
		tasks.push(worker(id));
	}
	open();
	await Promise.all(tasks);

	let sum = 0;
	for (const id of mailbox) {
		sum += id;
	}
	return sum;
}

function peakMemoryKb(): number {
	const match = /VmHWM:\s+(\d+)/.exec(readFileSync("/proc/self/status", "utf8"));
	return match?.[1] === undefined ? 0 : Number(match[1]);
}

const [implementation = "promises", size = "1000"] = process.argv.slice(2);
const n = Number(size);

const start = performance.now();
const sum = await run(n);
const elapsedMs = performance.now() - start;

console.log(
	JSON.stringify({ n, elapsedMs, memoryKb: peakMemoryKb(), language: "ts", implementation, checksum: String(sum) }),
);
