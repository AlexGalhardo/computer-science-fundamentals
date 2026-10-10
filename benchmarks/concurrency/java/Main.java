// EN: Concurrency workload in Java: n threads wait at a gate, the gate opens, each one puts
//     its number in a queue, and the sum is the checksum.
//     Java model: virtual threads (final since JDK 21). A virtual thread is a normal Thread
//     for the programmer, but the JVM, not the kernel, schedules it: when it blocks, its stack
//     is moved to the heap and the carrier (platform) thread runs another virtual thread. The
//     carriers are a small ForkJoinPool, one per core. Blocking code stays simple and still
//     scales to many thousands of threads.
// PT: Carga de concorrência em Java: n threads esperam em um portão, o portão abre, cada uma
//     põe seu número em uma fila, e a soma é o checksum.
//     Modelo do Java: virtual threads (finais desde o JDK 21). Uma virtual thread é uma Thread
//     normal para quem programa, mas quem a escalona é a JVM, não o kernel: quando ela
//     bloqueia, sua pilha vai para o heap e a thread carregadora (de plataforma) roda outra
//     virtual thread. As carregadoras são um ForkJoinPool pequeno, uma por núcleo. O código
//     bloqueante continua simples e ainda escala para muitos milhares de threads.
// ES: Carga de concurrencia en Java: n threads esperan en una compuerta, la compuerta se abre, cada uno
//     pone su número en una cola, y la suma es el checksum.
//     Modelo de Java: threads virtuales (finales desde JDK 21). Un thread virtual es un Thread
//     normal para quien programa, pero quien lo planifica es la JVM, no el kernel: cuando
//     se bloquea, su stack pasa al heap y el thread portador (de plataforma) ejecuta otro
//     thread virtual. Los portadores son un ForkJoinPool pequeño, uno por núcleo. El código
//     bloqueante sigue siendo simple y aun así escala a muchos miles de threads.

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;

public final class Main {
  private Main() {}

  private static long run(int n) throws InterruptedException {
    CountDownLatch gate = new CountDownLatch(1);
    LinkedBlockingQueue<Integer> mailbox = new LinkedBlockingQueue<>();

    for (int i = 0; i < n; i++) {
      int id = i;
      Thread.startVirtualThread(
          () -> {
            try {
              // EN: await() blocks the virtual thread only. Its carrier thread is released.
              // PT: O await() bloqueia só a virtual thread. A thread carregadora é liberada.
              // ES: await() bloquea solo el thread virtual. El thread portador queda libre.
              gate.await();
              mailbox.put(id);
            } catch (InterruptedException e) {
              Thread.currentThread().interrupt();
            }
          });
    }
    gate.countDown();

    long sum = 0;
    for (int i = 0; i < n; i++) {
      sum += mailbox.take();
    }
    return sum;
  }

  private static long peakMemoryKb() {
    try {
      for (String line : Files.readAllLines(Path.of("/proc/self/status"))) {
        if (line.startsWith("VmHWM:")) {
          return Long.parseLong(line.replaceAll("[^0-9]", ""));
        }
      }
    } catch (IOException e) {
      // EN: Not on Linux: report zero instead of failing the run.
      // PT: Fora do Linux: informa zero em vez de derrubar a execução.
      // ES: Fuera de Linux: informa cero en lugar de tumbar la ejecución.
    }
    return 0;
  }

  public static void main(String[] args) throws InterruptedException {
    String implementation = args.length > 0 ? args[0] : "virtual-threads";
    int n = args.length > 1 ? Integer.parseInt(args[1]) : 1000;

    long start = System.nanoTime();
    long sum = run(n);
    double elapsedMs = (System.nanoTime() - start) / 1e6;

    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"java\",\"implementation\":\"%s\",\"checksum\":\"%d\"}",
            n, elapsedMs, peakMemoryKb(), implementation, sum));
  }
}
