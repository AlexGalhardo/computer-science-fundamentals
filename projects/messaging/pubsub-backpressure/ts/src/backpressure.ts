// EN: A producer faster than its consumer, inside one process, with and without backpressure.
//     No broker is involved: the buffer between the two is an array, so the memory that grows
//     is the memory of this process and can be measured directly.
// PT: Um produtor mais rápido que o seu consumidor, dentro de um processo, com e sem
//     backpressure. Não há broker: o buffer entre os dois é um array, então a memória que cresce
//     é a memória deste processo e pode ser medida diretamente.
// ES: Un productor más rápido que su consumidor, dentro de un proceso, con y sin backpressure. No
//     hay broker: el buffer entre los dos es un array, así que la memoria que crece es la memoria
//     de este proceso y puede medirse directamente.

// EN: A queue with a capacity. `push` is the whole idea of backpressure in one method: when the
//     queue is full, the promise does not resolve until the consumer takes an item, so a
//     producer that awaits it is slowed down to the consumer's pace. With an infinite capacity
//     the promise always resolves at once and nothing ever tells the producer to wait.
// PT: Uma fila com capacidade. O `push` é a ideia inteira de backpressure em um método: quando a
//     fila está cheia, a promise não resolve até o consumidor retirar um item, então um produtor
//     que a espera é desacelerado até o ritmo do consumidor. Com capacidade infinita a promise
//     sempre resolve na hora e nada jamais manda o produtor esperar.
// ES: Una cola con capacidad. `push` es toda la idea de backpressure en un método: cuando la cola
//     está llena, la promesa no se resuelve hasta que el consumidor toma un elemento, así que un
//     productor que la espera se ralentiza al ritmo del consumidor. Con capacidad infinita la
//     promesa siempre se resuelve al instante y nada le dice jamás al productor que espere.
export class BoundedQueue<T> {
	private readonly items: T[] = [];
	private readonly waitingForSpace: (() => void)[] = [];
	private readonly waitingForItem: (() => void)[] = [];

	constructor(readonly capacity: number) {
		if (!(capacity >= 1)) {
			throw new RangeError("capacity must be at least 1");
		}
	}

	get size(): number {
		return this.items.length;
	}

	async push(item: T): Promise<void> {
		while (this.items.length >= this.capacity) {
			await new Promise<void>((resolve) => this.waitingForSpace.push(resolve));
		}
		this.items.push(item);
		this.waitingForItem.shift()?.();
	}

	async shift(): Promise<T> {
		for (;;) {
			const item = this.items.shift();
			if (item !== undefined) {
				this.waitingForSpace.shift()?.();
				return item;
			}
			await new Promise<void>((resolve) => this.waitingForItem.push(resolve));
		}
	}
}

export interface Sample {
	atMs: number;
	/** Messages waiting between the producer and the consumer. */
	buffered: number;
	/** Exact size of the payloads waiting, in MiB. */
	bufferedMb: number;
	/** Resident memory of the process, in MiB. */
	rssMb: number;
}

export interface PressureResult {
	capacity: number;
	produced: number;
	consumed: number;
	samples: Sample[];
	peakBuffered: number;
	/** Resident memory at the last sample minus the first one, in MiB. */
	rssGrowthMb: number;
}

export interface PressureOptions {
	/** `Number.POSITIVE_INFINITY` means no backpressure. */
	capacity: number;
	durationMs: number;
	/** Messages the producer tries to send per millisecond tick. */
	burst: number;
	payloadBytes: number;
	sampleEveryMs: number;
}

export const DEFAULT_PRESSURE: Omit<PressureOptions, "capacity"> = {
	durationMs: 2000,
	burst: 20,
	payloadBytes: 4096,
	sampleEveryMs: 100,
};

const MIB = 1024 * 1024;

// EN: The producer wants to send `burst` messages every millisecond; the consumer handles one
//     message per millisecond. The only difference between the two runs is the capacity of the
//     queue, that is, whether `await queue.push()` ever makes the producer wait.
// PT: O produtor quer enviar `burst` mensagens a cada milissegundo; o consumidor trata uma
//     mensagem por milissegundo. A única diferença entre as duas execuções é a capacidade da
//     fila, isto é, se o `await queue.push()` alguma vez faz o produtor esperar.
// ES: El productor quiere enviar `burst` mensajes cada milisegundo; el consumidor procesa un
//     mensaje por milisegundo. La única diferencia entre las dos ejecuciones es la capacidad de la
//     cola, es decir, si `await queue.push()` alguna vez hace esperar al productor.
export async function runPressure(options: PressureOptions): Promise<PressureResult> {
	const queue = new BoundedQueue<Uint8Array>(options.capacity);
	const samples: Sample[] = [];
	let produced = 0;
	let consumed = 0;
	let running = true;
	const start = performance.now();

	const sample = (): void => {
		// EN: A forced collection before each reading, so the number is live memory and not
		//     garbage that the collector has not got to yet.
		// PT: Uma coleta forçada antes de cada leitura, para o número ser memória viva e não
		//     lixo que o coletor ainda não recolheu.
		// ES: Una recolección forzada antes de cada lectura, para que el número sea memoria viva
		//     y no basura que el recolector aún no ha limpiado.
		Bun.gc(true);
		samples.push({
			atMs: Math.round(performance.now() - start),
			buffered: queue.size,
			bufferedMb: (queue.size * options.payloadBytes) / MIB,
			rssMb: process.memoryUsage().rss / MIB,
		});
	};

	const producer = async (): Promise<void> => {
		while (running) {
			for (let index = 0; index < options.burst && running; index += 1) {
				await queue.push(new Uint8Array(options.payloadBytes).fill(produced & 255));
				produced += 1;
			}
			await Bun.sleep(1);
		}
	};

	const consumer = async (): Promise<void> => {
		while (running) {
			await queue.shift();
			consumed += 1;
			await Bun.sleep(1);
		}
	};

	const sampler = async (): Promise<void> => {
		while (running) {
			sample();
			await Bun.sleep(options.sampleEveryMs);
		}
	};

	const tasks = [producer(), consumer(), sampler()];
	await Bun.sleep(options.durationMs);
	sample();
	running = false;
	// EN: A loop parked on the queue (a producer waiting for space) never wakes up after the
	//     others stop. Its promise is simply abandoned, so the wait here has a short limit.
	// PT: Um laço estacionado na fila (um produtor esperando espaço) nunca acorda depois que os
	//     outros param. A sua promise é simplesmente abandonada, então a espera aqui tem um limite curto.
	// ES: Un bucle aparcado en la cola (un productor esperando espacio) nunca despierta después de
	//     que los demás se detienen. Su promesa simplemente se abandona, así que la espera aquí
	//     tiene un límite corto.
	await Promise.race([Promise.all(tasks), Bun.sleep(50)]);

	const first = samples[0];
	const last = samples[samples.length - 1];
	return {
		capacity: options.capacity,
		produced,
		consumed,
		samples,
		peakBuffered: Math.max(...samples.map((entry) => entry.buffered)),
		rssGrowthMb: first === undefined || last === undefined ? 0 : last.rssMb - first.rssMb,
	};
}
