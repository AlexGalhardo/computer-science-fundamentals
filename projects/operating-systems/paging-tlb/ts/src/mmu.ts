import { type Algorithm, createReplacer, type Replacer } from "./replacement";

export interface MmuOptions {
	/** Bytes per page. Must be a power of two, so that the offset is the low bits. */
	pageSize: number;
	/** Number of physical frames. */
	frames: number;
	/** Number of translations the TLB can hold. */
	tlbEntries: number;
	/** How a page is chosen to leave memory. The optimal algorithm needs the future, so it is not offered here. */
	algorithm: Exclude<Algorithm, "optimal">;
}

export interface Translation {
	physical: number;
	page: number;
	frame: number;
	offset: number;
	tlbHit: boolean;
	pageFault: boolean;
}

export interface Counters {
	accesses: number;
	tlbHits: number;
	tlbMisses: number;
	pageFaults: number;
}

// EN: A memory management unit in miniature. A virtual address is split into a page number
//     (the high bits) and an offset (the low bits). The page number is translated to a frame
//     number and the offset is copied unchanged.
//     The translation is looked up first in the TLB, a small cache of recent translations. On a
//     TLB miss the page table is consulted. If the page is not in memory at all, that is a page
//     fault: a frame is found (evicting another page if necessary) and the page is loaded.
// PT: Uma unidade de gerenciamento de memória em miniatura. Um endereço virtual se divide em
//     número de página (os bits altos) e deslocamento (os bits baixos). O número de página é
//     traduzido para um número de moldura, e o deslocamento é copiado sem alteração.
//     A tradução é procurada primeiro na TLB, uma pequena cache de traduções recentes. Em uma
//     falta de TLB, a tabela de páginas é consultada. Se a página não está na memória, ocorre
//     uma falta de página: uma moldura é obtida (retirando outra página, se preciso) e a página
//     é carregada.
// ES: Una unidad de gestión de memoria en miniatura. Una dirección virtual se divide en un número
//     de página (los bits altos) y un desplazamiento (los bits bajos). El número de página se
//     traduce a un número de marco y el desplazamiento se copia sin cambios.
//     La traducción se busca primero en la TLB, una pequeña caché de traducciones recientes. En
//     un fallo de TLB se consulta la tabla de páginas. Si la página no está en memoria, ocurre un
//     fallo de página: se obtiene un marco (expulsando otra página si es necesario) y se carga la
//     página.
export class Mmu {
	readonly counters: Counters = { accesses: 0, tlbHits: 0, tlbMisses: 0, pageFaults: 0 };
	private readonly offsetBits: number;
	private readonly replacer: Replacer;
	/** Page table: virtual page -> frame, only for pages that are present in memory. */
	private readonly pageTable = new Map<number, number>();
	// EN: A Map remembers insertion order. Deleting and re-inserting an entry on every hit keeps
	//     the least recently used translation first, which is the one the TLB drops when full.
	// PT: Um Map lembra a ordem de inserção. Apagar e reinserir a entrada a cada acerto mantém a
	//     tradução menos recentemente usada em primeiro lugar, que é a que a TLB descarta quando cheia.
	// ES: Un Map recuerda el orden de inserción. Borrar y reinsertar la entrada en cada acierto
	//     mantiene primero la traducción menos recientemente usada, que es la que la TLB descarta
	//     cuando está llena.
	private readonly tlb = new Map<number, number>();

	constructor(private readonly options: MmuOptions) {
		const { pageSize, tlbEntries } = options;
		if (!Number.isInteger(pageSize) || pageSize < 2 || (pageSize & (pageSize - 1)) !== 0) {
			throw new Error("pageSize must be a power of two");
		}
		if (!Number.isInteger(tlbEntries) || tlbEntries < 1) {
			throw new Error("tlbEntries must be a positive integer");
		}
		this.offsetBits = Math.log2(pageSize);
		this.replacer = createReplacer(options.algorithm, options.frames);
	}

	translate(virtual: number): Translation {
		if (!Number.isInteger(virtual) || virtual < 0) {
			throw new Error("the virtual address must be a non-negative integer");
		}
		const page = Math.floor(virtual / this.options.pageSize);
		const offset = virtual % this.options.pageSize;
		this.counters.accesses += 1;

		const cached = this.tlb.get(page);
		const tlbHit = cached !== undefined;
		let pageFault = false;
		// EN: The replacement algorithm is told about every access, not only the faults, because
		//     LRU and clock need to know that the page was used.
		// PT: O algoritmo de substituição é avisado de todo acesso, não só das faltas, porque o LRU
		//     e o relógio precisam saber que a página foi usada.
		// ES: Se avisa al algoritmo de reemplazo de cada acceso, no solo de los fallos, porque LRU y
		//     clock necesitan saber que la página fue usada.
		const access = this.replacer.access(page);
		if (tlbHit) {
			this.counters.tlbHits += 1;
			this.tlb.delete(page);
		} else {
			this.counters.tlbMisses += 1;
			if (access.fault) {
				pageFault = true;
				this.counters.pageFaults += 1;
				if (access.evicted !== undefined) {
					// EN: The evicted page is no longer in memory, so its translation must leave
					//     the page table AND the TLB. A stale TLB entry would send the program to
					//     a frame that now holds another page.
					// PT: A página retirada não está mais na memória, então sua tradução precisa sair
					//     da tabela de páginas E da TLB. Uma entrada velha na TLB mandaria o programa
					//     para uma moldura que agora guarda outra página.
					// ES: La página expulsada ya no está en memoria, así que su traducción debe salir
					//     de la tabla de páginas Y de la TLB. Una entrada obsoleta en la TLB enviaría
					//     al programa a un marco que ahora guarda otra página.
					this.pageTable.delete(access.evicted);
					this.tlb.delete(access.evicted);
				}
				this.pageTable.set(page, access.frame);
			}
			if (this.tlb.size >= this.options.tlbEntries) {
				const oldest = this.tlb.keys().next().value;
				if (oldest !== undefined) {
					this.tlb.delete(oldest);
				}
			}
		}
		const frame = this.pageTable.get(page) as number;
		this.tlb.set(page, frame);
		return { physical: frame * 2 ** this.offsetBits + offset, page, frame, offset, tlbHit, pageFault };
	}
}

// EN: Effective access time: the TLB is always consulted. On a hit one memory access follows.
//     On a miss the page table is read first, one memory access per level. The average is
//     weighted by the hit ratio. Page faults are left out: they cost milliseconds, not nanoseconds.
// PT: Tempo efetivo de acesso: a TLB é sempre consultada. No acerto, segue-se um acesso à
//     memória. Na falta, a tabela de páginas é lida antes, um acesso à memória por nível. A média
//     é ponderada pela taxa de acerto. As faltas de página ficam de fora: custam milissegundos,
//     não nanossegundos.
// ES: Tiempo efectivo de acceso: la TLB siempre se consulta. En un acierto sigue un acceso a
//     memoria. En un fallo se lee primero la tabla de páginas, un acceso a memoria por nivel. El
//     promedio se pondera por la tasa de aciertos. Los fallos de página quedan fuera: cuestan
//     milisegundos, no nanosegundos.
export function effectiveAccessTime(hitRatio: number, memoryNs: number, tlbNs: number, levels = 1): number {
	const hit = tlbNs + memoryNs;
	const miss = tlbNs + levels * memoryNs + memoryNs;
	return hitRatio * hit + (1 - hitRatio) * miss;
}
