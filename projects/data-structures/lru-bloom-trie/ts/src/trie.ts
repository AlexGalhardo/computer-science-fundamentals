// EN: Trie (prefix tree): a tree where each edge is one character and each path from the root
//     spells a prefix. Words that start the same way share the same first nodes, so finding
//     everything that starts with a prefix means walking down the prefix once and collecting
//     the subtree below it. The cost depends on the length of the prefix and on the number of
//     answers, not on how many words are stored.
// PT: Trie (árvore de prefixos): uma árvore em que cada aresta é um caractere e cada caminho a
//     partir da raiz soletra um prefixo. Palavras que começam igual dividem os mesmos primeiros
//     nós, então achar tudo o que começa com um prefixo é descer pelo prefixo uma vez e recolher
//     a subárvore abaixo dele. O custo depende do tamanho do prefixo e da quantidade de
//     respostas, não de quantas palavras estão guardadas.

interface TrieNode {
	children: Map<string, TrieNode>;
	// EN: A node can be the end of a word and also the middle of longer ones ("car" inside
	//     "card"), so the end of a word is an explicit mark, not "has no children".
	// PT: Um nó pode ser o fim de uma palavra e também o meio de outras mais longas ("car"
	//     dentro de "card"), então o fim de palavra é uma marca explícita, não "não tem filhos".
	isWord: boolean;
}

function newNode(): TrieNode {
	return { children: new Map(), isWord: false };
}

export class Trie {
	private readonly root = newNode();
	private count = 0;

	get size(): number {
		return this.count;
	}

	/** Returns true when the word is new. */
	insert(word: string): boolean {
		let node = this.root;
		for (const character of word) {
			let child = node.children.get(character);
			if (child === undefined) {
				child = newNode();
				node.children.set(character, child);
			}
			node = child;
		}
		if (node.isWord) {
			return false;
		}
		node.isWord = true;
		this.count++;
		return true;
	}

	contains(word: string): boolean {
		return this.find(word)?.isWord ?? false;
	}

	/** Every stored word that starts with the prefix, in alphabetical order. */
	withPrefix(prefix: string): string[] {
		const start = this.find(prefix);
		if (start === undefined) {
			return [];
		}
		const words: string[] = [];
		// EN: Depth-first walk with an explicit stack. Children are pushed in reverse
		//     alphabetical order so that they are popped, and therefore listed, in order.
		// PT: Percurso em profundidade com pilha explícita. Os filhos são empilhados em ordem
		//     alfabética invertida para serem desempilhados, e portanto listados, em ordem.
		const stack: [TrieNode, string][] = [[start, prefix]];
		for (let top = stack.pop(); top !== undefined; top = stack.pop()) {
			const [node, text] = top;
			if (node.isWord) {
				words.push(text);
			}
			const characters = [...node.children.keys()].sort().reverse();
			for (const character of characters) {
				const child = node.children.get(character);
				if (child !== undefined) {
					stack.push([child, text + character]);
				}
			}
		}
		return words;
	}

	private find(text: string): TrieNode | undefined {
		let node: TrieNode | undefined = this.root;
		for (const character of text) {
			node = node.children.get(character);
			if (node === undefined) {
				return undefined;
			}
		}
		return node;
	}
}
