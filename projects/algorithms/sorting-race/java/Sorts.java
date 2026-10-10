import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.UnaryOperator;

// EN: The six sorting algorithms of the race, in Java. Same algorithms and same decisions as the
//     TypeScript reference in `ts/src/`, where each one is explained in detail. What changes
//     here: int[] is a contiguous block of primitives, and the JVM starts by interpreting the
//     bytecode and compiles the hot loops while the program runs, so small inputs pay for the
//     warm-up and large inputs run close to native speed.
// PT: Os seis algoritmos de ordenação da corrida, em Java. Mesmos algoritmos e mesmas decisões da
//     referência em TypeScript em `ts/src/`, onde cada um é explicado em detalhe. O que muda
//     aqui: int[] é um bloco contíguo de primitivos, e a JVM começa interpretando o bytecode e
//     compila os laços quentes enquanto o programa roda, então entradas pequenas pagam o
//     aquecimento e entradas grandes rodam perto da velocidade nativa.
// ES: Los seis algoritmos de ordenación de la carrera, en Java. Mismos algoritmos y mismas
//     decisiones que la referencia en TypeScript en `ts/src/`, donde cada uno se explica en
//     detalle. Lo que cambia aquí: int[] es un bloque contiguo de primitivos, y la JVM empieza
//     interpretando el bytecode y compila los bucles calientes mientras el programa corre, así
//     que las entradas pequeñas pagan el calentamiento y las grandes corren cerca de la
//     velocidad nativa.
public final class Sorts {
  private Sorts() {}

  /** Every sort returns a new sorted array and leaves its argument untouched. */
  public static Map<String, UnaryOperator<int[]>> all() {
    Map<String, UnaryOperator<int[]>> sorts = new LinkedHashMap<>();
    sorts.put("bubble", Sorts::bubbleSort);
    sorts.put("insertion", Sorts::insertionSort);
    sorts.put("merge", Sorts::mergeSort);
    sorts.put("quick", Sorts::quickSort);
    sorts.put("heap", Sorts::heapSort);
    sorts.put("radix", Sorts::radixSort);
    return sorts;
  }

  // EN: Swap out-of-order neighbours. Stop when a pass makes no swap.
  // PT: Troca vizinhos fora de ordem. Para quando uma passada não faz trocas.
  // ES: Intercambia vecinos desordenados. Se detiene cuando una pasada no hace intercambios.
  public static int[] bubbleSort(int[] values) {
    int[] a = values.clone();
    for (int end = a.length - 1; end > 0; end--) {
      boolean swapped = false;
      for (int i = 0; i < end; i++) {
        if (a[i] > a[i + 1]) {
          swap(a, i, i + 1);
          swapped = true;
        }
      }
      if (!swapped) {
        break;
      }
    }
    return a;
  }

  // EN: Insert each value into the sorted prefix, shifting the larger values right.
  // PT: Insere cada valor no prefixo ordenado, deslocando os maiores para a direita.
  // ES: Inserta cada valor en el prefijo ordenado, desplazando los mayores hacia la derecha.
  public static int[] insertionSort(int[] values) {
    int[] a = values.clone();
    for (int i = 1; i < a.length; i++) {
      int key = a[i];
      int j = i - 1;
      while (j >= 0 && a[j] > key) {
        a[j + 1] = a[j];
        j--;
      }
      a[j + 1] = key;
    }
    return a;
  }

  // EN: Split in half, sort each half, merge. One buffer is reused by every merge.
  // PT: Divide ao meio, ordena cada metade, intercala. Um buffer é reusado em toda intercalação.
  // ES: Divide a la mitad, ordena cada mitad, mezcla. Un búfer se reutiliza en cada mezcla.
  public static int[] mergeSort(int[] values) {
    int[] a = values.clone();
    mergeRange(a, new int[a.length], 0, a.length);
    return a;
  }

  private static void mergeRange(int[] a, int[] buffer, int lo, int hi) {
    if (hi - lo < 2) {
      return;
    }
    int mid = lo + (hi - lo) / 2;
    mergeRange(a, buffer, lo, mid);
    mergeRange(a, buffer, mid, hi);
    int i = lo;
    int j = mid;
    for (int k = lo; k < hi; k++) {
      // EN: `<=` takes the left value on a tie, which keeps the sort stable.
      // PT: `<=` pega o valor da esquerda no empate, o que mantém a ordenação estável.
      // ES: `<=` toma el valor de la izquierda en el empate, lo que mantiene la ordenación
      //     estable.
      if (j >= hi || (i < mid && a[i] <= a[j])) {
        buffer[k] = a[i++];
      } else {
        buffer[k] = a[j++];
      }
    }
    System.arraycopy(buffer, lo, a, lo, hi - lo);
  }

  // EN: Hoare partition around the median of three. Recursing on the smaller side and looping on
  //     the larger one keeps the stack at O(log n).
  // PT: Partição de Hoare em torno da mediana de três. Fazer a recursão no lado menor e o laço no
  //     maior mantém a pilha em O(log n).
  // ES: Partición de Hoare alrededor de la mediana de tres. Hacer la recursión sobre el lado menor
  //     y el bucle sobre el mayor mantiene la pila en O(log n).
  public static int[] quickSort(int[] values) {
    int[] a = values.clone();
    quickRange(a, 0, a.length - 1);
    return a;
  }

  private static void quickRange(int[] a, int from, int to) {
    int lo = from;
    int hi = to;
    while (lo < hi) {
      int x = a[lo];
      int y = a[lo + (hi - lo) / 2];
      int z = a[hi];
      int pivot = Math.max(Math.min(x, y), Math.min(Math.max(x, y), z));
      int i = lo;
      int j = hi;
      while (i <= j) {
        while (a[i] < pivot) {
          i++;
        }
        while (a[j] > pivot) {
          j--;
        }
        if (i <= j) {
          swap(a, i, j);
          i++;
          j--;
        }
      }
      if (j - lo < hi - i) {
        quickRange(a, lo, j);
        lo = i;
      } else {
        quickRange(a, i, hi);
        hi = j;
      }
    }
  }

  // EN: Build a max-heap inside the array, then move the maximum to the end n - 1 times.
  // PT: Constrói um max-heap dentro do vetor e move o máximo para o fim n - 1 vezes.
  // ES: Construye un max-heap dentro del arreglo y mueve el máximo al final n - 1 veces.
  public static int[] heapSort(int[] values) {
    int[] a = values.clone();
    int n = a.length;
    for (int i = n / 2 - 1; i >= 0; i--) {
      siftDown(a, i, n);
    }
    for (int end = n - 1; end > 0; end--) {
      swap(a, 0, end);
      siftDown(a, 0, end);
    }
    return a;
  }

  private static void siftDown(int[] a, int start, int size) {
    int value = a[start];
    int i = start;
    while (true) {
      int child = 2 * i + 1;
      if (child >= size) {
        break;
      }
      if (child + 1 < size && a[child + 1] > a[child]) {
        child++;
      }
      if (a[child] <= value) {
        break;
      }
      a[i] = a[child];
      i = child;
    }
    a[i] = value;
  }

  // EN: LSD radix sort in base 256: four stable counting passes, one per byte of the key, with
  //     no comparison between values. Valid for integers from 0 to 2^31 - 1.
  // PT: Radix sort LSD na base 256: quatro passadas estáveis de contagem, uma por byte da chave,
  //     sem comparar valores. Válido para inteiros de 0 a 2^31 - 1.
  // ES: Radix sort LSD en base 256: cuatro pasadas estables de conteo, una por byte de la clave,
  //     sin comparar valores. Válido para enteros de 0 a 2^31 - 1.
  public static int[] radixSort(int[] values) {
    int[] source = values.clone();
    int[] target = new int[source.length];
    for (int shift = 0; shift < 32; shift += 8) {
      int[] count = new int[256];
      for (int value : source) {
        count[(value >>> shift) & 255]++;
      }
      for (int digit = 1; digit < 256; digit++) {
        count[digit] += count[digit - 1];
      }
      for (int i = source.length - 1; i >= 0; i--) {
        int digit = (source[i] >>> shift) & 255;
        target[--count[digit]] = source[i];
      }
      int[] swap = source;
      source = target;
      target = swap;
    }
    return source;
  }

  // EN: Same order-sensitive digest in every language: h = (h * 31 + v) mod 1,000,000,007.
  // PT: Mesmo resumo sensível à ordem em toda linguagem: h = (h * 31 + v) mod 1.000.000.007.
  // ES: El mismo resumen sensible al orden en todo lenguaje: h = (h * 31 + v) mod 1.000.000.007.
  public static String checksum(int[] values) {
    long digest = 0;
    for (int value : values) {
      digest = (digest * 31 + value) % 1_000_000_007L;
    }
    return Long.toString(digest);
  }

  private static void swap(int[] a, int i, int j) {
    int tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
}
