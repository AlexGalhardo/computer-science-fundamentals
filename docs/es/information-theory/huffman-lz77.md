# Huffman y LZ77 (MP-INFO-1)

> English version: [docs/en/information-theory/huffman-lz77.md](../../en/information-theory/huffman-lz77.md) · Versão em português: [docs/pt/information-theory/huffman-lz77.md](../../pt/information-theory/huffman-lz77.md)

Código: [projects/information-theory/huffman-lz77](../../../projects/information-theory/huffman-lz77). Lenguajes: Rust y Python.

## Qué enseña

La compresión funciona eliminando **redundancia**, y hay dos tipos distintos:

| Redundancia | Ejemplo | Quién la elimina |
| --- | --- | --- |
| Algunos símbolos son mucho más frecuentes que otros | la letra `e` frente a la letra `z` | un código de símbolos: Huffman |
| Tramos enteros reaparecen | la misma palabra, el mismo encabezado, una racha de ceros | un método de diccionario: LZ77 |

La **entropía** dice cuánto hay del primer tipo y, por tanto, hasta dónde puede llegar un código de símbolos.

## Entropía: la vara de medir

Para un archivo, la entropía de orden 0 es

```text
H = sum over the byte values that appear of  p * log2(1 / p)      p = count / total
```

Es el número promedio de bits por byte que, como mínimo, necesita un código símbolo a símbolo. Un solo valor repetido da 0, y 256 valores igualmente frecuentes dan 8. `H * size / 8` es la cota de entropía en bytes que muestra la tabla.

"Orden 0" importa: cada byte se mira por separado. Un archivo hecho de `0, 1, 2, ..., 255` repetido tiene H = 8 y aun así es extremadamente predecible. La entropía de orden 0 es un límite para los códigos que tratan los símbolos de forma independiente, no para todos los compresores.

## Huffman: códigos cortos para los símbolos frecuentes

```text
counts: A=5  B=2  C=1  D=1

1. join the two lightest:  C(1) + D(1)  -> node 2
2. join the two lightest:  B(2) + node 2 -> node 4
3. join the two lightest:  A(5) + node 4 -> root 9

        (9)
       /   \
      A    (4)            A = 0      1 bit
          /   \           B = 10     2 bits
         B    (2)         C = 110    3 bits
             /   \        D = 111    3 bits
            C     D
                          5*1 + 2*2 + 1*3 + 1*3 = 15 bits instead of 9 * 8 = 72
```

- Los símbolos están solo en las hojas, así que ningún código es el comienzo de otro (un **código prefijo**) y el decodificador nunca necesita separadores.
- Un min-heap entrega los dos nodos más ligeros en O(log n).
- El decodificador necesita el mismo código. Este proyecto guarda solo las **longitudes de código** (256 bytes) y reconstruye los códigos con una regla fija, el código de Huffman canónico. Junto con el tamaño original, el encabezado cuesta 264 bytes.
- La longitud promedio L cumple H ≤ L < H + 1. La igualdad exige que toda probabilidad sea una potencia de 1/2. El mínimo es 1 bit por símbolo, por predecible que sea el archivo.

## LZ77: apuntar a lo que ya se vio

La salida es una lista de tokens `(offset, length, literal)`: copia `length` bytes empezando `offset` bytes atrás, y luego escribe un byte literal.

```text
input:   a b c d e f a b c d e f X
tokens:  (0,0,a) (0,0,b) (0,0,c) (0,0,d) (0,0,e) (0,0,f) (6,6,X)
                                                           |
                                    "6 back, copy 6, then X"
```

- El diccionario son los propios datos, dentro de una **ventana deslizante** de 4,096 bytes. No se envía nada extra: el decodificador reconstruye la ventana a medida que escribe.
- La copia puede ser más larga que el desplazamiento. `a` seguida de `(1, 8, a)` significa diez `a`: la copia lee bytes que acaba de escribir. Así es como una racha larga cuesta un token.
- Encontrar la coincidencia más larga es la parte costosa. Un índice de dónde empezó cada grupo de 3 bytes da los candidatos. Decodificar solo copia, así que es mucho más rápido que codificar.
- Este formato didáctico gasta 4 bytes por token, incluso para un literal solo, así que los datos sin repetición crecen 4 veces.

## La tabla

Cinco muestras generadas de 16,384 bytes. Tamaños en bytes, razón = comprimido / original entre paréntesis.

| Muestra | Bytes | Entropía (bits/byte) | Cota de entropía (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

| Muestra | Qué es | Lección |
| --- | --- | --- |
| `single-symbol` | el byte `a` repetido | H = 0, pero Huffman no puede gastar menos de 1 bit por byte: 2,048 bytes de códigos más el encabezado. LZ77 necesita 65 tokens |
| `byte-cycle` | de 0 a 255, repetido | H = 8 y Huffman solo añade su encabezado. LZ77 ve la repetición y llega al 8%. La entropía de orden 0 no es el límite de un compresor que usa contexto |
| `random` | bytes pseudoaleatorios | ninguna redundancia de ningún tipo. Todo compresor sin pérdida hace más grandes algunas entradas, y aquí lo hacen ambos |
| `skewed` | símbolos independientes con probabilidades 1/2, 1/4, 1/8, 1/8 | los códigos ocupan 3,583 bytes, exactamente la cota: Huffman es óptimo cuando las probabilidades son potencias de 1/2. LZ77 solo encuentra repeticiones casuales |
| `text` | palabras y frases generadas | Huffman se queda a menos del 1% de la cota de orden 0. LZ77 seguido de Huffman baja de esa cota, porque las palabras repetidas son una redundancia que el orden 0 no mide |

La última columna es la idea de DEFLATE (gzip, zip, PNG): la etapa de diccionario elimina los tramos repetidos, y la etapa de entropía exprime luego las estadísticas desiguales de lo que queda.

## Cómo se verifican las respuestas

- **Entropía**: 0 para un símbolo, 8 para bytes uniformes, y distribuciones resueltas a mano (1.5 y 1.75 bits).
- **Ida y vuelta sin pérdida**: `decode(encode(x)) == x` para ambos métodos con texto, binarios y entradas vacías, con las cinco muestras, y con cientos de entradas aleatorias con alfabetos de 1 a 256 símbolos.
- **Casos resueltos a mano**: el árbol de arriba, la copia superpuesta, el token para un tramo repetido.
- **Teorema de codificación de fuente**: en cada muestra la longitud promedio del código de Huffman está entre H y H + 1.
- **Entrada dañada**: los datos truncados o inconsistentes devuelven un error.
- **Dos lenguajes, una respuesta**: las muestras salen de un generador escrito a mano con las mismas constantes en Rust y Python. `fixtures/expected.tsv` contiene tamaños y huellas escritos por el programa en Rust, y las pruebas de ambos lenguajes deben reproducirlo, y también la tabla confirmada en el repositorio, exactamente.

## Ejecución

```sh
./setup-unix-huffman-lz77.sh        # or setup-windows-huffman-lz77.ps1
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

## Temas del quiz relacionados

`information-theory`: `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression`, `encoding-hashing-encryption`.
