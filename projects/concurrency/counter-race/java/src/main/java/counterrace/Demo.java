package counterrace;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

/**
 * Demo: runs one counter variant and prints one JSON line (the benchmark contract of the
 * repository). With no arguments it runs every variant and prints a small table.
 */
public final class Demo {
  // EN: 8 workers by default. The benchmark sets WORKERS to 1, 2, 4 and 8 to show how each fix
  //     scales.
  // PT: 8 workers por padrão. O benchmark define WORKERS como 1, 2, 4 e 8 para mostrar como cada
  //     correção escala.
  private static final int WORKERS =
      Math.max(1, Integer.parseInt(System.getenv().getOrDefault("WORKERS", "8")));

  private Demo() {}

  private record Measurement(long total, double elapsedMs) {}

  private static Measurement measure(String variant, int n) throws InterruptedException {
    Counter counter = CounterRace.create(variant);
    long start = System.nanoTime();
    long total = CounterRace.run(counter, WORKERS, n / WORKERS);
    double elapsedMs = (System.nanoTime() - start) / 1_000_000.0;
    counter.close();
    return new Measurement(total, elapsedMs);
  }

  /** Peak resident memory of this process, read from Linux. */
  private static long peakMemoryKb() {
    try {
      for (String line : Files.readAllLines(Path.of("/proc/self/status"))) {
        if (line.startsWith("VmHWM:")) {
          return Long.parseLong(line.replaceAll("[^0-9]", ""));
        }
      }
    } catch (IOException e) {
      // Not on Linux: the contract still needs a number.
    }
    return 0;
  }

  public static void main(String[] args) throws InterruptedException {
    if (args.length == 0) {
      int n = 1_000_000;
      System.out.printf("%-8s %10s %10s %10s%n", "variant", "final", "lost", "ms");
      for (String variant : CounterRace.VARIANTS) {
        Measurement m = measure(variant, n);
        System.out.printf(
            Locale.ROOT,
            "%-8s %10d %10d %10.1f%n",
            variant,
            m.total(),
            n - m.total(),
            m.elapsedMs());
      }
      return;
    }
    String variant = args[0];
    int n = 1_000_000;
    try {
      if (args.length > 1) {
        n = Integer.parseInt(args[1]);
      }
      if (n < WORKERS || !CounterRace.VARIANTS.contains(variant)) {
        throw new IllegalArgumentException();
      }
    } catch (IllegalArgumentException e) {
      System.err.println(
          "usage: counter-race-java <" + String.join("|", CounterRace.VARIANTS) + "> <n>");
      System.exit(2);
    }
    Measurement m = measure(variant, n);
    // EN: The checksum is the final value. For a correct counter it equals n.
    // PT: O checksum é o valor final. Em um contador correto ele é igual a n.
    System.out.printf(
        Locale.ROOT,
        "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"java\","
            + "\"implementation\":\"%s\",\"checksum\":\"%d\"}%n",
        n,
        m.elapsedMs(),
        peakMemoryKb(),
        variant,
        m.total());
  }
}
