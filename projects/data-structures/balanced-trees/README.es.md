# balanced-trees

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Tres árboles de búsqueda con la misma interfaz, escritos en C++ y en Java: un árbol binario de búsqueda sin balanceo, un árbol AVL y un árbol rojo-negro. Enseña cómo un árbol sin balanceo degenera en una lista cuando las claves llegan ordenadas, y cómo las rotaciones lo evitan. Una página estática reproduce la inserción de una secuencia fija y muestra cada rotación.

Explicación completa: [docs/es/data-structures/balanced-trees.md](../../../docs/es/data-structures/balanced-trees.md).

## Temas del quiz que demuestra

- `data-structures` / `binary-search-trees`: la propiedad de orden, la inserción, la eliminación en tres casos y la degeneración con claves ordenadas.
- `data-structures` / `avl-trees`: factor de balance, rotaciones simples y dobles, rebalanceo después de la inserción y de la eliminación, cota de altura.
- `data-structures` / `red-black-trees`: las reglas de color, la inserción como nodo rojo, el recoloreo con un tío rojo, las rotaciones con un tío negro, la comparación con AVL.
- `data-structures` / `binary-trees-and-traversals`: la altura, y el recorrido en orden como prueba de la propiedad de búsqueda.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-balanced-trees.sh        # Linux y macOS
./setup-windows-balanced-trees.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta las pruebas en cada una. La imagen de C++ revisa el formato con clang-format cuando corren las pruebas. La imagen de Java revisa el formato con Spotless (google-java-format) mientras se construye, que es el único paso que necesita la red, y compila con `javac -Xlint:all -Werror`.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/search_tree.hpp`, `java/src/SearchTree.java` | la interfaz común: insertar, eliminar, contiene, tamaño, altura, contador de rotaciones, verificación de invariantes |
| `cpp/bst.hpp`, `java/src/Bst.java` | árbol sin balanceo, escrito con bucles para que un árbol de 100,000 niveles no desborde la pila de llamadas |
| `cpp/avl.hpp`, `java/src/AvlTree.java` | árbol AVL |
| `cpp/red_black.hpp`, `java/src/RedBlackTree.java` | árbol rojo-negro con un centinela NIL |
| `cpp/steps.hpp`, `java/src/Steps.java` | registra un cuadro por cambio para el visualizador |
| `cpp/demo.cpp`, `java/src/Demo.java` | la demo: tabla de alturas y datos del visualizador |
| `dashboard/` | el visualizador estático de rotaciones |
| `results/heights.md` | tabla versionada de alturas y rotaciones |

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm java-test
```

- **Pruebas de propiedad**: para cada árbol y 3 semillas, 6,000 inserciones, eliminaciones y búsquedas aleatorias se comparan con el conjunto ordenado del lenguaje (`std::set`, `TreeSet`). La invariante del árbol se verifica después de **cada** operación: orden de las claves en los tres, balance y alturas guardadas en AVL, color de la raíz, ningún par rojo-rojo y alturas negras iguales en rojo-negro.
- **Inserción ordenada de 100,000 claves**: el árbol sin balanceo llega a altura 100,000 con 0 rotaciones. El árbol AVL llega a altura 17 y el rojo-negro a altura 31, ambos por debajo de 40. Luego se elimina la mitad de las claves de los árboles balanceados y las invariantes siguen valiendo.
- **Datos del visualizador**: los cuadros grabados contienen un cuadro por clave insertada y exactamente un cuadro por rotación contada.

Los programas en C++ y en Java producen datos del visualizador y tablas de alturas idénticos byte a byte.

## Demo

```sh
docker compose run --rm cpp-test tree_demo heights
docker compose run --rm java-test java -cp /opt/classes Demo heights
```

Imprime la altura y el número de rotaciones de los tres árboles después de la inserción ordenada y de la aleatoria de 1,000 a 100,000 claves. Salida versionada: [results/heights.md](results/heights.md).

## Visualizador de rotaciones

Abre `dashboard/index.html` en un navegador, directo desde el disco. Elige un árbol y luego usa Siguiente, Anterior, Reproducir o el control deslizante para reproducir la inserción de 10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45. Cada rotación y cada recoloreo es un paso. La página usa un archivo CSS versionado y ninguna red.

El archivo de datos lo genera la implementación, y luego se formatea con Biome como todo script del repositorio:

```sh
docker compose run --rm cpp-test tree_demo steps > dashboard/steps.js
bunx biome format --write dashboard/steps.js
```

`dashboard/tailwind.css` se construyó a partir de `dashboard/input.css` con el CLI de Tailwind CSS 4.3.3 que el repositorio instala para `tools/scaffold`. Reconstrúyelo solo cuando cambien las clases que usa la página.
