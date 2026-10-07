// EN: LRU cache: a cache with a fixed capacity that, when full, throws away the entry that was
//     used longest ago (least recently used). Two structures work together so that `get` and
//     `put` are O(1): a hash map answers "where is the node of this key?", and a doubly linked
//     list ordered by use answers "which entry is the oldest?".
// PT: Cache LRU: uma cache de capacidade fixa que, quando cheia, joga fora a entrada usada há
//     mais tempo (least recently used). Duas estruturas trabalham juntas para `get` e `put`
//     serem O(1): um mapa de espalhamento responde "onde está o nó desta chave?", e uma lista
//     duplamente encadeada, ordenada por uso, responde "qual é a entrada mais antiga?".

interface Node<K, V> {
	key: K;
	value: V;
	previous: Node<K, V> | undefined;
	next: Node<K, V> | undefined;
}

export class LruCache<K, V> {
	private readonly nodes = new Map<K, Node<K, V>>();
	// EN: `newest` is the head of the list and `oldest` is its tail. The node to evict is
	//     always the tail, found without any search.
	// PT: `newest` é o início da lista e `oldest` é o fim. O nó a descartar é sempre o do fim,
	//     achado sem nenhuma busca.
	private newest: Node<K, V> | undefined;
	private oldest: Node<K, V> | undefined;

	constructor(readonly capacity: number) {
		if (!Number.isInteger(capacity) || capacity < 1) {
			throw new RangeError("the capacity must be a positive integer");
		}
	}

	get size(): number {
		return this.nodes.size;
	}

	// EN: Reading counts as use, so the node moves to the front. The list has to be doubly
	//     linked for this: unlinking a node reached through the map needs its predecessor, and
	//     only a `previous` pointer gives it in O(1).
	// PT: Ler conta como uso, então o nó vai para a frente. É por isso que a lista precisa ser
	//     duplamente encadeada: desligar um nó alcançado pelo mapa exige o anterior dele, e só
	//     um ponteiro `previous` entrega isso em O(1).
	get(key: K): V | undefined {
		const node = this.nodes.get(key);
		if (node === undefined) {
			return undefined;
		}
		this.unlink(node);
		this.linkAtFront(node);
		return node.value;
	}

	// EN: Returns the key that was evicted to make room, or undefined when nothing left.
	// PT: Devolve a chave descartada para abrir espaço, ou undefined quando nada saiu.
	put(key: K, value: V): K | undefined {
		const existing = this.nodes.get(key);
		if (existing !== undefined) {
			existing.value = value;
			this.unlink(existing);
			this.linkAtFront(existing);
			return undefined;
		}
		let evicted: K | undefined;
		if (this.nodes.size === this.capacity && this.oldest !== undefined) {
			evicted = this.oldest.key;
			this.nodes.delete(evicted);
			this.unlink(this.oldest);
		}
		const node: Node<K, V> = { key, value, previous: undefined, next: undefined };
		this.linkAtFront(node);
		this.nodes.set(key, node);
		return evicted;
	}

	/** Keys from the most recently used to the least recently used. */
	keys(): K[] {
		const keys: K[] = [];
		for (let node = this.newest; node !== undefined; node = node.next) {
			keys.push(node.key);
		}
		return keys;
	}

	// EN: Unlinking makes the two neighbours point to each other. A missing neighbour means the
	//     node was the head or the tail, and then the corresponding end of the list moves.
	// PT: Desligar faz os dois vizinhos apontarem um para o outro. Um vizinho ausente significa
	//     que o nó era o início ou o fim, e então a ponta correspondente da lista é que muda.
	private unlink(node: Node<K, V>): void {
		if (node.previous === undefined) {
			this.newest = node.next;
		} else {
			node.previous.next = node.next;
		}
		if (node.next === undefined) {
			this.oldest = node.previous;
		} else {
			node.next.previous = node.previous;
		}
		node.previous = undefined;
		node.next = undefined;
	}

	private linkAtFront(node: Node<K, V>): void {
		node.next = this.newest;
		if (this.newest === undefined) {
			this.oldest = node;
		} else {
			this.newest.previous = node;
		}
		this.newest = node;
	}
}
