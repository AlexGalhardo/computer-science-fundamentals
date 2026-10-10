import java.util.ArrayList;
import java.util.List;

/** Records the frames that the rotation visualiser replays. */
public final class Steps {
  // EN: The fixed sequence replayed by the visualiser. It starts with sorted keys, which is what
  //     breaks the unbalanced tree, and then mixes keys that trigger single rotations, double
  //     rotations and recolouring.
  // PT: A sequência fixa repetida pelo visualizador. Ela começa com chaves ordenadas, que é o que
  //     quebra a árvore sem balanceamento, e depois mistura chaves que disparam rotações simples,
  //     rotações duplas e trocas de cor.
  // ES: La secuencia fija que repite el visualizador. Empieza con claves ordenadas, que es lo que
  //     rompe el árbol sin balanceo, y luego mezcla claves que disparan rotaciones simples,
  //     rotaciones dobles y cambios de color.
  static final long[] SEQUENCE = {10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45};

  /**
   * One picture of the tree.
   *
   * <p>EN: What just happened, how many rotations so far, and the whole tree as JSON.
   *
   * <p>PT: O que acabou de acontecer, quantas rotações até ali, e a árvore inteira em JSON.
   *
   * <p>ES: Lo que acaba de pasar, cuántas rotaciones hasta ahí, y el árbol entero en JSON.
   */
  record Frame(String label, long rotations, String tree) {}

  private Steps() {}

  static List<SearchTree> allTrees() {
    return List.of(new Bst(), new AvlTree(), new RedBlackTree());
  }

  // EN: Inserts the sequence and takes a frame every time the tree reports a change.
  // PT: Insere a sequência e tira um quadro toda vez que a árvore avisa de uma mudança.
  // ES: Inserta la secuencia y toma un cuadro cada vez que el árbol avisa de un cambio.
  static List<Frame> record(SearchTree tree, long[] sequence) {
    List<Frame> frames = new ArrayList<>();
    frames.add(new Frame("empty tree", 0, tree.toJson()));
    tree.observe(what -> frames.add(new Frame(what, tree.rotations(), tree.toJson())));
    for (long key : sequence) {
      tree.insert(key);
    }
    tree.observe(null);
    return frames;
  }

  // EN: The data file of the visualiser. It is a script that sets one global variable, because a
  //     page opened straight from disk cannot fetch a JSON file.
  // PT: O arquivo de dados do visualizador. É um script que define uma variável global, porque
  //     uma página aberta direto do disco não consegue buscar um arquivo JSON.
  // ES: El archivo de datos del visualizador. Es un script que define una variable global, porque
  //     una página abierta directo desde el disco no puede pedir un archivo JSON.
  static String script() {
    StringBuilder out = new StringBuilder("window.TREE_STEPS = {\"sequence\":[");
    for (int i = 0; i < SEQUENCE.length; i++) {
      out.append(i == 0 ? "" : ",").append(SEQUENCE[i]);
    }
    out.append("],\"trees\":{");
    boolean firstTree = true;
    for (SearchTree tree : allTrees()) {
      out.append(firstTree ? "" : ",").append("\n\"").append(tree.name()).append("\":[");
      firstTree = false;
      boolean firstFrame = true;
      for (Frame frame : record(tree, SEQUENCE)) {
        out.append(firstFrame ? "" : ",")
            .append("\n{\"label\":\"")
            .append(frame.label())
            .append("\",\"rotations\":")
            .append(frame.rotations())
            .append(",\"tree\":")
            .append(frame.tree())
            .append("}");
        firstFrame = false;
      }
      out.append("]");
    }
    return out.append("}};\n").toString();
  }
}
