/**
 * Demo of the three trees.
 *
 * <p>EN: {@code java Demo heights} prints a Markdown table with the height and the rotations of the
 * three trees after sorted and after random insertion of 1,000 to 100,000 keys. {@code java Demo
 * steps} prints the data file of the rotation visualiser.
 *
 * <p>PT: {@code java Demo heights} imprime uma tabela Markdown com a altura e as rotações das três
 * árvores depois da inserção ordenada e da aleatória de 1.000 a 100.000 chaves. {@code java Demo
 * steps} imprime o arquivo de dados do visualizador de rotações.
 *
 * <p>ES: {@code java Demo heights} imprime una tabla Markdown con la altura y las rotaciones de los
 * tres árboles después de la inserción ordenada y de la aleatoria de 1,000 a 100,000 claves. {@code
 * java Demo steps} imprime el archivo de datos del visualizador de rotaciones.
 */
public final class Demo {
  private Demo() {}

  private static void heights() {
    System.out.println(
        "| Keys | Order | BST height | AVL height | AVL rotations | Red-black height "
            + "| Red-black rotations |");
    System.out.println("| ---: | --- | ---: | ---: | ---: | ---: | ---: |");
    for (int n : new int[] {1000, 10_000, 100_000}) {
      for (boolean sorted : new boolean[] {true, false}) {
        StringBuilder row = new StringBuilder("| " + n + " | " + (sorted ? "sorted" : "random"));
        for (SearchTree tree : Steps.allTrees()) {
          // EN: The random order is a fixed pseudo-random permutation, the same for the three
          //     trees and for the C++ program.
          // PT: A ordem aleatória é uma permutação pseudoaleatória fixa, a mesma para as três
          //     árvores e para o programa em C++.
          // ES: El orden aleatorio es una permutación pseudoaleatoria fija, la misma para los tres
          //     árboles y para el programa en C++.
          long state = 88172645463325252L;
          long[] keys = new long[n];
          for (int i = 0; i < n; i++) {
            keys[i] = i + 1;
          }
          if (!sorted) {
            for (int i = n - 1; i > 0; i--) {
              state ^= state << 13;
              state ^= state >>> 7;
              state ^= state << 17;
              int other = (int) Long.remainderUnsigned(state, i + 1);
              long swap = keys[i];
              keys[i] = keys[other];
              keys[other] = swap;
            }
          }
          for (long key : keys) {
            tree.insert(key);
          }
          row.append(" | ").append(tree.height());
          if (!tree.name().equals("bst")) {
            row.append(" | ").append(tree.rotations());
          }
        }
        System.out.println(row.append(" |"));
      }
    }
  }

  /** Runs the command given as the first argument: heights (the default) or steps. */
  public static void main(String[] args) {
    String command = args.length > 0 ? args[0] : "heights";
    switch (command) {
      case "steps" -> System.out.print(Steps.script());
      case "heights" -> heights();
      default -> {
        System.err.println("usage: java Demo heights|steps");
        System.exit(2);
      }
    }
  }
}
