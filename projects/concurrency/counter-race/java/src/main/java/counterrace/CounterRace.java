package counterrace;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

/** Runs a counter under several threads. */
public final class CounterRace {
  /** Names of the implementations, in teaching order. */
  public static final List<String> VARIANTS = List.of("buggy", "mutex", "atomic", "queue");

  private CounterRace() {}

  public static Counter create(String variant) {
    return switch (variant) {
      case "buggy" -> new BuggyCounter();
      case "mutex" -> new MutexCounter();
      case "atomic" -> new AtomicCounter();
      case "queue" -> QueueCounter.start();
      default -> throw new IllegalArgumentException("unknown variant: " + variant);
    };
  }

  /**
   * Increments {@code perWorker} times from each of {@code workers} threads and returns the final
   * value. The expected result is {@code workers * perWorker}.
   *
   * <p>EN: The latch is a starting gate: every thread waits there and all leave together. Without
   * it the first thread could finish before the last one starts, and the bug would hide.
   *
   * <p>PT: O latch é um portão de largada: cada thread espera ali e todas saem juntas. Sem ele a
   * primeira thread poderia terminar antes de a última começar, e o bug ficaria escondido.
   *
   * <p>ES: El latch es una puerta de salida: cada thread espera ahí y todos salen juntos. Sin él,
   * el primer thread podría terminar antes de que el último empiece, y el bug quedaría escondido.
   */
  public static long run(Counter counter, int workers, int perWorker) throws InterruptedException {
    CountDownLatch gate = new CountDownLatch(1);
    List<Thread> threads = new ArrayList<>();
    for (int i = 0; i < workers; i++) {
      Thread thread =
          new Thread(
              () -> {
                try {
                  gate.await();
                } catch (InterruptedException e) {
                  Thread.currentThread().interrupt();
                  return;
                }
                for (int j = 0; j < perWorker; j++) {
                  counter.inc();
                }
              });
      thread.start();
      threads.add(thread);
    }
    gate.countDown();
    // EN: join() waits for the thread and also guarantees that this thread sees its writes.
    // PT: join() espera a thread e também garante que esta thread enxerga as escritas dela.
    // ES: join() espera al thread y también garantiza que este thread ve las escrituras de aquel.
    for (Thread thread : threads) {
      thread.join();
    }
    return counter.value();
  }
}
