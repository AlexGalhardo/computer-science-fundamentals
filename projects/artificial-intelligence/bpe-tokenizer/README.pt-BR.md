# bpe-tokenizer

> English version: [README.md](README.md)

Ensina **como o texto vira tokens, e por que um modelo conta tokens e não palavras**. Um tokenizador de byte-pair encoding (BPE) é treinado em um pequeno corpus escrito para o projeto, codifica e decodifica qualquer texto sem perda, mostra os tokens de uma frase com os seus ids e fronteiras, e tabela como o número de tokens do mesmo texto cai conforme o vocabulário cresce.

Explicação completa: [docs/pt/artificial-intelligence/bpe-tokenizer.md](../../../docs/pt/artificial-intelligence/bpe-tokenizer.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `tokenization`: o que é um token, o treino do BPE (contar os pares, fundir o mais frequente), tamanho do vocabulário = 256 bytes + fusões, bytes UTF-8 como vocabulário base, codificação e decodificação sem perda, mais fusões dando menos tokens, tokens contra palavras e caracteres.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-bpe-tokenizer.sh        # Linux e macOS
./setup-windows-bpe-tokenizer.ps1    # Windows
```

O script constrói as duas imagens, roda os testes, roda as duas demos e mostra os tokens de uma frase.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `data/corpus.txt` | o texto de treino, em inglês e português, escrito para este projeto |
| `data/sample.txt` | um texto que não está no corpus, usado para contar tokens |
| `data/expected-table.json`, `data/expected-merges.json` | a tabela e as fusões que as duas implementações precisam reproduzir |
| `ts/src/bpe.ts` | o tokenizador: `train`, `encode`, `decode` |
| `ts/src/cli.ts` | mostra os tokens de uma frase |
| `ts/src/demo.ts` | imprime as tabelas e grava `results/results-ts.md` |
| `python/bpe.py`, `python/cli.py`, `python/demo.py` | o mesmo em Python, gravando `results/results-python.md` |
| `results/` | resultados versionados das duas linguagens |

O TypeScript é a implementação de referência (`oven/bun:1.4.2`). O Python (`python:3.14.8-slim-trixie`) está aqui porque a lição muda: `bytes` é um tipo nativo, então "um token é uma sequência de bytes" fica visível no código, e obter o mesmo vocabulário em duas linguagens mostra que o algoritmo só está todo especificado quando a regra de desempate está escrita. Nenhuma das implementações tem dependências de execução.

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

O serviço Python também roda `ruff check` e `ruff format --check`. As duas suítes conferem a ida e volta em texto ASCII, acentuado, com emoji e nunca visto, e comparam a sua tabela e as suas fusões com os arquivos em `data/`, e é assim que o "idêntico nas duas linguagens" é verificado.

## Demo

Um comando imprime os tokens de uma frase:

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

39 caracteres, 46 bytes, 11 tokens: três contagens diferentes para a mesma frase. "ação" está no corpus e virou um token. "função" não é uma unidade frequente o bastante, então é cortada em três pedaços conhecidos.

A tabela "tamanho do vocabulário contra número de tokens" vem das demos:

```sh
docker compose run --rm ts-demo        # grava results/results-ts.md
docker compose run --rm python-demo    # grava results/results-python.md
```

| Fusões | Tamanho do vocabulário | Tokens da amostra | Bytes por token | Tokens do corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1,00 | 3196 |
| 10 | 266 | 196 | 1,16 | 2581 |
| 25 | 281 | 164 | 1,38 | 2201 |
| 50 | 306 | 147 | 1,54 | 1847 |
| 100 | 356 | 119 | 1,91 | 1482 |
| 200 | 456 | 106 | 2,14 | 1107 |
| 300 | 556 | 95 | 2,39 | 896 |

Não há dashboard: as tabelas em [`results/`](results/) são o resultado, e são contagens, então são as mesmas em qualquer máquina.

## Limites

O corpus tem cerca de 3 kB, então o vocabulário é minúsculo e moldado àquele texto. Um tokenizador de produção é treinado em gigabytes, tem dezenas de milhares de fusões, divide o texto em palavras antes de fundir e acrescenta tokens especiais, como o marcador de fim de texto. Nada disso muda o algoritmo mostrado aqui.
