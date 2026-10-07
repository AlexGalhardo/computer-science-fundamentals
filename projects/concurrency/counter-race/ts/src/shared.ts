// EN: JavaScript threads (workers) normally share nothing: each has its own memory. A
//     `SharedArrayBuffer` is the exception. Every worker that receives it sees the same bytes,
//     which is exactly what makes a data race possible in JavaScript.
// PT: Threads em JavaScript (workers) normalmente não compartilham nada: cada uma tem sua
//     memória. O `SharedArrayBuffer` é a exceção. Todo worker que o recebe enxerga os mesmos
//     bytes, e é exatamente isso que torna possível uma corrida de dados em JavaScript.

export const VARIANTS = ["buggy", "mutex", "atomic", "message"] as const;
export type Variant = (typeof VARIANTS)[number];

export function isVariant(value: string): value is Variant {
	return (VARIANTS as readonly string[]).includes(value);
}

/** Positions inside the shared Int32Array. */
export const COUNTER = 0;
export const LOCK = 1;
export const GATE = 2;
export const SLOTS = 3;

export interface WorkerJob {
	buffer: SharedArrayBuffer;
	variant: Variant;
	perWorker: number;
}

export type WorkerMessage = "ready" | "done" | "inc";

// DELIBERATELY WRONG: a plain read followed by a plain write on shared memory.
// EN: Between the read and the write another worker can store a newer value, and this write
//     then puts the old value plus one on top of it. That increment is lost.
// PT: Entre a leitura e a escrita outro worker pode gravar um valor mais novo, e esta escrita
//     coloca o valor antigo mais um por cima dele. Aquele incremento se perde.
export function incBuggy(view: Int32Array): void {
	view[COUNTER] = (view[COUNTER] ?? 0) + 1;
}

// EN: `Atomics.add` reads, adds and writes as one indivisible step of the processor.
// PT: `Atomics.add` lê, soma e grava como um passo indivisível do processador.
export function incAtomic(view: Int32Array): void {
	Atomics.add(view, COUNTER, 1);
}

// EN: A mutex built from two atomic primitives. The lock is one integer: 0 is free, 1 is taken.
//     `compareExchange(0 -> 1)` takes it only if it is free, in one atomic step, so two workers
//     can never both win. The loser sleeps with `Atomics.wait` instead of spinning, and
//     `unlock` wakes one sleeper. This is how a real mutex works underneath (a futex).
// PT: Um mutex montado com duas primitivas atômicas. A trava é um inteiro: 0 é livre, 1 é
//     ocupada. `compareExchange(0 -> 1)` só a pega se estiver livre, em um passo atômico, então
//     dois workers nunca ganham ao mesmo tempo. Quem perde dorme com `Atomics.wait` em vez de
//     girar em falso, e `unlock` acorda um dos que dormem. É assim que um mutex de verdade
//     funciona por baixo (um futex).
export function lock(view: Int32Array): void {
	while (Atomics.compareExchange(view, LOCK, 0, 1) !== 0) {
		Atomics.wait(view, LOCK, 1);
	}
}

export function unlock(view: Int32Array): void {
	Atomics.store(view, LOCK, 0);
	Atomics.notify(view, LOCK, 1);
}

// EN: The same buggy read and write, now inside a critical section: only the lock holder runs it.
// PT: A mesma leitura e escrita com bug, agora dentro de uma seção crítica: só quem tem a trava executa.
export function incMutex(view: Int32Array): void {
	lock(view);
	incBuggy(view);
	unlock(view);
}
