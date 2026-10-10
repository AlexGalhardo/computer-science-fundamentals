# b-tree-on-disk

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un árbol B guardado en un archivo, un nodo por página de 4096 bytes, con inserción (división de nodos), búsqueda y eliminación (redistribución y fusión), escrito en C++ y en Rust. Un pager cuenta cada página leída. Enseña por qué las bases de datos y los sistemas de archivos usan árboles anchos: lo que cuesta una búsqueda en disco es el número de páginas que lee, y un árbol ancho lee 3 páginas donde un árbol binario lee 16.

Explicación completa: [docs/es/data-structures/b-tree-on-disk.md](../../../docs/es/data-structures/b-tree-on-disk.md).

## Temas del quiz que demuestra

- `data-structures` / `binary-search-trees`: la propiedad de orden generalizada a muchas claves por nodo, la búsqueda descartando subárboles, la eliminación por medio del antecesor o del sucesor.
- `data-structures` / `avl-trees` y `data-structures` / `red-black-trees`: el mismo objetivo, una altura logarítmica garantizada, alcanzado por otro camino: todas las hojas a la misma profundidad, con divisiones y fusiones en vez de rotaciones.
- `data-structures` / `binary-trees-and-traversals`: altura contra número de nodos, y por qué la altura es lo que paga una búsqueda.

## Cómo ejecutar

El único requisito es Docker.

```sh
./setup-unix-b-tree-on-disk.sh        # Linux y macOS
./setup-windows-b-tree-on-disk.ps1    # Windows
```

El script construye una imagen fijada por lenguaje y ejecuta la revisión de formato, el linter y las pruebas en cada una. Las pruebas tardan cerca de 30 segundos por lenguaje, porque construyen un árbol con un millón de claves por el pager. Todos los archivos se escriben en `/tmp` dentro del contenedor.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/pager.hpp`, `rust/src/pager.rs` | el archivo visto como un arreglo de páginas, con contadores de lectura y escritura |
| `cpp/btree.hpp`, `rust/src/btree.rs` | el árbol B: búsqueda, inserción con división, eliminación con redistribución y fusión, verificador de invariantes, lista de páginas libres |
| `cpp/disk_bst.hpp`, `rust/src/disk_bst.rs` | un árbol binario de búsqueda en el mismo tipo de archivo, para comparar |
| `cpp/workload.hpp`, `rust/src/workload.rs` | construye las dos estructuras con las mismas claves y mide las lecturas de página |
| `cpp/demo.cpp`, `rust/src/demo.rs` | la demo que imprime la tabla de comparación |
| `results/page-reads.md` | la tabla de comparación versionada |

Los dos lenguajes usan el mismo layout de archivo (enteros little-endian en offsets fijos) y los mismos algoritmos.

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Básicas**: divisiones con grado mínimo 2, búsqueda, reemplazo, eliminación, y el árbol leído de vuelta después de cerrar y reabrir el archivo.
- **100,000 operaciones aleatorias**, tres veces (grado mínimo 2, 3 y 85): cada inserción, eliminación y búsqueda se compara con el mapa ordenado del lenguaje, y las invariantes se verifican cada 5,000 operaciones y al final: número legal de claves por nodo, claves en orden, todas las hojas a la misma profundidad, cuenta de claves igual a la del encabezado. Luego se elimina cada clave (el árbol vuelve a una hoja vacía) y se inserta de nuevo dos veces, para demostrar que las páginas liberadas se reutilizan.
- **Lecturas de página**: con 1,000,000 de claves el árbol tiene 3 niveles, y ninguna de las 10,000 búsquedas exitosas y 10,000 fallidas lee más de 3 páginas.

## Demo: la tabla de comparación

```sh
docker compose run --rm cpp-test btree_demo
docker compose run --rm rust-test btree_demo
```

Imprime las páginas leídas por búsqueda para un árbol B y para un árbol binario de búsqueda en disco, con 1,000 a 1,000,000 de claves. Pasa un límite menor como primer argumento para una ejecución más rápida, por ejemplo `btree_demo 100000`. La salida versionada es [results/page-reads.md](results/page-reads.md).
