// EN: Hash map from scratch: separate chaining and open addressing with linear probing.
//     Keys are unsigned 32-bit integers and values are numbers, which keeps the attention on
//     the table and not on how to hash strings or objects.
// PT: Mapa de espalhamento do zero: encadeamento separado e endereçamento aberto com sondagem
//     linear. As chaves são inteiros sem sinal de 32 bits e os valores são números, o que mantém
//     a atenção na tabela e não em como espalhar textos ou objetos.
// ES: Mapa de dispersión desde cero: encadenamiento separado y direccionamiento abierto con sondeo
//     lineal. Las claves son enteros sin signo de 32 bits y los valores son números, lo que mantiene
//     la atención en la tabla y no en cómo dispersar textos u objetos.

export type HashFn = (key: number) => number;

export interface HashMap {
	/** Returns true when the key is new and false when an existing value was replaced. */
	put(key: number, value: number): boolean;
	get(key: number): number | undefined;
	remove(key: number): boolean;
	readonly size: number;
	readonly capacity: number;
	readonly loadFactor: number;
}

// EN: The hash function scrambles the bits of the key so that keys that look alike (1, 2, 3...)
//     land in unrelated positions. This is the 32-bit finaliser of MurmurHash3. `Math.imul`
//     multiplies as 32-bit integers and `>>> 0` turns the result into an unsigned number.
// PT: A função de espalhamento embaralha os bits da chave para que chaves parecidas (1, 2, 3...)
//     caiam em posições sem relação entre si. Este é o finalizador de 32 bits do MurmurHash3.
//     `Math.imul` multiplica como inteiros de 32 bits e `>>> 0` torna o resultado sem sinal.
// ES: La función de dispersión mezcla los bits de la clave para que claves parecidas (1, 2, 3...)
//     caigan en posiciones sin relación entre sí. Este es el finalizador de 32 bits de MurmurHash3.
//     `Math.imul` multiplica como enteros de 32 bits y `>>> 0` vuelve el resultado sin signo.
export function mix32(key: number): number {
	let h = key | 0;
	h ^= h >>> 16;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	h ^= h >>> 16;
	return h >>> 0;
}

interface Node {
	key: number;
	value: number;
	next: Node | undefined;
}

// EN: Separate chaining. The table is an array of buckets and each bucket is a linked list with
//     every entry whose hash points there. A collision only makes one list longer, so the table
//     keeps working at any load factor, it just gets slower as the lists grow.
// PT: Encadeamento separado. A tabela é um vetor de baldes e cada balde é uma lista encadeada
//     com todas as entradas cujo hash aponta para ele. Uma colisão só deixa uma lista mais
//     longa, então a tabela continua funcionando com qualquer fator de carga, apenas fica mais
//     lenta conforme as listas crescem.
// ES: Encadenamiento separado. La tabla es un vector de cubetas y cada cubeta es una lista enlazada
//     con todas las entradas cuyo hash apunta a ella. Una colisión solo deja una lista más
//     larga, así que la tabla sigue funcionando con cualquier factor de carga, solo se vuelve más
//     lenta a medida que las listas crecen.
export class ChainingMap implements HashMap {
	private buckets: (Node | undefined)[];
	private count = 0;

	constructor(
		buckets = 8,
		private readonly maxLoad = 0.75,
		private readonly hash: HashFn = mix32,
	) {
		this.buckets = new Array<Node | undefined>(Math.max(buckets, 1)).fill(undefined);
	}

	private indexOf(key: number): number {
		return this.hash(key) % this.buckets.length;
	}

	put(key: number, value: number): boolean {
		for (let node = this.buckets[this.indexOf(key)]; node !== undefined; node = node.next) {
			if (node.key === key) {
				node.value = value;
				return false;
			}
		}
		// EN: The load factor is elements divided by buckets, which is also the average length
		//     of a list. Growing before it passes the limit keeps the lists short.
		// PT: O fator de carga é elementos dividido por baldes, que também é o tamanho médio de
		//     uma lista. Crescer antes de passar do limite mantém as listas curtas.
		// ES: El factor de carga es elementos dividido por cubetas, que también es el tamaño medio de
		//     una lista. Crecer antes de pasar el límite mantiene las listas cortas.
		if (this.count + 1 > this.maxLoad * this.buckets.length) {
			this.resize(this.buckets.length * 2);
		}
		// EN: The new node goes to the head of the list: O(1), no walk to the end.
		// PT: O nó novo entra no início da lista: O(1), sem caminhar até o fim.
		// ES: El nodo nuevo entra al inicio de la lista: O(1), sin caminar hasta el final.
		const index = this.indexOf(key);
		this.buckets[index] = { key, value, next: this.buckets[index] };
		this.count++;
		return true;
	}

	get(key: number): number | undefined {
		for (let node = this.buckets[this.indexOf(key)]; node !== undefined; node = node.next) {
			if (node.key === key) {
				return node.value;
			}
		}
		return undefined;
	}

	// EN: Unlinking a node means making its predecessor point to its successor. The first node
	//     of a list has no predecessor, so there the bucket itself is what changes.
	// PT: Desligar um nó é fazer o anterior apontar para o sucessor. O primeiro nó de uma lista
	//     não tem anterior, então ali quem muda é o próprio balde.
	// ES: Desenlazar un nodo es hacer que el anterior apunte al sucesor. El primer nodo de una lista
	//     no tiene anterior, así que ahí lo que cambia es la propia cubeta.
	remove(key: number): boolean {
		const index = this.indexOf(key);
		let previous: Node | undefined;
		for (let node = this.buckets[index]; node !== undefined; node = node.next) {
			if (node.key === key) {
				if (previous === undefined) {
					this.buckets[index] = node.next;
				} else {
					previous.next = node.next;
				}
				this.count--;
				return true;
			}
			previous = node;
		}
		return false;
	}

	get size(): number {
		return this.count;
	}

	get capacity(): number {
		return this.buckets.length;
	}

	get loadFactor(): number {
		return this.count / this.buckets.length;
	}

	// EN: Rehashing. The bucket of a key is `hash % capacity`, so a new capacity changes the
	//     bucket of almost every key and all nodes have to be moved. It costs O(n), but doubling
	//     makes it rare enough for insertion to stay O(1) amortised.
	// PT: Rehashing. O balde de uma chave é `hash % capacidade`, então uma capacidade nova muda
	//     o balde de quase todas as chaves e todos os nós precisam ser movidos. Custa O(n), mas
	//     dobrar torna isso raro o bastante para a inserção continuar O(1) amortizado.
	// ES: Rehashing. La cubeta de una clave es `hash % capacidad`, así que una capacidad nueva cambia
	//     la cubeta de casi todas las claves y todos los nodos deben moverse. Cuesta O(n), pero
	//     duplicar lo vuelve lo bastante raro para que la inserción siga siendo O(1) amortizado.
	private resize(newBuckets: number): void {
		const old = this.buckets;
		this.buckets = new Array<Node | undefined>(newBuckets).fill(undefined);
		for (const head of old) {
			let node = head;
			while (node !== undefined) {
				const next = node.next;
				const index = this.indexOf(node.key);
				node.next = this.buckets[index];
				this.buckets[index] = node;
				node = next;
			}
		}
	}
}

const EMPTY = 0;
const FULL = 1;
const TOMBSTONE = 2;

// EN: Open addressing with linear probing. Every entry lives in the arrays themselves. When
//     the slot given by the hash is taken, the next one is tried, then the next, wrapping at
//     the end. A search follows the same sequence and stops at the key or at a slot that was
//     never used. Three parallel typed arrays hold key, value and state of each slot.
// PT: Endereçamento aberto com sondagem linear. Toda entrada mora nos próprios vetores. Quando
//     a posição dada pelo hash está ocupada, tenta-se a seguinte, depois a seguinte, dando a
//     volta no fim. A busca segue a mesma sequência e para na chave ou em uma posição nunca
//     usada. Três vetores tipados paralelos guardam chave, valor e estado de cada posição.
// ES: Direccionamiento abierto con sondeo lineal. Toda entrada vive en los propios vectores. Cuando
//     la posición que da el hash está ocupada, se prueba la siguiente, luego la siguiente, dando la
//     vuelta al final. La búsqueda sigue la misma secuencia y se detiene en la clave o en una
//     posición nunca usada. Tres vectores tipados paralelos guardan clave, valor y estado de cada posición.
export class ProbingMap implements HashMap {
	private keys: Uint32Array;
	private values: Float64Array;
	private states: Uint8Array;
	private count = 0;
	// EN: Full slots plus tombstones. Tombstones still lengthen every probe, so they count
	//     towards the limit.
	// PT: Posições cheias mais lápides. Lápides continuam alongando toda sondagem, então contam
	//     para o limite.
	// ES: Posiciones llenas más lápidas. Las lápidas siguen alargando todo sondeo, así que cuentan
	//     para el límite.
	private used = 0;
	private readonly maxLoad: number;

	constructor(
		capacity = 8,
		maxLoad = 0.5,
		private readonly hash: HashFn = mix32,
	) {
		const slots = Math.max(capacity, 2);
		this.keys = new Uint32Array(slots);
		this.values = new Float64Array(slots);
		this.states = new Uint8Array(slots);
		// EN: At least one slot must stay empty, or a search for a missing key never ends.
		// PT: Ao menos uma posição precisa ficar vazia, senão a busca por uma chave ausente
		//     nunca termina.
		// ES: Al menos una posición debe quedar vacía, o la búsqueda de una clave ausente
		//     nunca termina.
		this.maxLoad = Math.min(maxLoad, 0.99);
	}

	private indexOf(key: number): number {
		return this.hash(key) % this.states.length;
	}

	private find(key: number): number {
		let index = this.indexOf(key);
		while (this.states[index] !== EMPTY) {
			if (this.states[index] === FULL && this.keys[index] === key) {
				return index;
			}
			index = (index + 1) % this.states.length;
		}
		return -1;
	}

	put(key: number, value: number): boolean {
		if (this.used + 1 > this.maxLoad * this.states.length) {
			this.grow();
		}
		let index = this.indexOf(key);
		let firstTombstone = -1;
		while (this.states[index] !== EMPTY) {
			if (this.states[index] === FULL && this.keys[index] === key) {
				this.values[index] = value;
				return false;
			}
			// EN: A tombstone can be reused, but only after the whole probe sequence was
			//     checked: the key may still be stored further ahead.
			// PT: Uma lápide pode ser reaproveitada, mas só depois de conferir a sequência de
			//     sondagem inteira: a chave ainda pode estar guardada mais adiante.
			// ES: Una lápida puede reutilizarse, pero solo después de revisar la secuencia de
			//     sondeo completa: la clave aún puede estar guardada más adelante.
			if (this.states[index] === TOMBSTONE && firstTombstone === -1) {
				firstTombstone = index;
			}
			index = (index + 1) % this.states.length;
		}
		if (firstTombstone === -1) {
			this.used++;
		} else {
			index = firstTombstone;
		}
		this.keys[index] = key;
		this.values[index] = value;
		this.states[index] = FULL;
		this.count++;
		return true;
	}

	get(key: number): number | undefined {
		const index = this.find(key);
		return index === -1 ? undefined : this.values[index];
	}

	// EN: Deletion leaves a tombstone instead of an empty slot. An empty slot means "no key ever
	//     probed past here", so emptying it would hide every colliding key stored after it.
	// PT: A remoção deixa uma lápide em vez de uma posição vazia. Posição vazia significa
	//     "nenhuma chave passou por aqui", então esvaziá-la esconderia toda chave que colidiu e
	//     foi guardada depois dela.
	// ES: La eliminación deja una lápida en lugar de una posición vacía. Posición vacía significa
	//     "ninguna clave pasó por aquí", así que vaciarla escondería toda clave que colisionó y
	//     fue guardada después de ella.
	remove(key: number): boolean {
		const index = this.find(key);
		if (index === -1) {
			return false;
		}
		this.states[index] = TOMBSTONE;
		this.count--;
		return true;
	}

	get size(): number {
		return this.count;
	}

	get capacity(): number {
		return this.states.length;
	}

	get tombstones(): number {
		return this.used - this.count;
	}

	get loadFactor(): number {
		return this.count / this.states.length;
	}

	// EN: Rebuilding the table throws every tombstone away. The capacity doubles only when the
	//     live entries alone justify it, otherwise the rebuild is a clean-up at the same size.
	// PT: Reconstruir a tabela joga todas as lápides fora. A capacidade só dobra quando as
	//     entradas vivas sozinhas justificam, senão a reconstrução é uma limpeza no mesmo tamanho.
	// ES: Reconstruir la tabla descarta todas las lápidas. La capacidad solo se duplica cuando las
	//     entradas vivas por sí solas lo justifican, si no la reconstrucción es una limpieza del
	//     mismo tamaño.
	private grow(): void {
		const { keys, values, states } = this;
		const crowded = this.count + 1 > (this.maxLoad * states.length) / 2;
		const slots = crowded ? states.length * 2 : states.length;
		this.keys = new Uint32Array(slots);
		this.values = new Float64Array(slots);
		this.states = new Uint8Array(slots);
		this.count = 0;
		this.used = 0;
		for (let index = 0; index < states.length; index++) {
			if (states[index] === FULL) {
				this.put(keys[index] ?? 0, values[index] ?? 0);
			}
		}
	}
}
