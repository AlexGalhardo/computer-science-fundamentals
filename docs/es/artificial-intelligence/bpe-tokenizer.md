# Tokenizador BPE

> English version: [docs/en/artificial-intelligence/bpe-tokenizer.md](../../en/artificial-intelligence/bpe-tokenizer.md) · Versão em português: [docs/pt/artificial-intelligence/bpe-tokenizer.md](../../pt/artificial-intelligence/bpe-tokenizer.md)

Miniproyecto MP-AI-1, en [`projects/artificial-intelligence/bpe-tokenizer`](../../../projects/artificial-intelligence/bpe-tokenizer). Enseña cómo el texto se convierte en tokens, y por qué un modelo cuenta tokens y no palabras. La base está en la sección 7 de [la página del área](README.md#7-tokens-y-tokenización).

## El problema

Una red neuronal calcula con números, así que un texto debe convertirse en una lista de enteros. Dar un número a cada palabra exige un vocabulario enorme y aun así falla con una palabra que nunca vio. Dar un número a cada carácter sirve para cualquier texto, pero hace las secuencias muy largas. El byte-pair encoding está en un punto intermedio: parte de las unidades más pequeñas y aprende, a partir de un corpus, qué vecinos aparecen juntos con tanta frecuencia que merecen un token propio.

## El texto son bytes

El tokenizador nunca mira letras. Lee los bytes UTF-8 del texto:

| Texto | Caracteres | Bytes |
| --- | ---: | --- |
| `a` | 1 | `61` |
| `é` | 1 | `c3 a9` |
| `🙂` | 1 | `f0 9f 99 82` |

Un byte tiene 256 valores, así que el vocabulario base tiene exactamente 256 tokens, los ids 0 a 255, y todo texto posible se puede escribir con ellos. Por eso las pruebas pasan con texto en japonés, ruso, griego y hebreo aunque el corpus no tenga ninguno.

## Entrenamiento

```text
ids = the bytes of the corpus
repeat N times:
    count every pair of neighbours in ids
    take the most frequent pair (a, b)
    create a new token with the next free id
    replace every "a b" in ids by the new token
```

Las primeras fusiones aprendidas de `data/corpus.txt`:

| # | New id | Left | Right | New token | Times seen |
| ---: | ---: | --- | --- | --- | ---: |
| 1 | 256 | `"e"` | `" "` | `"e "` | 106 |
| 2 | 257 | `"s"` | `" "` | `"s "` | 87 |
| 3 | 258 | `"t"` | `"o"` | `"to"` | 77 |
| 4 | 259 | `"e"` | `"n"` | `"en"` | 71 |
| 5 | 260 | `"k"` | `"en"` | `"ken"` | 52 |
| 6 | 261 | `"to"` | `"ken"` | `"token"` | 52 |

La fusión 5 usa el token creado por la fusión 4, y la fusión 6 une dos tokens ya fusionados: tras seis pasos, la palabra que más repite el corpus, "token", es un solo token. Nadie le dijo al algoritmo qué es una palabra. Encontró una secuencia frecuente de bytes.

Cada fusión añade un token, así que **tamaño del vocabulario = 256 + número de fusiones**.

### La regla de desempate

Cuando dos pares tienen el mismo conteo, alguna regla debe elegir. Este proyecto toma el par con el menor id de la izquierda y luego el menor id de la derecha. La elección es arbitraria, pero tiene que estar escrita: las versiones en TypeScript y en Python producen las mismas 300 fusiones solo porque comparten esta regla, y las pruebas comparan ambas con `data/expected-merges.json`.

## Codificación y decodificación

- **Codificar**: convertir el texto en bytes y repetir las fusiones en el orden en que se aprendieron. El orden importa, porque la fusión 6 necesita los tokens que crearon las fusiones 3 y 5.
- **Decodificar**: reemplazar cada id por sus bytes, unirlos y leer el resultado como UTF-8.

No se pierde información en ninguna dirección, así que `decode(encode(text)) == text` para cualquier texto. Las pruebas lo comprueban con ASCII, con texto con acentos, con emojis (incluido un emoji de familia formado por varios puntos de código) y con escrituras ausentes del corpus.

Un token es una secuencia de bytes y puede detenerse a mitad de un carácter. Con pocas fusiones, los cuatro bytes de 🙂 son cuatro tokens, y ninguno es texto válido por sí solo. La CLI imprime un token así como `<f0>` en lugar de un carácter roto.

## Tamaño del vocabulario frente a número de tokens

Los mismos textos codificados con las primeras N fusiones:

| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1.00 | 3196 |
| 10 | 266 | 196 | 1.16 | 2581 |
| 25 | 281 | 164 | 1.38 | 2201 |
| 50 | 306 | 147 | 1.54 | 1847 |
| 100 | 356 | 119 | 1.91 | 1482 |
| 200 | 456 | 106 | 2.14 | 1107 |
| 300 | 556 | 95 | 2.39 | 896 |

Tres cosas para leer en ella:

1. Sin fusiones, un token es un byte: 227 tokens para 227 bytes.
2. Cada fusión baja el conteo o lo mantiene. Más vocabulario significa menos tokens.
3. El corpus se encoge más rápido (hasta el 28% de sus bytes) que la muestra (hasta el 42%). Las fusiones se eligieron para comprimir el corpus, y solo se transfieren en parte a un texto con el que el tokenizador no se entrenó. Lo mismo ocurre en los tokenizadores reales con un idioma poco frecuente en sus datos de entrenamiento: el texto cuesta más tokens.

## Por qué los modelos cuentan tokens

Un modelo se ejecuta una vez por cada token que lee y una vez por cada token que escribe, así que el token es la unidad de su trabajo, de sus límites y de su precio. La frase de la demo muestra por qué contar palabras o caracteres sería la medida equivocada:

```text
"The tokenizer reads ação, função and 🙂."
characters: 39   bytes: 46   tokens: 11   (words: 7)
boundaries: The |tokenizer |reads |ação|, |fun|ç|ão |and |🙂|.
```

"tokenizer " es un token porque el corpus está lleno de esa palabra. "função" son tres. En otro tokenizador, entrenado con otro texto, la misma frase tendría un conteo distinto.

## Qué añade un tokenizador de producción

- Un corpus de gigabytes y decenas de miles de fusiones.
- Una primera división del texto en palabras y puntuación, para que una fusión nunca cruce el límite de una palabra.
- Tokens especiales que no son texto, como la marca de fin de un documento.
- Estructuras de datos más rápidas. El bucle de aquí vuelve a contar todos los pares en cada paso, lo que está bien para 3 kB.

## Ejecútalo

```sh
cd projects/artificial-intelligence/bpe-tokenizer
./setup-unix-bpe-tokenizer.sh
docker compose run --rm ts-cli "any sentence you like"
```
