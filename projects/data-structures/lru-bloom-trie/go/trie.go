package structures

import "slices"

type trieNode struct {
	children map[rune]*trieNode
	// EN: A node can be the end of a word and also the middle of longer ones ("car" inside
	// "card"), so the end of a word is an explicit mark, not "has no children".
	// PT: Um nó pode ser o fim de uma palavra e também o meio de outras mais longas ("car"
	// dentro de "card"), então o fim de palavra é uma marca explícita, não "não tem filhos".
	isWord bool
}

// Trie is a prefix tree of words.
//
// EN: Each edge is one character and each path from the root spells a prefix. Words that start
// the same way share the same first nodes, so finding everything that starts with a prefix
// means walking down the prefix once and collecting the subtree below it. The cost depends on
// the length of the prefix and on the number of answers, not on how many words are stored.
// PT: Cada aresta é um caractere e cada caminho a partir da raiz soletra um prefixo. Palavras
// que começam igual dividem os mesmos primeiros nós, então achar tudo o que começa com um
// prefixo é descer pelo prefixo uma vez e recolher a subárvore abaixo dele. O custo depende do
// tamanho do prefixo e da quantidade de respostas, não de quantas palavras estão guardadas.
type Trie struct {
	root  *trieNode
	count int
}

// NewTrie creates an empty trie.
func NewTrie() *Trie {
	return &Trie{root: &trieNode{children: map[rune]*trieNode{}}}
}

// Len returns the number of stored words.
func (t *Trie) Len() int { return t.count }

// Insert adds the word and reports whether it is new.
func (t *Trie) Insert(word string) bool {
	node := t.root
	for _, character := range word {
		child, found := node.children[character]
		if !found {
			child = &trieNode{children: map[rune]*trieNode{}}
			node.children[character] = child
		}
		node = child
	}
	if node.isWord {
		return false
	}
	node.isWord = true
	t.count++
	return true
}

// Contains reports whether the exact word is stored.
func (t *Trie) Contains(word string) bool {
	node := t.find(word)
	return node != nil && node.isWord
}

// WithPrefix lists every stored word that starts with the prefix, in alphabetical order.
func (t *Trie) WithPrefix(prefix string) []string {
	start := t.find(prefix)
	if start == nil {
		return nil
	}
	var words []string
	collect(start, []rune(prefix), &words)
	return words
}

// EN: Depth-first walk of the subtree. The children are visited in sorted order, so the words
// come out in alphabetical order with no sorting of the result.
// PT: Percurso em profundidade da subárvore. Os filhos são visitados em ordem, então as
// palavras saem em ordem alfabética sem que o resultado precise ser ordenado.
func collect(node *trieNode, text []rune, words *[]string) {
	if node.isWord {
		*words = append(*words, string(text))
	}
	characters := make([]rune, 0, len(node.children))
	for character := range node.children {
		characters = append(characters, character)
	}
	slices.Sort(characters)
	for _, character := range characters {
		collect(node.children[character], append(text, character), words)
	}
}

func (t *Trie) find(text string) *trieNode {
	node := t.root
	for _, character := range text {
		child, found := node.children[character]
		if !found {
			return nil
		}
		node = child
	}
	return node
}
