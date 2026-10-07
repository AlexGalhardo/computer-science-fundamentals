import java.util.function.Consumer;

/**
 * AVL tree.
 *
 * <p>EN: A binary search tree where, at every node, the heights of the two subtrees differ by at
 * most 1. Each node stores its height. After an insertion or removal the nodes on the path back to
 * the root are checked, and a node that got out of balance is fixed with one or two rotations. This
 * keeps the height below about 1.44 log2(n).
 *
 * <p>PT: Uma árvore binária de busca em que, em todo nó, as alturas das duas subárvores diferem em
 * no máximo 1. Cada nó guarda a sua altura. Depois de uma inserção ou remoção, os nós do caminho de
 * volta até a raiz são conferidos, e um nó que ficou desbalanceado é corrigido com uma ou duas
 * rotações. Isso mantém a altura abaixo de cerca de 1,44 log2(n).
 */
public final class AvlTree implements SearchTree {
  private static final class Node {
    long key;
    int height = 1;
    Node left;
    Node right;

    Node(long key) {
      this.key = key;
    }
  }

  private Node root;
  private int size;
  private long rotations;
  private boolean changed;
  private Consumer<String> observer;
  // EN: A method that returns a new subtree root cannot announce the change itself, because the
  //     parent has not been linked to it yet and a picture taken now would show the old tree. The
  //     message waits here and is sent by the caller right after it stores the returned root.
  // PT: Um método que devolve a nova raiz de uma subárvore não pode anunciar a mudança ele mesmo,
  //     porque o pai ainda não foi ligado a ela e uma foto tirada agora mostraria a árvore
  //     antiga. A mensagem espera aqui e é enviada por quem chamou, logo depois de guardar a raiz
  //     devolvida.
  private String pending;

  @Override
  public String name() {
    return "avl";
  }

  @Override
  public void observe(Consumer<String> observer) {
    this.observer = observer;
  }

  private void announce() {
    if (pending != null && observer != null) {
      observer.accept(pending);
    }
    pending = null;
  }

  @Override
  public boolean insert(long key) {
    changed = false;
    root = insert(root, key);
    announce();
    return changed;
  }

  @Override
  public boolean remove(long key) {
    changed = false;
    root = remove(root, key);
    announce();
    return changed;
  }

  @Override
  public boolean contains(long key) {
    Node node = root;
    while (node != null && node.key != key) {
      node = key < node.key ? node.left : node.right;
    }
    return node != null;
  }

  @Override
  public int size() {
    return size;
  }

  @Override
  public int height() {
    return heightOf(root);
  }

  @Override
  public long rotations() {
    return rotations;
  }

  private static int heightOf(Node node) {
    return node == null ? 0 : node.height;
  }

  private static void update(Node node) {
    node.height = 1 + Math.max(heightOf(node.left), heightOf(node.right));
  }

  // EN: Rotation. In a left rotation the right child y rises to the place of x, x becomes the
  //     left child of y, and the subtree that was between them changes parent. The in-order
  //     sequence is the same before and after, so the tree is still a search tree. Only three
  //     references change, so it is O(1). The method returns the new root of the subtree.
  // PT: Rotação. Na rotação à esquerda o filho direito y sobe para o lugar de x, x vira filho
  //     esquerdo de y, e a subárvore que ficava entre eles troca de pai. A sequência em-ordem é a
  //     mesma antes e depois, então a árvore continua sendo de busca. Só três referências mudam,
  //     então é O(1). O método devolve a nova raiz da subárvore.
  private Node rotateLeft(Node x) {
    Node y = x.right;
    x.right = y.left;
    y.left = x;
    update(x);
    update(y);
    rotations++;
    pending = "rotate left at " + x.key;
    return y;
  }

  private Node rotateRight(Node x) {
    Node y = x.left;
    x.left = y.right;
    y.right = x;
    update(x);
    update(y);
    rotations++;
    pending = "rotate right at " + x.key;
    return y;
  }

  // EN: Balance factor = height of the right subtree minus height of the left one. At +2 the
  //     right side is too tall. If the right child leans the same way (outer case), one left
  //     rotation fixes it. If the right child leans left (inner case, a zigzag), a single
  //     rotation would only mirror the problem, so the child is rotated right first to
  //     straighten the path. -2 is the mirror image.
  // PT: Fator de balanceamento = altura da subárvore direita menos a da esquerda. Em +2 o lado
  //     direito está alto demais. Se o filho direito pende para o mesmo lado (caso de fora), uma
  //     rotação à esquerda resolve. Se o filho direito pende para a esquerda (caso de dentro, um
  //     zigue-zague), uma rotação simples só espelharia o problema, então o filho é girado à
  //     direita antes, para alinhar o caminho. O -2 é a imagem no espelho.
  private Node rebalance(Node node) {
    update(node);
    int balance = heightOf(node.right) - heightOf(node.left);
    if (balance > 1) {
      if (heightOf(node.right.left) > heightOf(node.right.right)) {
        node.right = rotateRight(node.right);
        announce();
      }
      return rotateLeft(node);
    }
    if (balance < -1) {
      if (heightOf(node.left.right) > heightOf(node.left.left)) {
        node.left = rotateLeft(node.left);
        announce();
      }
      return rotateRight(node);
    }
    return node;
  }

  // EN: Recursion is safe here: the height is logarithmic, so the call stack is shallow. The
  //     rebalancing happens on the way back from the recursion, from the new leaf up.
  // PT: A recursão é segura aqui: a altura é logarítmica, então a pilha de chamadas é rasa. O
  //     rebalanceamento acontece na volta da recursão, da folha nova para cima.
  private Node insert(Node node, long key) {
    if (node == null) {
      size++;
      changed = true;
      pending = "insert " + key;
      return new Node(key);
    }
    if (key == node.key) {
      return node;
    }
    if (key < node.key) {
      node.left = insert(node.left, key);
    } else {
      node.right = insert(node.right, key);
    }
    announce();
    return changed ? rebalance(node) : node;
  }

  private Node remove(Node node, long key) {
    if (node == null) {
      return null;
    }
    if (key < node.key) {
      node.left = remove(node.left, key);
    } else if (key > node.key) {
      node.right = remove(node.right, key);
    } else if (node.left == null || node.right == null) {
      size--;
      changed = true;
      return node.left != null ? node.left : node.right;
    } else {
      Node successor = node.right;
      while (successor.left != null) {
        successor = successor.left;
      }
      node.key = successor.key;
      node.right = remove(node.right, successor.key);
    }
    announce();
    return changed ? rebalance(node) : node;
  }

  @Override
  public String check() {
    int[] nodes = {0};
    String[] problem = {""};
    check(root, Long.MIN_VALUE, Long.MAX_VALUE, nodes, problem);
    if (problem[0].isEmpty() && nodes[0] != size) {
      return "the size does not match the number of nodes";
    }
    return problem[0];
  }

  /** Returns the real height of the subtree, and writes the first problem found. */
  private static int check(Node node, long low, long high, int[] nodes, String[] problem) {
    if (node == null) {
      return 0;
    }
    nodes[0]++;
    int left = check(node.left, low, node.key, nodes, problem);
    int right = check(node.right, node.key, high, nodes, problem);
    if (!problem[0].isEmpty()) {
      return 0;
    }
    if (node.key <= low || node.key >= high) {
      problem[0] = "keys out of order at " + node.key;
    } else if (Math.abs(right - left) > 1) {
      problem[0] = "node " + node.key + " is out of balance";
    } else if (node.height != 1 + Math.max(left, right)) {
      problem[0] = "node " + node.key + " stores a wrong height";
    }
    return 1 + Math.max(left, right);
  }

  @Override
  public String toJson() {
    return json(root);
  }

  private static String json(Node node) {
    if (node == null) {
      return "null";
    }
    return "{\"k\":"
        + node.key
        + ",\"c\":\"\",\"l\":"
        + json(node.left)
        + ",\"r\":"
        + json(node.right)
        + "}";
  }
}
