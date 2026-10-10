# bpe-tokenizer

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **cómo el texto se convierte en tokens, y por qué un modelo cuenta tokens y no palabras**. Un tokenizador de byte-pair encoding (BPE) se entrena con un corpus pequeño escrito para el proyecto, codifica y decodifica cualquier texto sin pérdida, muestra los tokens de una frase con sus ids y sus límites, y tabula cómo baja el número de tokens del mismo texto a medida que crece el vocabulario.

Explicación completa: [docs/es/artificial-intelligence/bpe-tokenizer.md](../../../docs/es/artificial-intelligence/bpe-tokenizer.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `tokenization`: qué es un token, el entrenamiento de BPE (contar los pares, fusionar el más frecuente), tamaño del vocabulario = 256 bytes + fusiones, los bytes UTF-8 como vocabulario base, codificación y decodificación sin pérdida, más fusiones dan menos tokens, tokens frente a palabras y caracteres.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-bpe-tokenizer.sh        # Linux and macOS
./setup-windows-bpe-tokenizer.ps1    # Windows
```

El script construye las dos imágenes, ejecuta las pruebas, ejecuta las dos demos y muestra los tokens de una frase.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `data/corpus.txt` | el texto de entrenamiento, en inglés y portugués, escrito para este proyecto |
| `data/sample.txt` | un texto que no está en el corpus, usado para contar tokens |
| `data/expected-table.json`, `data/expected-merges.json` | la tabla y las fusiones que ambas implementaciones deben reproducir |
| `ts/src/bpe.ts` | el tokenizador: `train`, `encode`, `decode` |
| `ts/src/cli.ts` | muestra los tokens de una frase |
| `ts/src/demo.ts` | imprime las tablas y escribe `results/results-ts.md` |
| `python/bpe.py`, `python/cli.py`, `python/demo.py` | lo mismo en Python, escribiendo `results/results-python.md` |
| `results/` | resultados confirmados (committed) de ambos lenguajes |

TypeScript es la implementación de referencia (`oven/bun:1.4.2`). Python (`python:3.14.8-slim-trixie`) está aquí porque la lección cambia: `bytes` es un tipo incorporado, así que "un token es una secuencia de bytes" se ve en el código, y obtener el mismo vocabulario en dos lenguajes muestra que el algoritmo solo está totalmente especificado cuando se escribe la regla de desempate. Ninguna de las dos implementaciones tiene dependencias en tiempo de ejecución.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

El servicio de Python también ejecuta `ruff check` y `ruff format --check`. Ambas suites comprueban la ida y vuelta con texto ASCII, con acentos, con emojis y nunca visto, y comparan su tabla y sus fusiones con los archivos de `data/`, que es como se verifica que son "idénticos en ambos lenguajes".

## Demo

Un comando imprime los tokens de una frase:

```sh
docker compose run --rm ts-cli "The tokenizer reads ação, função and 🙂."
docker compose run --rm python-cli --merges 50 "The tokenizer reads ação, função and 🙂."
```

```text
text:       "The tokenizer reads ação, função and 🙂."
characters: 39   bytes: 46   tokens: 11
vocabulary: 556 (256 bytes + 300 merges)

   id  bytes                 text
  293  54 68 65 20           "The "
  332  74 6f 6b 65 6e 69 7a 65 72 20  "tokenizer "
  552  72 65 61 64 73 20     "reads "
  451  61 c3 a7 c3 a3 6f     "ação"
  287  2c 20                 ", "
  386  66 75 6e              "fun"
  307  c3 a7                 "ç"
  309  c3 a3 6f 20           "ão "
  303  61 6e 64 20           "and "
  513  f0 9f 99 82           "🙂"
   46  2e                    "."

boundaries: The |tokenizer |reads |ação|, |fun|ç|ão |and |🙂|.
ids:        293 332 552 451 287 386 307 309 303 513 46
round trip: decode(encode(text)) == text
```

39 caracteres, 46 bytes, 11 tokens: tres conteos distintos para la misma frase. "ação" está en el corpus y se volvió un solo token. "função" no es una unidad lo bastante frecuente, así que se corta en tres piezas conocidas.

La tabla "tamaño del vocabulario frente a número de tokens" sale de las demos:

```sh
docker compose run --rm ts-demo        # writes results/results-ts.md
docker compose run --rm python-demo    # writes results/results-python.md
```

| Merges | Vocabulary size | Tokens of the sample | Bytes per token | Tokens of the corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1.00 | 3196 |
| 10 | 266 | 196 | 1.16 | 2581 |
| 25 | 281 | 164 | 1.38 | 2201 |
| 50 | 306 | 147 | 1.54 | 1847 |
| 100 | 356 | 119 | 1.91 | 1482 |
| 200 | 456 | 106 | 2.14 | 1107 |
| 300 | 556 | 95 | 2.39 | 896 |

No hay panel (dashboard): las tablas de [`results/`](results/) son el resultado, y son conteos, así que son iguales en cualquier máquina.

## Límites

El corpus tiene unos 3 kB, así que el vocabulario es diminuto y está ajustado a ese texto. Un tokenizador de producción se entrena con gigabytes, tiene decenas de miles de fusiones, divide el texto en palabras antes de fusionar y añade tokens especiales como la marca de fin de texto. Nada de eso cambia el algoritmo que se muestra aquí.
