package counterrace;

/** Plain test program with no test framework: it throws on the first failure. */
public final class CounterRaceTest {
  private static final int WORKERS = 8;
  private static final int PER_WORKER = 125_000;
  private static final long EXPECTED = (long) WORKERS * PER_WORKER; // 1,000,000

  private CounterRaceTest() {}

  // EN: A race is a matter of probability, so one run proves nothing. The experiment is repeated
  //     10 times and the bug must show in at least 9 of them.
  // PT: Uma corrida é questão de probabilidade, então uma execução não prova nada. O experimento
  //     é repetido 10 vezes e o bug precisa aparecer em pelo menos 9 delas.
  private static void buggyCounterLosesUpdates() throws InterruptedException {
    int lostRuns = 0;
    for (int run = 1; run <= 10; run++) {
      long total = CounterRace.run(new BuggyCounter(), WORKERS, PER_WORKER);
      System.out.printf("run %d: final=%d lost=%d%n", run, total, EXPECTED - total);
      if (total > EXPECTED) {
        throw new AssertionError("no interleaving explains a value above the target");
      }
      if (total < EXPECTED) {
        lostRuns++;
      }
    }
    System.out.printf("buggy counter lost updates in %d of 10 runs%n", lostRuns);
    if (lostRuns < 9) {
      throw new AssertionError("lost updates in only " + lostRuns + " of 10 runs");
    }
  }

  // EN: A fix is only a fix if it is right every time: 100 runs in a row, each exactly 1,000,000.
  // PT: Uma correção só é correção se acerta sempre: 100 execuções seguidas, cada uma com
  //     exatamente 1.000.000.
  private static void fixedCountersAreExact(int runs) throws InterruptedException {
    for (String variant : CounterRace.VARIANTS.subList(1, CounterRace.VARIANTS.size())) {
      for (int run = 1; run <= runs; run++) {
        Counter counter = CounterRace.create(variant);
        long total = CounterRace.run(counter, WORKERS, PER_WORKER);
        counter.close();
        if (total != EXPECTED) {
          throw new AssertionError(variant + ", run " + run + ": final=" + total);
        }
      }
      System.out.printf("%s: %d of %d runs reached exactly %d%n", variant, runs, runs, EXPECTED);
    }
  }

  public static void main(String[] args) throws InterruptedException {
    String runs = System.getenv("FIXED_RUNS");
    buggyCounterLosesUpdates();
    fixedCountersAreExact(runs == null ? 100 : Integer.parseInt(runs));
    System.out.println("2 tests passed");
  }
}
