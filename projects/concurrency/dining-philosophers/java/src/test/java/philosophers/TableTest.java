package philosophers;

import java.time.Duration;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/** Plain test program with no test framework: it throws on the first failure. */
public final class TableTest {
  private static final int SEATS = 5;

  private TableTest() {}

  // EN: A deadlock is a matter of timing, so the dinner is repeated 10 times and the naive table
  //     must freeze in at least 9 of them. Two detectors must agree: the timeout (nobody ate for
  //     500 ms) and the JVM, which must find the five philosopher threads in a lock cycle.
  // PT: Deadlock é questão de tempo, então o jantar é repetido 10 vezes e a mesa ingênua precisa
  //     congelar em pelo menos 9 delas. Dois detectores precisam concordar: o tempo limite
  //     (ninguém comeu por 500 ms) e a JVM, que precisa achar as cinco threads de filósofos em
  //     um ciclo de travas.
  // ES: El deadlock es cuestión de tiempo, así que la cena se repite 10 veces y la mesa
  //     ingenua debe congelarse en al menos 9 de ellas. Dos detectores deben coincidir: el tiempo
  //     límite (nadie comió durante 500 ms) y la JVM, que debe encontrar los cinco threads de
  //     filósofos en un ciclo de locks.
  private static void naiveTableDeadlocks() throws InterruptedException {
    int deadlocks = 0;
    for (int run = 1; run <= 10; run++) {
      Table.Result result =
          Table.run(Table.Strategy.NAIVE, SEATS, Duration.ofSeconds(5), Duration.ofMillis(500));
      System.out.printf(
          "run %d: deadlocked=%b threadsInCycle=%d meals=%s%n",
          run, result.deadlocked(), result.threadsInCycle(), Arrays.toString(result.meals()));
      // EN: Frozen threads of earlier runs stay in the JVM, so the cycle count grows by 5.
      // PT: As threads congeladas das execuções anteriores continuam na JVM, então a contagem
      //     do ciclo cresce de 5 em 5.
      // ES: Los threads congelados de ejecuciones anteriores siguen en la JVM, así que la cuenta
      //     del ciclo crece de 5 en 5.
      if (result.deadlocked() && result.threadsInCycle() >= SEATS) {
        deadlocks++;
      }
    }
    System.out.printf("naive table deadlocked in %d of 10 runs%n", deadlocks);
    if (deadlocks < 9) {
      throw new AssertionError("deadlock detected in only " + deadlocks + " of 10 runs");
    }
  }

  // EN: The fixes must survive a long dinner (60 seconds by default) with no freeze, and every
  //     philosopher must have eaten. The counters are the proof. This test runs first, while
  //     the JVM has no frozen threads left by the deadlock test.
  // PT: As correções precisam sobreviver a um jantar longo (60 segundos por padrão) sem
  //     congelar, e todo filósofo precisa ter comido. Os contadores são a prova. Este teste roda
  //     primeiro, enquanto a JVM não tem threads congeladas deixadas pelo teste de deadlock.
  // ES: Las correcciones deben sobrevivir a una cena larga (60 segundos por defecto) sin
  //     congelarse, y todo filósofo debe haber comido. Los contadores son la prueba. Esta prueba se
  //     ejecuta primero, mientras la JVM no tiene threads congelados dejados por la prueba de deadlock.
  private static void fixesRunWithEveryPhilosopherEating(Duration soak) throws Exception {
    try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
      Future<Table.Result> ordered =
          pool.submit(() -> Table.run(Table.Strategy.ORDERED, SEATS, soak, Duration.ofSeconds(2)));
      Future<Table.Result> waiter =
          pool.submit(() -> Table.run(Table.Strategy.WAITER, SEATS, soak, Duration.ofSeconds(2)));
      check("ordered", soak, ordered.get());
      check("waiter", soak, waiter.get());
    }
  }

  private static void check(String name, Duration soak, Table.Result result) {
    System.out.printf(
        "%s: ran %ds, deadlocked=%b meals=%s%n",
        name, soak.toSeconds(), result.deadlocked(), Arrays.toString(result.meals()));
    if (result.deadlocked()) {
      throw new AssertionError(name + " froze");
    }
    if (!result.everyoneAte()) {
      throw new AssertionError(name + ": a philosopher starved");
    }
  }

  private static void orderedTakesTheLowerForkFirst() {
    for (int i = 0; i < SEATS; i++) {
      int[] order = Table.forks(Table.Strategy.ORDERED, i, SEATS);
      if (order[0] >= order[1]) {
        throw new AssertionError("philosopher " + i + " takes the higher fork first");
      }
    }
    int[] last = Table.forks(Table.Strategy.NAIVE, SEATS - 1, SEATS);
    if (last[0] != SEATS - 1 || last[1] != 0) {
      throw new AssertionError("the naive last philosopher must take fork 4, then fork 0");
    }
  }

  public static void main(String[] args) throws Exception {
    String soak = System.getenv("SOAK_SECONDS");
    orderedTakesTheLowerForkFirst();
    fixesRunWithEveryPhilosopherEating(
        Duration.ofSeconds(soak == null ? 60 : Long.parseLong(soak)));
    naiveTableDeadlocks();
    System.out.println("3 tests passed");
  }
}
