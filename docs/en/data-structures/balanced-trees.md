# Balanced search trees

> Versão em português: [docs/pt/data-structures/balanced-trees.md](../../pt/data-structures/balanced-trees.md) · Versión en español: [docs/es/data-structures/balanced-trees.md](../../es/data-structures/balanced-trees.md)

Mini-project: [projects/data-structures/balanced-trees](../../../projects/data-structures/balanced-trees). Languages: C++, Java. Quiz topics: `data-structures` / `binary-search-trees`, `avl-trees`, `red-black-trees`.

## The problem

A binary search tree answers "is this key here?" by going left or right at each node, so every operation costs the height of the tree. With n keys the height can be anything from about log2(n) to n, and the plain tree does nothing to control it: a new key becomes a leaf wherever its search ends.

When the keys arrive already sorted, each one is larger than all the others and goes to the right of the last one. The tree becomes a linked list:

```text
insert 10, 20, 30, 40          a balanced tree with the same keys

10                                   20
  \                                 /  \
   20                             10    30
     \                                    \
      30                                   40
        \
         40
```

## The tool: rotation

A rotation swaps the roles of a node and one of its children, changing three pointers:

```text
      x                 y
     / \               / \
    A   y     -->     x   C        left rotation at x
       / \           / \
      B   C         A   B
```

Read from left to right, both trees say A, x, B, y, C. The order of the keys is untouched, so the result is still a search tree, but one side got shorter and the other taller. Balanced trees are plain search trees plus a rule that says when to rotate.

## AVL tree

Rule: at every node, the heights of the two subtrees differ by at most 1.

Each node stores its height. After an insertion or removal, the nodes on the way back to the root are checked. The balance factor is the right height minus the left height, and a node at +2 or -2 is repaired:

- **outer case** (the tall grandchild is on the outside): one rotation,
- **inner case** (a zigzag): two rotations, first at the child to straighten the path, then at the node.

The height stays below about 1.44 log2(n).

## Red-black tree

Rules: every node is red or black, the root is black, the NIL leaves are black, a red node has no red child, and every path from a node to the leaves below it has the same number of black nodes. The longest path is then at most twice the shortest, and the height stays below 2 log2(n + 1).

A new key goes in red, which never changes a black count. If its parent is also red, the uncle decides:

- **red uncle**: only colours change (parent and uncle black, grandparent red) and the check moves two levels up,
- **black uncle**: one or two rotations with a colour swap, and the repair ends.

The rule is looser than the AVL rule, so the tree may be taller, and in exchange updates restructure less.

## What the tests prove

- For the three trees, the invariant holds after every one of 18,000 random operations, and every answer matches the ordered set of the language.
- Sorted insertion of 100,000 keys: height 100,000 for the unbalanced tree, 17 for AVL and 31 for red-black.

## The measurements

Committed table: [results/heights.md](../../../projects/data-structures/balanced-trees/results/heights.md).

| Keys | Order | BST height | AVL height | AVL rotations | Red-black height | Red-black rotations |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 100,000 | sorted | 100,000 | 17 | 99,983 | 31 | 99,969 |
| 100,000 | random | 41 | 20 | 70,164 | 20 | 58,528 |

With random keys the plain tree is only about twice as tall as the balanced ones. Balancing is insurance against the order of arrival, which a tree does not choose. The price is small: about one rotation per insertion in the worst case, each one O(1).

## The visualiser

`dashboard/index.html` opens straight from disk and replays the insertion of 10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45 in the three trees, one change per step. For this sequence the unbalanced tree ends 7 levels tall, and the AVL and red-black trees end 4 levels tall after 8 rotations each. Nodes keep their column (their in-order position), so a rotation shows as two nodes changing level.

## Run it

```sh
cd projects/data-structures/balanced-trees
./setup-unix-balanced-trees.sh          # or ./setup-windows-balanced-trees.ps1
docker compose run --rm cpp-test tree_demo heights
```
