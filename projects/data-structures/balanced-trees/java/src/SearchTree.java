import java.util.function.Consumer;

/**
 * One interface for the three trees.
 *
 * <p>EN: The unbalanced tree, the AVL tree and the red-black tree answer the same questions with
 * the same operations, so the same tests and the same measurements run on all of them. What differs
 * is the shape each one allows.
 *
 * <p>PT: A árvore sem balanceamento, a AVL e a rubro-negra respondem às mesmas perguntas com as
 * mesmas operações, então os mesmos testes e as mesmas medições rodam em todas. O que muda é a
 * forma que cada uma permite.
 */
public interface SearchTree {
  String name();

  /** Returns true when the key is new. */
  boolean insert(long key);

  /** Returns true when the key was present. */
  boolean remove(long key);

  boolean contains(long key);

  int size();

  /** Number of nodes on the longest path from the root to a leaf, 0 for an empty tree. */
  int height();

  long rotations();

  /** Empty text when the invariant of the tree holds, or a description of the problem. */
  String check();

  /** The tree as JSON, for the visualiser: {"k": key, "c": colour, "l": left, "r": right}. */
  String toJson();

  /**
   * Sets the observer, or null for none.
   *
   * <p>EN: The observer is called every time the tree changes in a way worth showing: a key was
   * linked, a rotation happened, colours changed. The visualiser uses it to take one picture of the
   * tree per step.
   *
   * <p>PT: O observador é chamado toda vez que a árvore muda de um jeito que vale mostrar: uma
   * chave foi ligada, houve uma rotação, as cores mudaram. O visualizador o usa para tirar uma foto
   * da árvore por passo.
   */
  void observe(Consumer<String> observer);
}
