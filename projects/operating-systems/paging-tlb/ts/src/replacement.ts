// EN: Page replacement algorithms. Physical memory has a fixed number of frames. When a page
//     that is not loaded is referenced (a page fault) and no frame is free, one loaded page has
//     to leave. The algorithms differ only in how they choose that victim.
// PT: Algoritmos de substituição de páginas. A memória física tem um número fixo de molduras.
//     Quando uma página que não está carregada é referenciada (uma falta de página) e não há
//     moldura livre, uma página carregada precisa sair. Os algoritmos diferem apenas em como
//     escolhem essa vítima.

export const ALGORITHMS = ["fifo", "clock", "lru", "optimal"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export interface Access {
	fault: boolean;
	/** Frame that holds the page after the access. */
	frame: number;
	/** Page that was removed to make room, if any. */
	evicted: number | undefined;
}

export interface Replacer {
	access(page: number): Access;
}

abstract class Base implements Replacer {
	/** `frames[i]` is the page loaded in frame i. Frames are filled in order while free. */
	protected readonly frames: number[] = [];
	protected readonly where = new Map<number, number>();

	constructor(protected readonly capacity: number) {
		if (!Number.isInteger(capacity) || capacity < 1) {
			throw new Error("the number of frames must be a positive integer");
		}
	}

	access(page: number): Access {
		const loaded = this.where.get(page);
		if (loaded !== undefined) {
			this.onHit(page, loaded);
			return { fault: false, frame: loaded, evicted: undefined };
		}
		if (this.frames.length < this.capacity) {
			const frame = this.frames.length;
			this.frames.push(page);
			this.where.set(page, frame);
			this.onLoad(page, frame);
			return { fault: true, frame, evicted: undefined };
		}
		const frame = this.victim(page);
		const evicted = this.frames[frame] as number;
		this.where.delete(evicted);
		this.frames[frame] = page;
		this.where.set(page, frame);
		this.onLoad(page, frame);
		return { fault: true, frame, evicted };
	}

	protected abstract victim(incoming: number): number;
	protected onHit(_page: number, _frame: number): void {}
	protected onLoad(_page: number, _frame: number): void {}
}

// EN: FIFO removes the page that has been in memory the longest. Because frames are filled in
//     order and replaced in the same order, "the oldest" is simply the next frame in a circle.
//     FIFO ignores how the page is being used, so it may throw out a page that is used all
//     the time.
// PT: O FIFO remove a página que está há mais tempo na memória. Como as molduras são preenchidas
//     em ordem e substituídas na mesma ordem, "a mais antiga" é simplesmente a próxima moldura em
//     um círculo. O FIFO ignora como a página está sendo usada, então pode descartar uma página
//     usada o tempo todo.
class Fifo extends Base {
	private next = 0;

	protected victim(): number {
		const frame = this.next;
		this.next = (this.next + 1) % this.capacity;
		return frame;
	}
}

// EN: Clock (second chance) is FIFO with one extra bit per frame, the referenced bit R, set on
//     every use. The hand walks the circle: a frame with R = 1 gets a second chance (R is
//     cleared and the hand moves on), and the first frame found with R = 0 is the victim.
//     A page survives a full lap of the hand only if it was used again in the meantime.
// PT: O relógio (segunda chance) é o FIFO com um bit a mais por moldura, o bit de referência R,
//     ligado a cada uso. O ponteiro percorre o círculo: a moldura com R = 1 ganha uma segunda
//     chance (R é zerado e o ponteiro avança), e a primeira moldura encontrada com R = 0 é a
//     vítima. Uma página só sobrevive a uma volta completa do ponteiro se tiver sido usada de
//     novo nesse intervalo.
class Clock extends Base {
	private hand = 0;
	private readonly referenced: boolean[] = [];

	protected victim(): number {
		while (this.referenced[this.hand]) {
			this.referenced[this.hand] = false;
			this.hand = (this.hand + 1) % this.capacity;
		}
		const frame = this.hand;
		this.hand = (this.hand + 1) % this.capacity;
		return frame;
	}

	protected override onHit(_page: number, frame: number): void {
		this.referenced[frame] = true;
	}

	protected override onLoad(_page: number, frame: number): void {
		this.referenced[frame] = true;
	}
}

// EN: LRU removes the page whose last use is the oldest, betting that the recent past predicts
//     the near future. Here every access stamps the frame with a counter and the victim is the
//     smallest stamp. Real hardware cannot afford a stamp per access, which is why clock and
//     aging exist as approximations.
// PT: O LRU remove a página cujo último uso é o mais antigo, apostando que o passado recente
//     prevê o futuro próximo. Aqui cada acesso carimba a moldura com um contador, e a vítima é o
//     menor carimbo. Hardware real não pode pagar um carimbo por acesso, e por isso existem o
//     relógio e o envelhecimento como aproximações.
class Lru extends Base {
	private tick = 0;
	private readonly lastUse: number[] = [];

	protected victim(): number {
		let oldest = 0;
		for (let frame = 1; frame < this.capacity; frame++) {
			if ((this.lastUse[frame] as number) < (this.lastUse[oldest] as number)) {
				oldest = frame;
			}
		}
		return oldest;
	}

	protected override onHit(_page: number, frame: number): void {
		this.lastUse[frame] = ++this.tick;
	}

	protected override onLoad(_page: number, frame: number): void {
		this.lastUse[frame] = ++this.tick;
	}
}

// EN: The optimal algorithm removes the page whose next use is farthest in the future (or that
//     is never used again). No other algorithm can fault less. It cannot be built into a real
//     system, because nobody knows the future, but with a recorded trace it gives the lower
//     bound against which the real algorithms are measured.
// PT: O algoritmo ótimo remove a página cujo próximo uso está mais distante no futuro (ou que
//     nunca mais é usada). Nenhum outro algoritmo consegue menos faltas. Ele não pode ser
//     construído em um sistema real, porque ninguém conhece o futuro, mas com um traço gravado
//     ele dá o limite inferior contra o qual os algoritmos reais são medidos.
class Optimal extends Base {
	private position = 0;

	constructor(
		capacity: number,
		private readonly trace: readonly number[],
	) {
		super(capacity);
	}

	override access(page: number): Access {
		if (this.trace[this.position] !== page) {
			throw new Error("optimal replacement must be driven by the trace it was created with");
		}
		const result = super.access(page);
		this.position += 1;
		return result;
	}

	protected victim(): number {
		let best = 0;
		let bestDistance = -1;
		for (let frame = 0; frame < this.capacity; frame++) {
			const next = this.trace.indexOf(this.frames[frame] as number, this.position + 1);
			const distance = next === -1 ? Number.POSITIVE_INFINITY : next;
			if (distance > bestDistance) {
				best = frame;
				bestDistance = distance;
			}
		}
		return best;
	}
}

/** `trace` is required only by the optimal algorithm, which needs to see the future. */
export function createReplacer(algorithm: Algorithm, frames: number, trace: readonly number[] = []): Replacer {
	switch (algorithm) {
		case "fifo":
			return new Fifo(frames);
		case "clock":
			return new Clock(frames);
		case "lru":
			return new Lru(frames);
		case "optimal":
			return new Optimal(frames, trace);
	}
}

export function countFaults(algorithm: Algorithm, trace: readonly number[], frames: number): number {
	const replacer = createReplacer(algorithm, frames, trace);
	let faults = 0;
	for (const page of trace) {
		if (replacer.access(page).fault) {
			faults += 1;
		}
	}
	return faults;
}
