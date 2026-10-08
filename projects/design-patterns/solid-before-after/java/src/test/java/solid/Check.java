package solid;

import java.util.Objects;

// EN: A test harness in thirty lines, so the project has no dependency at all: compare two
//     values, expect an exception, count the results. `finish` gives the process its exit code.
// PT: Um arcabouço de testes em trinta linhas, para que o projeto não tenha dependência
//     nenhuma: comparar dois valores, esperar uma exceção, contar os resultados. `finish` dá ao
//     processo o seu código de saída.
final class Check {
  private static int passed;
  private static int failed;

  private Check() {}

  static void equal(String name, Object expected, Object actual) {
    if (Objects.equals(expected, actual)) {
      passed++;
      System.out.println("(pass) " + name);
    } else {
      failed++;
      System.out.println("(fail) " + name);
      System.out.println("  expected: " + expected);
      System.out.println("  actual:   " + actual);
    }
  }

  static void fails(String name, String message, Runnable action) {
    try {
      action.run();
    } catch (RuntimeException error) {
      equal(name, message, error.getMessage());
      return;
    }
    equal(name, "an exception saying: " + message, "no exception");
  }

  static int finish() {
    System.out.println();
    System.out.println(passed + " pass, " + failed + " fail");
    return failed == 0 ? 0 : 1;
  }
}
