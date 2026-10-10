import java.util.ArrayDeque;
import java.util.function.Consumer;

/**
 * Binary search tree with no balancing.
 *
 * <p>EN: Smaller keys go left and larger keys go right, and a new key becomes a leaf wherever its
 * search ends. Nothing controls the shape: it depends only on the order of arrival. Keys that
 * arrive already sorted always go to the same side and the tree degenerates into a linked list,
 * with height n and O(n) operations.
 *
 * <p>PT: Chaves menores vão para a esquerda e maiores para a direita, e uma chave nova vira folha
 * onde a busca por ela termina. Nada controla a forma: ela depende só da ordem de chegada. Chaves
 * que chegam já ordenadas vão sempre para o mesmo lado e a árvore degenera em uma lista encadeada,
 * com altura n e operações O(n).
 *
 * <p>ES: Las claves menores van a la izquierda y las mayores a la derecha, y una clave nueva se
 * vuelve hoja donde termina la búsqueda de ella. Nada controla la forma: depende solo del orden de
 * llegada. Las claves que llegan ya ordenadas van siempre al mismo lado y el árbol degenera en una
 * lista enlazada, con altura n y operaciones O(n).
 */
public final class Bst implements SearchTree {
  private static final class Node {
    long key;
    Node left;
    Node right;

    Node(long key) {
      this.key = key;
    }
  }

  private record Visit(Node node, int depth) {}

  private Node root;
  private int size;
  private Consumer<String> observer;

  @Override
  public String name() {
    return "bst";
  }

  @Override
  public void observe(Consumer<String> observer) {
    this.observer = observer;
  }

  // EN: Everything here is a loop, not a recursion. A degenerate tree with 100,000 nodes is
  //     100,000 levels deep, and one method call per level would overflow the call stack.
  // PT: Tudo aqui é laço, não recursão. Uma árvore degenerada com 100.000 nós tem 100.000 níveis
  //     de profundidade, e uma chamada de método por nível estouraria a pilha de chamadas.
  // ES: Todo aquí es un bucle, no recursión. Un árbol degenerado con 100,000 nodos tiene 100,000
  //     niveles de profundidad, y una llamada de método por nivel desbordaría la pila de llamadas.
  @Override
  public boolean insert(long key) {
    Node parent = null;
    Node node = root;
    while (node != null) {
      if (key == node.key) {
        return false;
      }
      parent = node;
      node = key < node.key ? node.left : node.right;
    }
    Node fresh = new Node(key);
    if (parent == null) {
      root = fresh;
    } else if (key < parent.key) {
      parent.left = fresh;
    } else {
      parent.right = fresh;
    }
    size++;
    if (observer != null) {
      observer.accept("insert " + key);
    }
    return true;
  }

  // EN: Three cases. A node with no child is simply unlinked. A node with one child is replaced
  //     by that child. A node with two children keeps its place and receives the key of its
  //     in-order successor (the smallest key of the right subtree), and the successor, which has
  //     at most one child, is the node that is really unlinked.
  // PT: Três casos. Um nó sem filhos é simplesmente desligado. Um nó com um filho é substituído
  //     por esse filho. Um nó com dois filhos fica no lugar e recebe a chave do seu sucessor
  //     em-ordem (a menor chave da subárvore direita), e o sucessor, que tem no máximo um filho,
  //     é o nó realmente desligado.
  // ES: Tres casos. Un nodo sin hijos simplemente se desenlaza. Un nodo con un hijo se reemplaza
  //     por ese hijo. Un nodo con dos hijos se queda en su lugar y recibe la clave de su sucesor
  //     en orden (la menor clave del subárbol derecho), y el sucesor, que tiene como máximo un
  //     hijo, es el nodo que realmente se desenlaza.
  @Override
  public boolean remove(long key) {
    Node parent = null;
    Node node = root;
    while (node != null && node.key != key) {
      parent = node;
      node = key < node.key ? node.left : node.right;
    }
    if (node == null) {
      return false;
    }
    if (node.left != null && node.right != null) {
      Node successorParent = node;
      Node successor = node.right;
      while (successor.left != null) {
        successorParent = successor;
        successor = successor.left;
      }
      node.key = successor.key;
      parent = successorParent;
      node = successor;
    }
    Node child = node.left != null ? node.left : node.right;
    if (parent == null) {
      root = child;
    } else if (parent.left == node) {
      parent.left = child;
    } else {
      parent.right = child;
    }
    size--;
    return true;
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
    int tallest = 0;
    ArrayDeque<Visit> pending = new ArrayDeque<>();
    if (root != null) {
      pending.push(new Visit(root, 1));
    }
    while (!pending.isEmpty()) {
      Visit visit = pending.pop();
      tallest = Math.max(tallest, visit.depth());
      if (visit.node().left != null) {
        pending.push(new Visit(visit.node().left, visit.depth() + 1));
      }
      if (visit.node().right != null) {
        pending.push(new Visit(visit.node().right, visit.depth() + 1));
      }
    }
    return tallest;
  }

  @Override
  public long rotations() {
    return 0;
  }

  // EN: The only invariant of this tree is the order, and the in-order traversal is the test: it
  //     has to visit the keys in strictly increasing order.
  // PT: A única invariante desta árvore é a ordem, e o percurso em-ordem é o teste: ele precisa
  //     visitar as chaves em ordem estritamente crescente.
  // ES: La única invariante de este árbol es el orden, y el recorrido en orden es la prueba: debe
  //     visitar las claves en orden estrictamente creciente.
  @Override
  public String check() {
    ArrayDeque<Node> stack = new ArrayDeque<>();
    Node node = root;
    Node previous = null;
    int visited = 0;
    while (node != null || !stack.isEmpty()) {
      while (node != null) {
        stack.push(node);
        node = node.left;
      }
      node = stack.pop();
      if (previous != null && previous.key >= node.key) {
        return "keys out of order at " + node.key;
      }
      previous = node;
      visited++;
      node = node.right;
    }
    return visited == size ? "" : "the size does not match the number of nodes";
  }

  /** Recursive on purpose: the visualiser only draws small trees. */
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
