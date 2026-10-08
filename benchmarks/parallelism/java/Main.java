// EN: Parallelism workload in Java: count the primes below n, range cut into 256 chunks.
//     Java model: a parallel stream. The stream splits the chunk numbers into tasks and runs
//     them on a ForkJoinPool, a pool of platform (OS) threads with work stealing. Submitting
//     the stream from inside our own pool makes it use that pool, which is how the number of
//     workers is chosen. Virtual threads would not help here: they are for waiting, not for
//     computing.
// PT: Carga de paralelismo em Java: conta os primos abaixo de n, intervalo cortado em 256
//     pedaços. Modelo do Java: um parallel stream. O stream divide os números de pedaço em
//     tarefas e as roda em um ForkJoinPool, um pool de threads de plataforma (do SO) com work
//     stealing. Submeter o stream de dentro do nosso pool faz com que ele use esse pool, e é
//     assim que o número de workers é escolhido. Virtual threads não ajudariam aqui: elas
//     servem para esperar, não para calcular.

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.IntStream;

public final class Main {
  private static final long CHUNKS = 256;

  private Main() {}

  private static boolean isPrime(long k) {
    if (k < 2) {
      return false;
    }
    if (k < 4) {
      return true;
    }
    if (k % 2 == 0) {
      return false;
    }
    for (long d = 3; d * d <= k; d += 2) {
      if (k % d == 0) {
        return false;
      }
    }
    return true;
  }

  // EN: Chunk c covers [c*n/256, (c+1)*n/256).
  // PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
  private static long countChunk(long chunk, long n) {
    long count = 0;
    for (long k = chunk * n / CHUNKS; k < (chunk + 1) * n / CHUNKS; k++) {
      if (isPrime(k)) {
        count++;
      }
    }
    return count;
  }

  private static long countPrimes(long n, int workers)
      throws InterruptedException, ExecutionException {
    try (ForkJoinPool pool = new ForkJoinPool(workers)) {
      return pool.submit(
              () -> IntStream.range(0, (int) CHUNKS).parallel().mapToLong(c -> countChunk(c, n)).sum())
          .get();
    }
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
    }
    return 0;
  }

  public static void main(String[] args) throws InterruptedException, ExecutionException {
    String implementation = args.length > 0 ? args[0] : "primes";
    long n = args.length > 1 ? Long.parseLong(args[1]) : 100000;
    int workers = args.length > 2 ? Integer.parseInt(args[2]) : 1;

    long start = System.nanoTime();
    long total = countPrimes(n, workers);
    double elapsedMs = (System.nanoTime() - start) / 1e6;

    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"java\",\"implementation\":\"%s\",\"checksum\":\"%d\"}",
            n, elapsedMs, peakMemoryKb(), implementation, total));
  }
}
