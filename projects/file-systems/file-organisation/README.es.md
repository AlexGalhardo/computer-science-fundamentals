# file-organisation

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cómo viven los registros, el espacio libre y los índices dentro de archivos, escrito en C++ y en Rust. Un archivo de datos de registros de longitud fija con una cabecera da acceso directo por número relativo de registro (RRN) y reutiliza los slots eliminados mediante una lista de libres guardada dentro del archivo. Un índice primario y dos índices secundarios con listas invertidas responden búsquedas sin recorrer el archivo. La codificación run-length y la codificación de Huffman comprimen el archivo de datos e informan la razón de compresión.

Ítem del plan: MP-FS-1. Explicación completa: [docs/es/file-systems/file-organisation.md](../../../docs/es/file-systems/file-organisation.md).

## Qué enseña

- Con registros de longitud fija la posición de un registro se calcula, no se busca: desplazamiento en bytes = 32 + RRN x 64. Un seek lee cualquier registro.
- Eliminar marca un slot y lo apila en una pila cuya cabeza está en la cabecera. La siguiente inserción lo desapila, así que el archivo no crece mientras haya slots libres.
- Un índice separa el orden de búsqueda de los datos: entradas pequeñas y ordenadas en memoria, registros en orden de llegada en disco. Una búsqueda por ciudad lee solo los slots que coinciden, donde un barrido lee todos los slots del archivo.
- Un índice secundario que guarda claves primarias (enlace tardío) no cambia cuando un registro se elimina o se mueve. Solo cambia el índice primario.
- Un índice mantenido en memoria necesita un indicador de desactualizado en disco, para que una sesión que terminó mal se detecte y el índice se reconstruya a partir de los datos.
- El relleno comprime muy bien. La codificación run-length elimina las secuencias de espacios, la codificación de Huffman da códigos cortos a los bytes frecuentes, y las dos pueden encadenarse.

## Temas del quiz que demuestra

Área `file-systems`:

- `record-organisation`: registros de longitud fija y su relleno, registro de cabecera, RRN y desplazamiento en bytes, por qué el acceso directo necesita un tamaño fijo.
- `indexes`: índice simple y búsqueda binaria, índice secundario, listas invertidas, enlace tardío, combinación de dos listas (AND), el indicador de desactualizado y la reconstrucción.
- `compression-and-space-reclamation`: lista de libres como pila dentro del archivo, codificación run-length, códigos de Huffman y la propiedad de prefijo.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-file-organisation.sh        # Linux y macOS
./setup-windows-file-organisation.ps1    # Windows
```

El script construye una imagen fijada por lenguaje (`gcc:16.2.0-trixie` y `rust:1.99.0-slim-trixie`) y ejecuta la comprobación de formato, el linter y las pruebas en cada una. No se instala nada en el host y no hay más dependencia que la biblioteca estándar de cada lenguaje. Todo archivo que crean los programas vive en `/tmp` dentro del contenedor.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/record_file.hpp`, `rust/src/record_file.rs` | el archivo de datos: cabecera, slots de longitud fija, acceso por RRN, lista de libres |
| `cpp/indexes.hpp`, `rust/src/indexes.rs` | índice primario con búsqueda binaria contada, índice secundario con listas invertidas, matching cosecuencial |
| `cpp/database.hpp`, `rust/src/database.rs` | archivo de datos más índices: insertar, eliminar, buscar por id, ciudad y año, barrido completo, indicador de desactualizado y reconstrucción |
| `cpp/compression.hpp`, `rust/src/compression.rs` | codificación run-length y codificación de Huffman |
| `cpp/workload.hpp`, `rust/src/workload.rs` | generador con semilla de registros y la demo |
| `cpp/demo.cpp`, `rust/src/demo.rs` | el comando de la demo |
| `results/demo.md` | la salida versionada de la demo |

Ambos lenguajes usan los mismos formatos de archivo (enteros little-endian en desplazamientos fijos), los mismos algoritmos y el mismo generador pseudoaleatorio (SplitMix64, semilla 20261007), así que escriben archivos idénticos byte a byte e imprimen las mismas tablas.

## Pruebas

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Lista de libres (MP-FS-1.1)**: 1.000 registros ocupan 32 + 1.000 x 64 bytes. Tras 334 eliminaciones el archivo tiene el mismo tamaño, tras 334 inserciones sigue teniendo el mismo tamaño y todo registro nuevo fue a un slot por debajo de 1.000, y una inserción más lo hace crecer exactamente 64 bytes. Los slots se reutilizan en orden LIFO, y la cabecera y los registros se leen de vuelta tras reabrir el archivo.
- **Índice contra barrido (MP-FS-1.2)**: 6.000 inserciones y eliminaciones aleatorias sobre 3.000 ids, comprobadas contra el mapa ordenado del lenguaje. Luego, para cada una de las 12 ciudades, 27 años y 27 pares de ciudad y año, la búsqueda por los índices devuelve exactamente los registros de un barrido completo. La comparación se repite con índices cargados desde disco y con índices reconstruidos tras una sesión que no se cerró.
- **Compresión (MP-FS-1.3)**: ambos métodos y su encadenamiento devuelven los bytes originales para nueve entradas (vacía, un byte, un byte distinto, solo bytes marcador, secuencias, un alfabeto sesgado, bytes aleatorios, el archivo de datos). Se verifican tamaños calculados a mano: 18 bytes con dos secuencias largas pasan a 10, y 100 símbolos con frecuencias 45, 25, 15, 10 y 5 ocupan 200 bits.
- **Demo**: la salida de la demo es igual a `results/demo.md`, en ambos lenguajes.

## Demo

```sh
docker compose run --rm cpp-test forg_demo
docker compose run --rm rust-test forg_demo
```

Imprime cuatro tablas para 10.000 registros: tamaño del archivo tras cada paso del escenario de la lista de libres, slots leídos por un barrido contra slots leídos mediante el índice, qué hizo la siguiente apertura tras un final limpio y uno no limpio, y los tamaños comprimidos con sus razones. Pasa otro número de registros (100 a 50.000) como primer argumento. Todo número es una cuenta, no un tiempo, así que la salida no depende de la máquina. La salida versionada es [results/demo.md](results/demo.md):

| Método | Bytes | Razón (comprimido / original) |
| --- | ---: | ---: |
| ninguno | 672.096 | 1,000 |
| run-length | 452.375 | 0,673 |
| Huffman | 383.834 | 0,571 |
| run-length, luego Huffman | 357.092 | 0,531 |

## Límites

- Los registros tienen solo longitud fija. Los registros de longitud variable, con first-fit, best-fit y worst-fit, los cubre el quiz y no están implementados.
- Los índices secundarios nunca se limpian mientras los archivos están abiertos: las claves de los registros eliminados permanecen en las listas y se filtran a través del índice primario. Una reconstrucción es lo que las elimina.
- El archivo de Huffman guarda las 256 frecuencias (1.032 bytes de cabecera), así que las entradas pequeñas se vuelven más grandes.
- Huffman y LZ77 frente a la entropía de la fuente son el tema de otro mini-proyecto, `projects/information-theory/huffman-lz77`. No se comparte código: este mini-proyecto tiene su propio codificador de Huffman.
