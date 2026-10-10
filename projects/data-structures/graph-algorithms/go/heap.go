package graphs

// minHeap is a binary min-heap stored in a slice.
//
// EN: Dijkstra, Prim and the topological sort all need "give me the smallest pending item"
// many times. A binary heap answers in O(log n): the smallest item is always at index 0, and
// the children of index i live at 2i + 1 and 2i + 2.
// PT: Dijkstra, Prim e a ordenação topológica precisam de "me dê o menor item pendente" muitas
// vezes. Um heap binário responde em O(log n): o menor item está sempre no índice 0, e os
// filhos do índice i ficam em 2i + 1 e 2i + 2.
// ES: Dijkstra, Prim y el ordenamiento topológico necesitan "dame el menor elemento pendiente"
// muchas veces. Un heap binario responde en O(log n): el menor elemento está siempre en el
// índice 0, y los hijos del índice i quedan en 2i + 1 y 2i + 2.
type minHeap[T any] struct {
	items []T
	less  func(a, b T) bool
}

func newMinHeap[T any](less func(a, b T) bool) *minHeap[T] {
	return &minHeap[T]{less: less}
}

func (h *minHeap[T]) empty() bool { return len(h.items) == 0 }

// push appends the item and lets it climb while it is smaller than its parent.
func (h *minHeap[T]) push(item T) {
	h.items = append(h.items, item)
	for i := len(h.items) - 1; i > 0; {
		parent := (i - 1) / 2
		if !h.less(h.items[i], h.items[parent]) {
			break
		}
		h.items[i], h.items[parent] = h.items[parent], h.items[i]
		i = parent
	}
}

// pop removes the smallest item: the last one takes the root and sinks to its place.
func (h *minHeap[T]) pop() T {
	top := h.items[0]
	last := len(h.items) - 1
	h.items[0] = h.items[last]
	h.items = h.items[:last]
	for i := 0; ; {
		smallest := i
		for child := 2*i + 1; child <= 2*i+2 && child < last; child++ {
			if h.less(h.items[child], h.items[smallest]) {
				smallest = child
			}
		}
		if smallest == i {
			return top
		}
		h.items[i], h.items[smallest] = h.items[smallest], h.items[i]
		i = smallest
	}
}
