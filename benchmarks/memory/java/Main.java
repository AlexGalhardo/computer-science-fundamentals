// EN: Memory workload in Java: `binary-trees` (allocate and discard many small nodes) and
//     `idle` (start and exit). Java model: a generational, moving garbage collector (G1 by
//     default). New objects are allocated by bumping a pointer in the young generation, which
//     is very fast. Most die young and are never touched again. The few that survive are
//     copied to the old generation. The JVM reserves a large heap up front to make this work,
//     so its memory use is much higher than the live data.
// PT: Carga de memória em Java: `binary-trees` (aloca e descarta muitos nós pequenos) e `idle`
//     (sobe e sai). Modelo do Java: coletor de lixo geracional que move objetos (G1 por
//     padrão). Objetos novos são alocados avançando um ponteiro na geração jovem, o que é
//     muito rápido. A maioria morre jovem e nunca mais é tocada. Os poucos que sobrevivem são
//     copiados para a geração velha. A JVM reserva um heap grande de saída para isso
//     funcionar, então seu uso de memória é bem maior que os dados vivos.

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

public final class Main {
  private static final class Node {
    final Node left;
    final Node right;

    Node(Node left, Node right) {
      this.left = left;
      this.right = right;
    }

    // EN: Walks the whole tree and counts its nodes.
    // PT: Percorre a árvore inteira e conta os nós.
    long check() {
      return left == null ? 1 : 1 + left.check() + right.check();
    }
  }

  private Main() {}

  private static Node make(int depth) {
    return depth == 0 ? new Node(null, null) : new Node(make(depth - 1), make(depth - 1));
  }

  private static long binaryTrees(int n) {
    int minDepth = 4;
    int maxDepth = Math.max(minDepth + 2, n);
    long total = make(maxDepth + 1).check();
    Node longLived = make(maxDepth);
    for (int depth = minDepth; depth <= maxDepth; depth += 2) {
      long iterations = 1L << (maxDepth - depth + minDepth);
      for (long i = 0; i < iterations; i++) {
        total += make(depth).check();
      }
    }
    return total + longLived.check();
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

  public static void main(String[] args) {
    String implementation = args.length > 0 ? args[0] : "binary-trees";
    int n = args.length > 1 ? Integer.parseInt(args[1]) : 10;

    long start = System.nanoTime();
    String checksum = implementation.equals("idle") ? "idle" : Long.toString(binaryTrees(n));
    double elapsedMs = (System.nanoTime() - start) / 1e6;

    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"java\",\"implementation\":\"%s\",\"checksum\":\"%s\"}",
            n, elapsedMs, peakMemoryKb(), implementation, checksum));
  }
}
