# Height and rotations after insertion

Output of the demo, committed as text. The numbers are counts, not times, so they do not depend on the machine: the C++ and the Java programs print exactly the same table.

- Commands: `docker compose run --rm cpp-test tree_demo heights` and `docker compose run --rm java-test java -cp /opt/classes Demo heights`
- Images: `gcc:16.2.0-trixie` and `gradle:9.8.0-jdk25`
- Run on Docker Engine 29.8.1 (Docker Desktop, kernel 6.18.33.2-microsoft-standard-WSL2), 2026-10-07
- Height is the number of nodes on the longest path from the root to a leaf. "sorted" inserts 1, 2, 3, ..., n. "random" inserts the same keys in a fixed pseudo-random order, the same for the three trees.

| Keys | Order | BST height | AVL height | AVL rotations | Red-black height | Red-black rotations |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1000 | sorted | 1000 | 10 | 990 | 17 | 983 |
| 1000 | random | 22 | 12 | 703 | 12 | 610 |
| 10000 | sorted | 10000 | 14 | 9986 | 24 | 9976 |
| 10000 | random | 28 | 16 | 6981 | 16 | 5874 |
| 100000 | sorted | 100000 | 17 | 99983 | 31 | 99969 |
| 100000 | random | 41 | 20 | 70164 | 20 | 58528 |

Reading:

- Sorted insertion turns the unbalanced tree into a list: its height is n. The balanced trees stay at 17 and 31 levels for 100,000 keys.
- With random keys the unbalanced tree is acceptable (41 levels), about twice the height of the balanced ones. The danger is the order of arrival, which the tree does not control.
- The AVL tree is the shortest. On sorted input the red-black tree is almost twice as tall (31 against 17), still within its bound of 2 log2(n + 1), which is about 33.
- On random input the red-black tree did about 17% fewer rotations than the AVL tree (58,528 against 70,164). On sorted input both did about one rotation per key.
