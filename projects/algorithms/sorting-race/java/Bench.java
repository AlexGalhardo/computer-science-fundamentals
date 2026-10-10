import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.function.UnaryOperator;

// EN: `java Bench <algorithm> <variant> <n>` reads `data/<variant>-<n>.txt`, sorts it and prints
//     one JSON line in the benchmark contract. Only the sort is timed. The single call is
//     measured cold, with the JIT still warming up, because that is what a user of a
//     command-line program gets.
// PT: `java Bench <algoritmo> <variante> <n>` lê `data/<variante>-<n>.txt`, ordena e imprime uma
//     linha JSON no contrato de benchmark. Só a ordenação é cronometrada. A chamada única é
//     medida a frio, com o JIT ainda aquecendo, porque é isso que recebe quem usa um programa
//     de linha de comando.
// ES: `java Bench <algoritmo> <variante> <n>` lee `data/<variante>-<n>.txt`, ordena e imprime una
//     línea JSON en el contrato de benchmark. Solo se cronometra la ordenación. La llamada única
//     se mide en frío, con el JIT todavía calentando, porque eso es lo que recibe quien usa un
//     programa de línea de comandos.
public final class Bench {
  private static final List<String> VARIANTS = List.of("random", "sorted", "reversed");
  private static final String USAGE = "usage: Bench <algorithm> <random|sorted|reversed> <n>";

  private Bench() {}

  // EN: The file is external input: a line that is not an integer from 0 to 2^31 - 1 is an error.
  // PT: O arquivo é entrada externa: uma linha que não é um inteiro de 0 a 2^31 - 1 é um erro.
  // ES: El archivo es entrada externa: una línea que no es un entero de 0 a 2^31 - 1 es un error.
  static int[] readValues(Path path, int expected) throws IOException {
    List<String> lines = Files.readAllLines(path);
    if (lines.size() != expected) {
      throw new IllegalArgumentException(
          path + ": expected " + expected + " values, found " + lines.size());
    }
    int[] values = new int[expected];
    for (int i = 0; i < expected; i++) {
      try {
        values[i] = Integer.parseInt(lines.get(i));
      } catch (NumberFormatException error) {
        throw new IllegalArgumentException(path + ":" + (i + 1) + ": not an integer", error);
      }
      if (values[i] < 0) {
        throw new IllegalArgumentException(path + ":" + (i + 1) + ": negative value");
      }
    }
    return values;
  }

  // EN: VmHWM ("high water mark") in /proc/self/status is the peak resident memory in kibibytes.
  // PT: VmHWM ("marca d'água") em /proc/self/status é o pico de memória residente em kibibytes.
  // ES: VmHWM ("marca de agua") en /proc/self/status es el pico de memoria residente en
  //     kibibytes.
  static long peakMemoryKb() throws IOException {
    for (String line : Files.readAllLines(Path.of("/proc/self/status"))) {
      if (line.startsWith("VmHWM:")) {
        return Long.parseLong(line.replaceAll("\\D+", ""));
      }
    }
    return 0;
  }

  public static void main(String[] args) throws IOException {
    UnaryOperator<int[]> sort = args.length == 3 ? Sorts.all().get(args[0]) : null;
    if (sort == null || !VARIANTS.contains(args[1]) || !args[2].matches("\\d{1,9}")) {
      System.err.println(USAGE);
      System.exit(2);
      return;
    }
    int n = Integer.parseInt(args[2]);
    int[] values = readValues(Path.of("data", args[1] + "-" + n + ".txt"), n);

    // EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is reported: the
    //     minimum is the measurement least disturbed by other programs on the machine. In Java
    //     the later runs are also faster because the JIT has compiled the hot loops by then.
    // PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é informada: o
    //     mínimo é a medida menos perturbada por outros programas na máquina. Em Java as
    //     execuções seguintes também são mais rápidas porque o JIT já compilou os laços quentes.
    // ES: Hasta 5 ejecuciones mientras el total se mantiene por debajo de 300 ms, y se informa la
    //     más rápida: el mínimo es la medida menos perturbada por otros programas en la máquina.
    //     En Java las ejecuciones siguientes también son más rápidas porque el JIT ya compiló los
    //     bucles calientes.
    int[] sorted = values;
    double elapsedMs = Double.POSITIVE_INFINITY;
    double spentMs = 0;
    for (int repetition = 0; repetition < 5 && (repetition == 0 || spentMs < 300); repetition++) {
      long start = System.nanoTime();
      sorted = sort.apply(values);
      double took = (System.nanoTime() - start) / 1e6;
      elapsedMs = Math.min(elapsedMs, took);
      spentMs += took;
    }

    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"n\":%d,\"elapsedMs\":%.6f,\"memoryKb\":%d,\"language\":\"java\","
                + "\"implementation\":\"%s\",\"checksum\":\"%s\"}",
            n,
            elapsedMs,
            peakMemoryKb(),
            args[0],
            Sorts.checksum(sorted)));
  }
}
