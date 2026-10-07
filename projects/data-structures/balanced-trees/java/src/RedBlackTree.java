import java.util.function.Consumer;

/**
 * Red-black tree.
 *
 * <p>EN: A binary search tree where each node is red or black and four rules hold. The root is
 * black. The NIL leaves are black. A red node has no red child. Every path from a node down to the
 * NIL leaves crosses the same number of black nodes. Together they imply that the longest path is
 * at most twice the shortest, so the height stays below 2 log2(n + 1). The balance is looser than
 * in an AVL tree, and in exchange updates need fewer rotations.
 *
 * <p>PT: Uma árvore binária de busca em que cada nó é vermelho ou preto e quatro regras valem. A
 * raiz é preta. As folhas NIL são pretas. Um nó vermelho não tem filho vermelho. Todo caminho de um
 * nó até as folhas NIL passa pelo mesmo número de nós pretos. Juntas, elas implicam que o caminho
 * mais longo tem no máximo o dobro do mais curto, então a altura fica abaixo de 2 log2(n + 1). O
 * balanceamento é mais frouxo que o da AVL, e em troca as atualizações precisam de menos rotações.
 */
public final class RedBlackTree implements SearchTree {
  private static final class Node {
    long key;
    boolean red;
    Node left;
    Node right;
    Node parent;
  }

  // EN: One shared sentinel node plays the part of every NIL leaf. It is black, and having a real
  //     node there lets the code read node.left.red without testing for null.
  // PT: Um único nó sentinela compartilhado faz o papel de todas as folhas NIL. Ele é preto, e
  //     ter um nó de verdade ali deixa o código ler node.left.red sem testar referência nula.
  private final Node nil = new Node();
  private Node root = nil;
  private int size;
  private long rotations;
  private Consumer<String> observer;

  /** Creates an empty tree. */
  public RedBlackTree() {
    nil.left = nil;
    nil.right = nil;
    nil.parent = nil;
  }

  @Override
  public String name() {
    return "red-black";
  }

  @Override
  public void observe(Consumer<String> observer) {
    this.observer = observer;
  }

  private void notifyObserver(String what) {
    if (observer != null) {
      observer.accept(what);
    }
  }

  // EN: The new node goes in as a red leaf. Red does not change the number of black nodes on any
  //     path, so the only rule that can break is "no red node has a red child", and that one can
  //     be repaired locally.
  // PT: O nó novo entra como folha vermelha. O vermelho não altera o número de nós pretos de
  //     nenhum caminho, então a única regra que pode quebrar é "nó vermelho não tem filho
  //     vermelho", e essa tem conserto local.
  @Override
  public boolean insert(long key) {
    Node parent = nil;
    Node node = root;
    while (node != nil) {
      if (key == node.key) {
        return false;
      }
      parent = node;
      node = key < node.key ? node.left : node.right;
    }
    Node fresh = new Node();
    fresh.key = key;
    fresh.red = true;
    fresh.left = nil;
    fresh.right = nil;
    fresh.parent = parent;
    if (parent == nil) {
      root = fresh;
    } else if (key < parent.key) {
      parent.left = fresh;
    } else {
      parent.right = fresh;
    }
    size++;
    notifyObserver("insert " + key);
    fixInsert(fresh);
    return true;
  }

  @Override
  public boolean remove(long key) {
    Node target = root;
    while (target != nil && target.key != key) {
      target = key < target.key ? target.left : target.right;
    }
    if (target == nil) {
      return false;
    }
    // EN: `moved` is the node that leaves its position (the target itself, or its successor when
    //     the target has two children) and `hole` is the node that takes that position. If the
    //     node that left was black, the paths through `hole` lost one black node and the tree
    //     has to be repaired from there.
    // PT: `moved` é o nó que sai da sua posição (o próprio alvo, ou o sucessor quando o alvo tem
    //     dois filhos) e `hole` é o nó que assume essa posição. Se o nó que saiu era preto, os
    //     caminhos que passam por `hole` perderam um nó preto e a árvore precisa ser consertada a
    //     partir dali.
    Node moved = target;
    boolean movedWasRed = moved.red;
    Node hole;
    if (target.left == nil) {
      hole = target.right;
      replaceChild(target, target.right);
    } else if (target.right == nil) {
      hole = target.left;
      replaceChild(target, target.left);
    } else {
      moved = target.right;
      while (moved.left != nil) {
        moved = moved.left;
      }
      movedWasRed = moved.red;
      hole = moved.right;
      if (moved.parent == target) {
        hole.parent = moved;
      } else {
        replaceChild(moved, moved.right);
        moved.right = target.right;
        moved.right.parent = moved;
      }
      replaceChild(target, moved);
      moved.left = target.left;
      moved.left.parent = moved;
      moved.red = target.red;
    }
    size--;
    if (!movedWasRed) {
      fixRemove(hole);
    }
    return true;
  }

  @Override
  public boolean contains(long key) {
    Node node = root;
    while (node != nil && node.key != key) {
      node = key < node.key ? node.left : node.right;
    }
    return node != nil;
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

  private void rotateLeft(Node x) {
    Node y = x.right;
    x.right = y.left;
    if (y.left != nil) {
      y.left.parent = x;
    }
    replaceChild(x, y);
    y.left = x;
    x.parent = y;
    rotations++;
    notifyObserver("rotate left at " + x.key);
  }

  private void rotateRight(Node x) {
    Node y = x.left;
    x.left = y.right;
    if (y.right != nil) {
      y.right.parent = x;
    }
    replaceChild(x, y);
    y.right = x;
    x.parent = y;
    rotations++;
    notifyObserver("rotate right at " + x.key);
  }

  // EN: Makes the parent of `old` point to `replacement` instead. The sentinel also receives a
  //     parent here, on purpose: fixRemove may start at the sentinel and needs to climb from it.
  // PT: Faz o pai de `old` apontar para `replacement`. O sentinela também recebe um pai aqui, de
  //     propósito: o fixRemove pode começar no sentinela e precisa subir a partir dele.
  private void replaceChild(Node old, Node replacement) {
    replacement.parent = old.parent;
    if (old.parent == nil) {
      root = replacement;
    } else if (old == old.parent.left) {
      old.parent.left = replacement;
    } else {
      old.parent.right = replacement;
    }
  }

  // EN: While the new node and its parent are both red, look at the uncle. A red uncle means only
  //     colours change: parent and uncle become black, the grandparent becomes red, and the
  //     conflict moves two levels up. A black uncle means the subtree is lopsided, and one or
  //     two rotations with a colour swap end the repair at once.
  // PT: Enquanto o nó novo e o pai forem ambos vermelhos, olha-se o tio. Tio vermelho significa
  //     que só as cores mudam: pai e tio ficam pretos, o avô fica vermelho, e o conflito sobe
  //     dois níveis. Tio preto significa que a subárvore está torta, e uma ou duas rotações com
  //     troca de cores encerram o conserto de vez.
  private void fixInsert(Node start) {
    Node node = start;
    while (node.parent.red) {
      Node parent = node.parent;
      Node grandparent = parent.parent;
      boolean parentIsLeft = parent == grandparent.left;
      Node uncle = parentIsLeft ? grandparent.right : grandparent.left;
      if (uncle.red) {
        parent.red = false;
        uncle.red = false;
        grandparent.red = true;
        notifyObserver(
            "recolour: "
                + parent.key
                + " and "
                + uncle.key
                + " black, "
                + grandparent.key
                + " red");
        node = grandparent;
        continue;
      }
      if (parentIsLeft) {
        if (node == parent.right) {
          rotateLeft(parent);
          parent = node;
        }
        parent.red = false;
        grandparent.red = true;
        rotateRight(grandparent);
      } else {
        if (node == parent.left) {
          rotateRight(parent);
          parent = node;
        }
        parent.red = false;
        grandparent.red = true;
        rotateLeft(grandparent);
      }
      break;
    }
    if (root.red) {
      root.red = false;
      notifyObserver("recolour: root " + root.key + " black");
    }
  }

  // EN: `node` carries an "extra black" that its paths are missing. The sibling decides what to
  //     do. A red sibling is first rotated out of the way. A black sibling with two black
  //     children gives up its own black (it turns red) and the problem moves up to the parent. A
  //     black sibling with a red child lends that red through one or two rotations, which
  //     restores the missing black and ends the repair.
  // PT: `node` carrega um "preto extra" que está faltando nos caminhos dele. O irmão decide o que
  //     fazer. Um irmão vermelho é primeiro tirado do caminho com uma rotação. Um irmão preto com
  //     dois filhos pretos abre mão do próprio preto (fica vermelho) e o problema sobe para o
  //     pai. Um irmão preto com um filho vermelho empresta esse vermelho por uma ou duas
  //     rotações, o que devolve o preto que faltava e encerra o conserto.
  private void fixRemove(Node start) {
    Node node = start;
    while (node != root && !node.red) {
      Node parent = node.parent;
      if (node == parent.left) {
        Node sibling = parent.right;
        if (sibling.red) {
          sibling.red = false;
          parent.red = true;
          rotateLeft(parent);
          sibling = parent.right;
        }
        if (!sibling.left.red && !sibling.right.red) {
          sibling.red = true;
          node = parent;
          continue;
        }
        if (!sibling.right.red) {
          sibling.left.red = false;
          sibling.red = true;
          rotateRight(sibling);
          sibling = parent.right;
        }
        sibling.red = parent.red;
        parent.red = false;
        sibling.right.red = false;
        rotateLeft(parent);
      } else {
        Node sibling = parent.left;
        if (sibling.red) {
          sibling.red = false;
          parent.red = true;
          rotateRight(parent);
          sibling = parent.left;
        }
        if (!sibling.left.red && !sibling.right.red) {
          sibling.red = true;
          node = parent;
          continue;
        }
        if (!sibling.left.red) {
          sibling.right.red = false;
          sibling.red = true;
          rotateLeft(sibling);
          sibling = parent.left;
        }
        sibling.red = parent.red;
        parent.red = false;
        sibling.left.red = false;
        rotateRight(parent);
      }
      node = root;
    }
    node.red = false;
  }

  private int heightOf(Node node) {
    return node == nil ? 0 : 1 + Math.max(heightOf(node.left), heightOf(node.right));
  }

  @Override
  public String check() {
    if (root.red) {
      return "the root is red";
    }
    int[] nodes = {0};
    String[] problem = {""};
    check(root, Long.MIN_VALUE, Long.MAX_VALUE, nodes, problem);
    if (problem[0].isEmpty() && nodes[0] != size) {
      return "the size does not match the number of nodes";
    }
    return problem[0];
  }

  /** Returns the black height of the subtree, and writes the first problem found. */
  private int check(Node node, long low, long high, int[] nodes, String[] problem) {
    if (node == nil) {
      return 1;
    }
    nodes[0]++;
    int left = check(node.left, low, node.key, nodes, problem);
    int right = check(node.right, node.key, high, nodes, problem);
    if (!problem[0].isEmpty()) {
      return 0;
    }
    if (node.key <= low || node.key >= high) {
      problem[0] = "keys out of order at " + node.key;
    } else if (node.red && (node.left.red || node.right.red)) {
      problem[0] = "red node " + node.key + " has a red child";
    } else if (left != right) {
      problem[0] = "different black heights below " + node.key;
    }
    return left + (node.red ? 0 : 1);
  }

  @Override
  public String toJson() {
    return json(root);
  }

  private String json(Node node) {
    if (node == nil) {
      return "null";
    }
    return "{\"k\":"
        + node.key
        + ",\"c\":\""
        + (node.red ? "R" : "B")
        + "\",\"l\":"
        + json(node.left)
        + ",\"r\":"
        + json(node.right)
        + "}";
  }
}
