import java.util.List;
import java.util.TreeSet;

/** Tests of the three trees, run with a plain main method and no test framework. */
public final class TreeTests {
  private static int checks;
  private static int failures;

  private TreeTests() {}

  private static void check(boolean condition, String what) {
    checks++;
    if (!condition) {
      failures++;
      System.err.println("FAIL: " + what);
    }
  }

  private static void basics(SearchTree tree) {
    String name = tree.name();
    check(tree.size() == 0 && tree.height() == 0 && tree.check().isEmpty(), name + ": empty tree");
    for (long key : new long[] {50, 30, 70, 20, 40, 60, 80}) {
      check(tree.insert(key), name + ": a new key is inserted");
    }
    check(!tree.insert(40) && tree.size() == 7, name + ": a repeated key is refused");
    check(tree.height() == 3, name + ": seven keys in this order make a full tree of 3 levels");
    check(tree.contains(60) && !tree.contains(65), name + ": contains");
    check(tree.remove(50) && !tree.remove(50), name + ": a key with two children is removed once");
    check(!tree.contains(50) && tree.size() == 6, name + ": the removed key is gone");
    check(tree.check().isEmpty(), name + ": invariant after the removal: " + tree.check());
  }

  // EN: Property test. Random inserts, removals and searches run on the tree and on a TreeSet,
  //     and after every single operation the answer is compared and the invariant of the tree is
  //     checked: order for all three, balance for the AVL tree, colours and black heights for the
  //     red-black tree.
  // PT: Teste de propriedade. Inserções, remoções e buscas aleatórias rodam na árvore e em um
  //     TreeSet, e depois de cada operação a resposta é comparada e a invariante da árvore é
  //     conferida: ordem nas três, balanceamento na AVL, cores e alturas negras na rubro-negra.
  private static void property(SearchTree tree, long seed) {
    String name = tree.name() + ", seed " + seed;
    TreeSet<Long> reference = new TreeSet<>();
    long state = seed;
    boolean same = true;
    String broken = "";
    for (int step = 0; step < 6000 && same && broken.isEmpty(); step++) {
      state = next(state);
      long key = Long.remainderUnsigned(state, 400);
      state = next(state);
      long choice = Long.remainderUnsigned(state, 10);
      if (choice < 5) {
        same = tree.insert(key) == reference.add(key);
      } else if (choice < 8) {
        same = tree.remove(key) == reference.remove(key);
      } else {
        same = tree.contains(key) == reference.contains(key);
      }
      same = same && tree.size() == reference.size();
      broken = tree.check();
    }
    check(same, name + ": every operation matches TreeSet");
    check(broken.isEmpty(), name + ": the invariant holds after every operation: " + broken);
  }

  private static long next(long state) {
    long x = state;
    x ^= x << 13;
    x ^= x >>> 7;
    x ^= x << 17;
    return x;
  }

  // EN: The lesson of the mini-project as numbers. 100,000 keys inserted in ascending order turn
  //     the unbalanced tree into a list 100,000 nodes tall. The same keys in the same order leave
  //     both balanced trees under 40 levels, because they rotate.
  // PT: A lição do mini-projeto em números. 100.000 chaves inseridas em ordem crescente
  //     transformam a árvore sem balanceamento em uma lista de 100.000 nós de altura. As mesmas
  //     chaves na mesma ordem deixam as duas árvores balanceadas abaixo de 40 níveis, porque elas
  //     fazem rotações.
  private static void sortedInsertion() {
    int n = 100_000;
    for (SearchTree tree : Steps.allTrees()) {
      String name = tree.name();
      for (long key = 1; key <= n; key++) {
        tree.insert(key);
      }
      System.out.println(
          name
              + ": height "
              + tree.height()
              + ", rotations "
              + tree.rotations()
              + " after "
              + n
              + " sorted insertions");
      check(tree.size() == n, name + ": all keys are stored");
      check(tree.check().isEmpty(), name + ": invariant after sorted insertion");
      if (name.equals("bst")) {
        check(tree.height() == n, "bst: sorted insertion gives height 100,000");
        check(tree.rotations() == 0, "bst: no rotation ever happens");
      } else {
        check(tree.height() < 40, name + ": sorted insertion keeps the height under 40");
        check(tree.rotations() > 0, name + ": rotations were counted");
        for (long key = 1; key <= n; key += 2) {
          tree.remove(key);
        }
        check(
            tree.size() == n / 2 && tree.check().isEmpty(),
            name + ": invariant after removing half of the keys");
      }
    }
  }

  // EN: The visualiser shows one frame per change. If the number of frames labelled "rotate"
  //     equals the rotation counter, no rotation is missing from the replay.
  // PT: O visualizador mostra um quadro por mudança. Se o número de quadros rotulados "rotate" é
  //     igual ao contador de rotações, nenhuma rotação ficou fora da reprodução.
  private static void visualiserSteps() {
    for (SearchTree tree : Steps.allTrees()) {
      String name = tree.name();
      List<Steps.Frame> frames = Steps.record(tree, Steps.SEQUENCE);
      long rotationFrames = frames.stream().filter(f -> f.label().startsWith("rotate")).count();
      long insertFrames = frames.stream().filter(f -> f.label().startsWith("insert")).count();
      check(insertFrames == Steps.SEQUENCE.length, name + ": one frame per inserted key");
      check(rotationFrames == tree.rotations(), name + ": one frame per rotation");
      check(frames.getLast().tree().equals(tree.toJson()), name + ": the last frame is the tree");
      if (!name.equals("bst")) {
        check(rotationFrames > 0, name + ": the fixed sequence shows rotations");
      }
    }
  }

  /** Runs every test and exits with a non-zero status when one fails. */
  public static void main(String[] args) {
    for (SearchTree tree : Steps.allTrees()) {
      basics(tree);
    }
    for (long seed = 1; seed <= 3; seed++) {
      for (SearchTree tree : Steps.allTrees()) {
        property(tree, seed);
      }
    }
    visualiserSteps();
    sortedInsertion();
    if (failures > 0) {
      System.err.println(failures + " of " + checks + " checks failed");
      System.exit(1);
    }
    System.out.println(checks + " checks passed");
  }
}
