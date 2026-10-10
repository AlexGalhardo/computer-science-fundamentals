import { bubbleSort } from "./bubble";
import { heapSort } from "./heap";
import { insertionSort } from "./insertion";
import { mergeSort } from "./merge";
import { quickSort } from "./quick";
import { radixSort } from "./radix";

export type SortFunction = (input: readonly number[]) => number[];

// EN: Every algorithm has the same shape: a pure function that receives the input and returns
//     a new sorted array, never touching the original. The benchmark and the tests look the
//     functions up by name here, so adding an algorithm is one line.
// PT: Todo algoritmo tem o mesmo formato: uma função pura que recebe a entrada e devolve um
//     novo vetor ordenado, sem tocar no original. O benchmark e os testes buscam as funções
//     pelo nome aqui, então acrescentar um algoritmo é uma linha.
// ES: Todo algoritmo tiene el mismo formato: una función pura que recibe la entrada y devuelve un
//     nuevo arreglo ordenado, sin tocar el original. El benchmark y las pruebas buscan las funciones
//     por nombre aquí, así que añadir un algoritmo es una línea.
export const SORTS: Readonly<Record<string, SortFunction>> = {
	bubble: bubbleSort,
	insertion: insertionSort,
	merge: mergeSort,
	quick: quickSort,
	heap: heapSort,
	radix: radixSort,
};
