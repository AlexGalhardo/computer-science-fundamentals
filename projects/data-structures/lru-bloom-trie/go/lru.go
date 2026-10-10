// Package structures is the Go implementation of the lru-bloom-trie mini-project: an LRU
// cache, a Bloom filter and a trie.
package structures

import "errors"

// ErrInvalidCapacity is returned when a cache is created with a capacity below one.
var ErrInvalidCapacity = errors.New("the capacity must be a positive integer")

type lruNode[K comparable, V any] struct {
	key      K
	value    V
	previous *lruNode[K, V]
	next     *lruNode[K, V]
}

// LRU is a cache with a fixed capacity that evicts the least recently used entry.
//
// EN: Two structures work together so that Get and Put are O(1): a hash map answers "where is
// the node of this key?", and a doubly linked list ordered by use answers "which entry is the
// oldest?".
// PT: Duas estruturas trabalham juntas para Get e Put serem O(1): um mapa de espalhamento
// responde "onde está o nó desta chave?", e uma lista duplamente encadeada, ordenada por uso,
// responde "qual é a entrada mais antiga?".
// ES: Dos estructuras trabajan juntas para que Get y Put sean O(1): un mapa de dispersión
// responde "¿dónde está el nodo de esta clave?", y una lista doblemente enlazada, ordenada por
// uso, responde "¿cuál es la entrada más antigua?".
type LRU[K comparable, V any] struct {
	capacity int
	nodes    map[K]*lruNode[K, V]
	// EN: The sentinel is a node with no data that closes the list into a ring. The most
	// recent entry is sentinel.next and the oldest is sentinel.previous. Because every real
	// node always has two neighbours, linking and unlinking need no "is it the first?" or "is
	// it the last?" test.
	// PT: O sentinela é um nó sem dado que fecha a lista em um anel. A entrada mais recente é
	// sentinel.next e a mais antiga é sentinel.previous. Como todo nó de verdade sempre tem
	// dois vizinhos, ligar e desligar não precisam de teste de "é o primeiro?" nem de "é o
	// último?".
	// ES: El centinela es un nodo sin dato que cierra la lista en un anillo. La entrada más reciente
	// es sentinel.next y la más antigua es sentinel.previous. Como todo nodo de verdad siempre tiene
	// dos vecinos, enlazar y desenlazar no necesitan una prueba de "¿es el primero?" ni de "¿es el
	// último?".
	sentinel *lruNode[K, V]
}

// NewLRU creates an empty cache.
func NewLRU[K comparable, V any](capacity int) (*LRU[K, V], error) {
	if capacity < 1 {
		return nil, ErrInvalidCapacity
	}
	sentinel := &lruNode[K, V]{}
	sentinel.previous = sentinel
	sentinel.next = sentinel
	return &LRU[K, V]{capacity: capacity, nodes: make(map[K]*lruNode[K, V], capacity), sentinel: sentinel}, nil
}

// Len returns the number of entries.
func (c *LRU[K, V]) Len() int { return len(c.nodes) }

// Get returns the value of key and marks it as the most recently used.
//
// EN: Reading counts as use, so the node moves to the front. The list has to be doubly linked
// for this: unlinking a node reached through the map needs its predecessor, and only a
// previous pointer gives it in O(1).
// PT: Ler conta como uso, então o nó vai para a frente. É por isso que a lista precisa ser
// duplamente encadeada: desligar um nó alcançado pelo mapa exige o anterior dele, e só um
// ponteiro previous entrega isso em O(1).
// ES: Leer cuenta como uso, así que el nodo pasa al frente. Por eso la lista debe ser
// doblemente enlazada: desenlazar un nodo alcanzado por el mapa exige su anterior, y solo un
// puntero previous entrega eso en O(1).
func (c *LRU[K, V]) Get(key K) (V, bool) {
	node, found := c.nodes[key]
	if !found {
		var zero V
		return zero, false
	}
	c.unlink(node)
	c.linkAtFront(node)
	return node.value, true
}

// Put stores the value and returns the key that was evicted to make room, if any.
func (c *LRU[K, V]) Put(key K, value V) (evicted K, wasEvicted bool) {
	if node, found := c.nodes[key]; found {
		node.value = value
		c.unlink(node)
		c.linkAtFront(node)
		return evicted, false
	}
	if len(c.nodes) == c.capacity {
		oldest := c.sentinel.previous
		c.unlink(oldest)
		delete(c.nodes, oldest.key)
		evicted, wasEvicted = oldest.key, true
	}
	node := &lruNode[K, V]{key: key, value: value}
	c.linkAtFront(node)
	c.nodes[key] = node
	return evicted, wasEvicted
}

// Keys lists the keys from the most recently used to the least recently used.
func (c *LRU[K, V]) Keys() []K {
	keys := make([]K, 0, len(c.nodes))
	for node := c.sentinel.next; node != c.sentinel; node = node.next {
		keys = append(keys, node.key)
	}
	return keys
}

func (c *LRU[K, V]) unlink(node *lruNode[K, V]) {
	node.previous.next = node.next
	node.next.previous = node.previous
}

func (c *LRU[K, V]) linkAtFront(node *lruNode[K, V]) {
	node.previous = c.sentinel
	node.next = c.sentinel.next
	c.sentinel.next.previous = node
	c.sentinel.next = node
}
