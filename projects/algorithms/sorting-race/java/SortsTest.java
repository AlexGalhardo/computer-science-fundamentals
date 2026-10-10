import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.UnaryOperator;

// EN: Same six cases as the TypeScript reference, for every algorithm. The oracle is
//     Arrays.sort: being equal to it means ordered and a permutation of the input.
// PT: Mesmos seis casos da referência em TypeScript, para todo algoritmo. O oráculo é o
//     Arrays.sort: ser igual a ele significa estar em ordem e ser uma permutação da entrada.
// ES: Los mismos seis casos de la referencia en TypeScript, para todo algoritmo. El oráculo es
//     Arrays.sort: ser igual a él significa estar en orden y ser una permutación de la entrada.
public final class SortsTest {
  private SortsTest() {}

  // EN: Linear congruential generator with a fixed seed, so the test is reproducible.
  // PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
  // ES: Generador congruencial lineal con semilla fija, para que la prueba sea reproducible.
  private static int[] randomValues(int n, long seed) {
    int[] values = new int[n];
    long state = seed;
    for (int i = 0; i < n; i++) {
      state = (state * 1103515245L + 12345L) % (1L << 31);
      values[i] = (int) state;
    }
    return values;
  }

  public static void main(String[] args) {
    Map<String, int[]> cases = new LinkedHashMap<>();
    cases.put("empty", new int[] {});
    cases.put("single element", new int[] {42});
    cases.put("sorted", new int[] {1, 2, 3, 4, 5, 6, 7, 8});
    cases.put("reversed", new int[] {8, 7, 6, 5, 4, 3, 2, 1});
    cases.put(
        "duplicated", new int[] {5, 3, 5, 1, 3, 3, 0, Integer.MAX_VALUE, 5, 0, Integer.MAX_VALUE});
    cases.put("random", randomValues(1000, 7));

    int passed = 0;
    for (Map.Entry<String, UnaryOperator<int[]>> sort : Sorts.all().entrySet()) {
      for (Map.Entry<String, int[]> testCase : cases.entrySet()) {
        int[] input = testCase.getValue();
        int[] before = input.clone();
        int[] expected = input.clone();
        Arrays.sort(expected);
        String label = sort.getKey() + ": " + testCase.getKey();
        if (!Arrays.equals(sort.getValue().apply(input), expected)) {
          throw new AssertionError(label + ": wrong output");
        }
        if (!Arrays.equals(input, before)) {
          throw new AssertionError(label + ": the input was modified");
        }
        passed++;
      }
    }
    if (!Sorts.checksum(new int[] {1, 2, 3}).equals("1026")) {
      throw new AssertionError("checksum of [1, 2, 3] should be 1026");
    }
    passed++;
    System.out.println(passed + " tests passed");
  }
}
