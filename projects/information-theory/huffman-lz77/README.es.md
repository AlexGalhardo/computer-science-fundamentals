# huffman-lz77

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cuánto puede encogerse un archivo, y por qué? Este miniproyecto mide la **entropía de Shannon** de un archivo, lo comprime con la **codificación de Huffman** (códigos cortos para los bytes frecuentes) y con **LZ77** (referencias a tramos repetidos), y pone los tres números lado a lado para cinco archivos de muestra generados. El mismo código está escrito en Rust y en Python, y los dos producen una salida idéntica byte a byte.

Explicación completa: [docs/es/information-theory/huffman-lz77.md](../../../docs/es/information-theory/huffman-lz77.md).

## Temas del quiz que demuestra

- `information-theory` / `shannon-entropy`: entropía de orden 0 de un archivo, 0 bits para un solo símbolo y 8 bits para bytes uniformes, y por qué el orden 0 no es el límite para un compresor que usa contexto.
- `information-theory` / `source-coding-prefix-codes`: códigos prefijo, decodificación voraz, longitud promedio entre H y H + 1.
- `information-theory` / `huffman-coding`: unir los dos nodos más ligeros con un heap, longitudes de código, el encabezado que necesita el decodificador, el mínimo de 1 bit por símbolo.
- `information-theory` / `arithmetic-coding-lz-family`: tripletas de LZ77 (desplazamiento, longitud, literal), copias superpuestas, la ventana deslizante, LZ77 seguido de Huffman como en DEFLATE.
- `information-theory` / `limits-of-compression`: ida y vuelta sin pérdida, datos aleatorios que crecen al "comprimirlos".
- `information-theory` / `encoding-hashing-encryption`: los datos que parecen aleatorios (como un texto cifrado) no se pueden comprimir.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-huffman-lz77.sh        # Linux and macOS
./setup-windows-huffman-lz77.ps1    # Windows
```

El script construye las dos imágenes fijadas y ejecuta, para cada lenguaje, la verificación del formateador, el linter y las pruebas.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `rust/src/entropy.rs`, `python/entropy.py` | entropía de Shannon de orden 0 de una secuencia de bytes |
| `rust/src/huffman.rs`, `python/huffman.py` | árbol de Huffman, códigos canónicos, codificador y decodificador |
| `rust/src/lz77.rs`, `python/lz77.py` | tokens de LZ77, codificador y decodificador |
| `rust/src/samples.rs`, `python/samples.py` | los cinco archivos de muestra generados |
| `rust/src/report.rs`, `python/report.py` | la tabla comparativa y el fixture entre lenguajes |
| `rust/src/main.rs` | línea de comandos: `compare`, `entropy`, `compress`, `decompress` |
| `fixtures/expected.tsv` | tamaños y huellas que ambos lenguajes deben reproducir |
| `results/comparison-table.md` | la tabla confirmada en el repositorio |

El crate de Rust no tiene dependencias y el código de Python usa solo la biblioteca estándar.

## Pruebas

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- Entropía: un símbolo repetido da 0 y los bytes uniformes dan 8 bits por byte.
- Ida y vuelta `decode(encode(x)) == x` para Huffman y LZ77 con texto, binarios y entradas vacías, con las cinco muestras y con cientos de entradas aleatorias.
- Casos conocidos resueltos a mano: longitudes de Huffman 1, 2, 3, 3 para las cuentas 5, 2, 1, 1; la copia superpuesta de LZ77 que convierte `ab` + (2, 4, `c`) en `abababc`.
- Una entrada dañada se rechaza con un error en lugar de producir datos incorrectos.
- Ambos lenguajes reproducen exactamente `fixtures/expected.tsv` y `results/comparison-table.md`, lo que demuestra que generan las mismas muestras y los mismos bytes comprimidos.

## Demo

```sh
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

Ambos imprimen la tabla de abajo (tamaños en bytes, razón = comprimido / original entre paréntesis). Los tamaños son deterministas, así que la tabla no depende de la máquina.

| Muestra | Bytes | Entropía (bits/byte) | Cota de entropía (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

Qué leer en ella:

- **`skewed`**: Huffman cae sobre la cota de entropía (3,583 bytes de códigos más el encabezado de 264 bytes). LZ77 lo hace mucho peor, porque los símbolos independientes no tienen estructura repetida a la que apuntar.
- **`single-symbol`**: la entropía es 0, y aun así Huffman no puede bajar de 1 bit por byte. LZ77 describe el archivo entero con 65 tokens.
- **`byte-cycle`**: la entropía de orden 0 es la máxima, 8 bits, y Huffman no gana nada, pero LZ77 reduce el archivo al 8%. La entropía de orden 0 acota solo los códigos de símbolo.
- **`random`**: nada se comprime. Huffman añade su encabezado, y este formato simple de LZ77 multiplica el tamaño por 4.
- **`text`**: existen ambas redundancias, y LZ77 seguido de Huffman supera a cada uno por separado y a la cota de orden 0.

Para comprimir un archivo propio (ejecuta desde esta carpeta; en Windows PowerShell usa `${PWD}` en lugar de `$PWD`):

```sh
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- compress huffman /data/README.md /data/README.huff
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- entropy /data/README.md
```

## Límites

Formatos didácticos, no de producción: el encabezado de Huffman siempre cuesta 264 bytes, LZ77 gasta 4 bytes en cada token (incluso para un solo literal), la ventana es de 4,096 bytes y los archivos completos se leen en memoria. Formatos reales como DEFLATE corrigen cada uno de estos puntos.
