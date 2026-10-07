package philosophers;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLongArray;

/** The dining table: one way to deadlock and two ways to make the deadlock impossible. */
public final class Table {
  /** How a philosopher picks up the two forks. */
  public enum Strategy {
    /** DELIBERATELY WRONG: every philosopher takes the left fork, then the right one. */
    NAIVE,
    /** Always takes the fork with the lower number first. */
    ORDERED,
    /** At most n-1 philosophers may try to eat at the same time. */
    WAITER
  }

  /** A fork is only a lock. The class exists so that thread dumps show a readable name. */
  static final class Fork {
    private final int number;

    Fork(int number) {
      this.number = number;
    }

    @Override
    public String toString() {
      return "fork-" + number;
    }
  }

  /**
   * What happened at the table.
   *
   * @param meals how many times each philosopher ate
   * @param deadlocked true when nobody ate for a whole stall window
   * @param threadsInCycle how many threads the JVM itself found in a lock cycle
   */
  public record Result(long[] meals, boolean deadlocked, int threadsInCycle) {
    public boolean everyoneAte() {
      for (long count : meals) {
        if (count == 0) {
          return false;
        }
      }
      return true;
    }
  }

  // EN: A deadlock needs unlucky timing: all five must hold one fork before anybody gets the
  //     second. This short pause between the two forks makes that timing common, so the bug
  //     shows in milliseconds. The fixes use the same pause and still never deadlock.
  // PT: Um deadlock precisa de azar no tempo: os cinco têm de segurar um garfo antes de alguém
  //     pegar o segundo. Esta pausa curta entre os dois garfos torna esse azar comum, então o
  //     bug aparece em milissegundos. As correções usam a mesma pausa e mesmo assim nunca travam.
  static final long REACH_MILLIS = 1;

  private Table() {}

  /**
   * Returns the two fork numbers of philosopher {@code i}, in the order they are locked.
   *
   * <p>EN: A deadlock needs four conditions at once (Coffman): mutual exclusion (a fork has one
   * holder), hold and wait (hold one fork while waiting for the other), no preemption (nobody takes
   * a fork from your hand) and circular wait (0 waits for 1, 1 for 2 ... 4 for 0). Lock ordering
   * breaks the circular wait: everybody takes the lower number first, so the last philosopher
   * reaches for fork 0 before fork 4 and the circle cannot close.
   *
   * <p>PT: Um deadlock precisa de quatro condições ao mesmo tempo (Coffman): exclusão mútua (um
   * garfo tem um só dono), posse e espera (segurar um garfo enquanto espera o outro), não preempção
   * (ninguém tira o garfo da sua mão) e espera circular (0 espera 1, 1 espera 2 ... 4 espera 0). A
   * ordenação de travas quebra a espera circular: todos pegam primeiro o menor número, então o
   * último filósofo tenta o garfo 0 antes do 4 e o círculo não se fecha.
   */
  static int[] forks(Strategy strategy, int i, int n) {
    int left = i;
    int right = (i + 1) % n;
    if (strategy == Strategy.ORDERED && right < left) {
      return new int[] {right, left};
    }
    return new int[] {left, right};
  }

  /**
   * Seats {@code n} philosophers for the given duration. Returns early, with {@code deadlocked}
   * set, when the total number of meals stops growing for a whole stall window.
   */
  public static Result run(Strategy strategy, int n, Duration duration, Duration stall)
      throws InterruptedException {
    Fork[] table = new Fork[n];
    for (int i = 0; i < n; i++) {
      table[i] = new Fork(i);
    }
    AtomicLongArray meals = new AtomicLongArray(n);
    AtomicBoolean stop = new AtomicBoolean();
    // EN: The waiter is a counting semaphore with n-1 permits. With at most 4 of the 5
    //     philosophers at the table, at least one of them can always get both forks. A circle
    //     of waiting needs all five, so it cannot form.
    // PT: O garçom é um semáforo contador com n-1 permissões. Com no máximo 4 dos 5 filósofos
    //     à mesa, pelo menos um deles sempre consegue os dois garfos. Um círculo de espera
    //     precisa dos cinco, então ele não se forma.
    Semaphore waiter = new Semaphore(n - 1);

    Thread[] philosophers = new Thread[n];
    for (int i = 0; i < n; i++) {
      int seat = i;
      int[] order = forks(strategy, seat, n);
      philosophers[i] =
          new Thread(
              () -> {
                try {
                  while (!stop.get()) {
                    if (strategy == Strategy.WAITER) {
                      waiter.acquire();
                    }
                    synchronized (table[order[0]]) {
                      Thread.sleep(REACH_MILLIS);
                      synchronized (table[order[1]]) {
                        meals.incrementAndGet(seat); // eat
                      }
                    }
                    if (strategy == Strategy.WAITER) {
                      waiter.release();
                    }
                  }
                } catch (InterruptedException e) {
                  Thread.currentThread().interrupt();
                }
              },
              "philosopher-" + i);
      // EN: A thread blocked on `synchronized` cannot be interrupted or cancelled. Daemon
      //     threads at least do not keep the JVM alive after a deadlock.
      // PT: Uma thread bloqueada em `synchronized` não pode ser interrompida nem cancelada.
      //     Threads daemon pelo menos não mantêm a JVM viva depois de um deadlock.
      philosophers[i].setDaemon(true);
    }
    for (Thread philosopher : philosophers) {
      philosopher.start();
    }

    long deadline = System.nanoTime() + duration.toNanos();
    long lastTotal = -1;
    long lastProgress = System.nanoTime();
    while (System.nanoTime() < deadline) {
      Thread.sleep(Math.max(1, stall.toMillis() / 10));
      long total = 0;
      for (int i = 0; i < n; i++) {
        total += meals.get(i);
      }
      if (total != lastTotal) {
        lastTotal = total;
        lastProgress = System.nanoTime();
      } else if (System.nanoTime() - lastProgress >= stall.toNanos()) {
        // EN: The timeout says "no progress". The JVM can say more: it walks the graph of
        //     "thread waits for a lock held by thread" and reports the threads in a cycle.
        // PT: O tempo limite diz "sem progresso". A JVM sabe dizer mais: ela percorre o grafo
        //     "thread espera uma trava que está com outra thread" e informa as threads em ciclo.
        long[] cycle = ManagementFactory.getThreadMXBean().findDeadlockedThreads();
        return new Result(snapshot(meals), true, cycle == null ? 0 : cycle.length);
      }
    }
    stop.set(true);
    for (Thread philosopher : philosophers) {
      philosopher.join();
    }
    return new Result(snapshot(meals), false, 0);
  }

  private static long[] snapshot(AtomicLongArray meals) {
    long[] counts = new long[meals.length()];
    for (int i = 0; i < counts.length; i++) {
      counts[i] = meals.get(i);
    }
    return counts;
  }
}
