package philosophers;

import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;

/**
 * Seats five philosophers and prints who ate.
 *
 * <pre>
 * philosophers-java                 runs the three strategies for 3 seconds each
 * philosophers-java naive --hold    freezes the naive table and stays alive for 60 seconds,
 *                                   so that jstack can take a thread dump of the deadlock
 * </pre>
 */
public final class Demo {
  private static final int SEATS = 5;

  private Demo() {}

  public static void main(String[] args) throws InterruptedException {
    if (args.length > 0) {
      Table.Strategy strategy;
      try {
        strategy = Table.Strategy.valueOf(args[0].toUpperCase(Locale.ROOT));
      } catch (IllegalArgumentException e) {
        System.err.println("unknown strategy: " + args[0] + " (use naive, ordered or waiter)");
        System.exit(2);
        return;
      }
      Table.Result result =
          Table.run(strategy, SEATS, Duration.ofSeconds(10), Duration.ofMillis(500));
      System.out.printf(
          "%s: deadlocked=%b threadsInCycle=%d meals=%s%n",
          args[0], result.deadlocked(), result.threadsInCycle(), Arrays.toString(result.meals()));
      if (result.deadlocked() && args.length > 1 && args[1].equals("--hold")) {
        Thread.sleep(Duration.ofSeconds(60));
      }
      return;
    }
    System.out.printf("%-8s %-10s %s%n", "strategy", "deadlock", "meals per philosopher");
    for (Table.Strategy strategy : Table.Strategy.values()) {
      Table.Result result =
          Table.run(strategy, SEATS, Duration.ofSeconds(3), Duration.ofMillis(500));
      System.out.printf(
          "%-8s %-10b %s%n",
          strategy.name().toLowerCase(Locale.ROOT),
          result.deadlocked(),
          Arrays.toString(result.meals()));
    }
  }
}
