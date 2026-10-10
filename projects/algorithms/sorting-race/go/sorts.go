package main

// EN: The six sorting algorithms of the race, in Go. Same algorithms and same decisions as the
//     TypeScript reference in `ts/src/`, where each one is explained in detail. What changes
//     here: Go compiles to machine code and a slice of int32 is a contiguous block of memory,
//     so each step costs a few CPU instructions and the cache is used well.
// PT: Os seis algoritmos de ordenação da corrida, em Go. Mesmos algoritmos e mesmas decisões da
//     referência em TypeScript em `ts/src/`, onde cada um é explicado em detalhe. O que muda
//     aqui: Go compila para código de máquina e um slice de int32 é um bloco contíguo de
//     memória, então cada passo custa poucas instruções de CPU e o cache é bem aproveitado.
// ES: Los seis algoritmos de ordenación de la carrera, en Go. Mismos algoritmos y mismas decisiones
//     que la referencia en TypeScript en `ts/src/`, donde cada uno se explica en detalle. Lo que
//     cambia aquí: Go compila a código de máquina y un slice de int32 es un bloque contiguo de
//     memoria, así que cada paso cuesta pocas instrucciones de CPU y el caché se aprovecha bien.

// SortFunc receives the input and returns a new sorted slice, leaving the input untouched.
type SortFunc func(values []int32) []int32

// Sorts maps the name used on the command line to each algorithm.
var Sorts = map[string]SortFunc{
	"bubble":    BubbleSort,
	"insertion": InsertionSort,
	"merge":     MergeSort,
	"quick":     QuickSort,
	"heap":      HeapSort,
	"radix":     RadixSort,
}

func clone(values []int32) []int32 {
	a := make([]int32, len(values))
	copy(a, values)
	return a
}

// BubbleSort swaps out-of-order neighbours and stops when a pass makes no swap.
func BubbleSort(values []int32) []int32 {
	a := clone(values)
	for end := len(a) - 1; end > 0; end-- {
		swapped := false
		for i := 0; i < end; i++ {
			if a[i] > a[i+1] {
				a[i], a[i+1] = a[i+1], a[i]
				swapped = true
			}
		}
		if !swapped {
			break
		}
	}
	return a
}

// InsertionSort inserts each value into the sorted prefix, shifting larger values right.
func InsertionSort(values []int32) []int32 {
	a := clone(values)
	for i := 1; i < len(a); i++ {
		key := a[i]
		j := i - 1
		for j >= 0 && a[j] > key {
			a[j+1] = a[j]
			j--
		}
		a[j+1] = key
	}
	return a
}

// MergeSort splits in half, sorts each half and merges, reusing one buffer.
func MergeSort(values []int32) []int32 {
	a := clone(values)
	buffer := make([]int32, len(a))
	mergeRange(a, buffer, 0, len(a))
	return a
}

func mergeRange(a, buffer []int32, lo, hi int) {
	if hi-lo < 2 {
		return
	}
	mid := lo + (hi-lo)/2
	mergeRange(a, buffer, lo, mid)
	mergeRange(a, buffer, mid, hi)
	i, j, k := lo, mid, lo
	for i < mid && j < hi {
		// EN: `<=` takes the left value on a tie, which keeps the sort stable.
		// PT: `<=` pega o valor da esquerda no empate, o que mantém a ordenação estável.
		// ES: `<=` toma el valor de la izquierda en el empate, lo que mantiene la ordenación estable.
		if a[i] <= a[j] {
			buffer[k] = a[i]
			i++
		} else {
			buffer[k] = a[j]
			j++
		}
		k++
	}
	k += copy(buffer[k:], a[i:mid])
	copy(buffer[k:], a[j:hi])
	copy(a[lo:hi], buffer[lo:hi])
}

// QuickSort uses a Hoare partition around the median of three.
func QuickSort(values []int32) []int32 {
	a := clone(values)
	quickRange(a, 0, len(a)-1)
	return a
}

func medianOfThree(x, y, z int32) int32 {
	return max(min(x, y), min(max(x, y), z))
}

// EN: Recursing on the smaller side and looping on the larger one keeps the stack at O(log n).
// PT: Fazer a recursão no lado menor e o laço no maior mantém a pilha em O(log n).
// ES: Hacer la recursión sobre el lado menor y el bucle sobre el mayor mantiene la pila en O(log n).
func quickRange(a []int32, lo, hi int) {
	for lo < hi {
		pivot := medianOfThree(a[lo], a[lo+(hi-lo)/2], a[hi])
		i, j := lo, hi
		for i <= j {
			for a[i] < pivot {
				i++
			}
			for a[j] > pivot {
				j--
			}
			if i <= j {
				a[i], a[j] = a[j], a[i]
				i++
				j--
			}
		}
		if j-lo < hi-i {
			quickRange(a, lo, j)
			lo = i
		} else {
			quickRange(a, i, hi)
			hi = j
		}
	}
}

// HeapSort builds a max-heap inside the slice and moves the maximum to the end n-1 times.
func HeapSort(values []int32) []int32 {
	a := clone(values)
	n := len(a)
	for i := n/2 - 1; i >= 0; i-- {
		siftDown(a, i, n)
	}
	for end := n - 1; end > 0; end-- {
		a[0], a[end] = a[end], a[0]
		siftDown(a, 0, end)
	}
	return a
}

func siftDown(a []int32, start, size int) {
	value := a[start]
	i := start
	for {
		child := 2*i + 1
		if child >= size {
			break
		}
		if child+1 < size && a[child+1] > a[child] {
			child++
		}
		if a[child] <= value {
			break
		}
		a[i] = a[child]
		i = child
	}
	a[i] = value
}

// RadixSort is an LSD radix sort in base 256, valid for integers from 0 to 2^31 - 1.
//
// EN: Four stable counting passes, one per byte of the key, and no comparison between values.
// PT: Quatro passadas estáveis de contagem, uma por byte da chave, sem comparar valores.
// ES: Cuatro pasadas estables de conteo, una por byte de la clave, sin comparar valores.
func RadixSort(values []int32) []int32 {
	source := clone(values)
	target := make([]int32, len(source))
	for shift := 0; shift < 32; shift += 8 {
		var count [256]int
		for _, value := range source {
			count[(value>>shift)&255]++
		}
		for digit := 1; digit < 256; digit++ {
			count[digit] += count[digit-1]
		}
		for i := len(source) - 1; i >= 0; i-- {
			digit := (source[i] >> shift) & 255
			count[digit]--
			target[count[digit]] = source[i]
		}
		source, target = target, source
	}
	return source
}
