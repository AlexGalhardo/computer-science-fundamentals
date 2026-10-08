# Tokenizador BPE

> English version: [docs/en/artificial-intelligence/bpe-tokenizer.md](../../en/artificial-intelligence/bpe-tokenizer.md)

Mini-projeto MP-AI-1, em [`projects/artificial-intelligence/bpe-tokenizer`](../../../projects/artificial-intelligence/bpe-tokenizer). Ensina como o texto vira tokens, e por que um modelo conta tokens e não palavras. A base está na seção 7 da [página da área](README.md#7-tokens-e-tokenização).

## O problema

Uma rede neural calcula com números, então um texto precisa virar uma lista de inteiros. Dar um número a cada palavra exige um vocabulário enorme e ainda falha em uma palavra nunca vista. Dar um número a cada caractere funciona para qualquer texto, mas deixa as sequências muito longas. O byte-pair encoding fica no meio: parte das menores unidades e aprende, a partir de um corpus, quais vizinhos aparecem juntos com tanta frequência que merecem um token próprio.

## Texto são bytes

O tokenizador nunca olha para letras. Ele lê os bytes UTF-8 do texto:

| Texto | Caracteres | Bytes |
| --- | ---: | --- |
| `a` | 1 | `61` |
| `é` | 1 | `c3 a9` |
| `🙂` | 1 | `f0 9f 99 82` |

Um byte tem 256 valores, então o vocabulário base tem exatamente 256 tokens, ids de 0 a 255, e todo texto possível pode ser escrito com eles. É por isso que os testes passam em texto japonês, russo, grego e hebraico, embora o corpus não tenha nenhum.

## Treino

```text
ids = os bytes do corpus
repita N vezes:
    conte todos os pares de vizinhos em ids
    pegue o par mais frequente (a, b)
    crie um token novo com o próximo id livre
    troque todo "a b" em ids pelo token novo
```

As primeiras fusões aprendidas de `data/corpus.txt`:

| # | Novo id | Esquerda | Direita | Novo token | Vezes visto |
| ---: | ---: | --- | --- | --- | ---: |
| 1 | 256 | `"e"` | `" "` | `"e "` | 106 |
| 2 | 257 | `"s"` | `" "` | `"s "` | 87 |
| 3 | 258 | `"t"` | `"o"` | `"to"` | 77 |
| 4 | 259 | `"e"` | `"n"` | `"en"` | 71 |
| 5 | 260 | `"k"` | `"en"` | `"ken"` | 52 |
| 6 | 261 | `"to"` | `"ken"` | `"token"` | 52 |

A fusão 5 usa o token criado pela fusão 4, e a fusão 6 junta dois tokens já fundidos: depois de seis passos a palavra que o corpus mais repete, "token", é um único token. Ninguém disse ao algoritmo o que é uma palavra. Ele encontrou uma sequência frequente de bytes.

Cada fusão acrescenta um token, então **tamanho do vocabulário = 256 + número de fusões**.

### A regra de desempate

Quando dois pares têm a mesma contagem, alguma regra precisa escolher. Este projeto pega o par com o menor id à esquerda e depois o menor id à direita. A escolha é arbitrária, mas precisa estar escrita: as versões em TypeScript e em Python produzem as mesmas 300 fusões só porque compartilham essa regra, e os testes comparam as duas com `data/expected-merges.json`.

## Codificação e decodificação

- **Codificar**: transforme o texto em bytes e repita as fusões na ordem em que foram aprendidas. A ordem importa, porque a fusão 6 precisa dos tokens que as fusões 3 e 5 criaram.
- **Decodificar**: troque cada id pelos seus bytes, junte-os e leia o resultado como UTF-8.

Nenhuma informação se perde em nenhum dos dois sentidos, então `decode(encode(texto)) == texto` para qualquer texto. Os testes conferem isso em ASCII, em texto acentuado, em emoji (inclusive um emoji de família formado por vários code points) e em escritas ausentes do corpus.

Um token é uma sequência de bytes e pode terminar no meio de um caractere. Com poucas fusões os quatro bytes de 🙂 são quatro tokens, e nenhum deles é texto válido sozinho. A CLI imprime um token desses como `<f0>` em vez de um caractere quebrado.

## Tamanho do vocabulário contra número de tokens

Os mesmos textos codificados com as primeiras N fusões:

| Fusões | Tamanho do vocabulário | Tokens da amostra | Bytes por token | Tokens do corpus |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 256 | 227 | 1,00 | 3196 |
| 10 | 266 | 196 | 1,16 | 2581 |
| 25 | 281 | 164 | 1,38 | 2201 |
| 50 | 306 | 147 | 1,54 | 1847 |
| 100 | 356 | 119 | 1,91 | 1482 |
| 200 | 456 | 106 | 2,14 | 1107 |
| 300 | 556 | 95 | 2,39 | 896 |

Três coisas para ler nela:

1. Sem fusões um token é um byte: 227 tokens para 227 bytes.
2. Cada fusão diminui a contagem ou a mantém. Mais vocabulário significa menos tokens.
3. O corpus encolhe mais depressa (para 28% dos seus bytes) que a amostra (para 42%). As fusões foram escolhidas para comprimir o corpus, e só se transferem em parte para um texto em que o tokenizador não treinou. O mesmo acontece em tokenizadores reais com uma língua que era rara nos dados de treino: o texto custa mais tokens.

## Por que os modelos contam tokens

Um modelo roda uma vez para cada token que lê e uma vez para cada token que escreve, então o token é a unidade do seu trabalho, dos seus limites e do seu preço. A frase da demo mostra por que contar palavras ou caracteres seria a medida errada:

```text
"The tokenizer reads ação, função and 🙂."
characters: 39   bytes: 46   tokens: 11   (palavras: 7)
boundaries: The |tokenizer |reads |ação|, |fun|ç|ão |and |🙂|.
```

"tokenizer " é um token porque o corpus está cheio dele. "função" são três. Em outro tokenizador, treinado em outro texto, a mesma frase teria outra contagem.

## O que um tokenizador de produção acrescenta

- Um corpus de gigabytes e dezenas de milhares de fusões.
- Uma primeira divisão do texto em palavras e pontuação, para que uma fusão nunca atravesse a fronteira de uma palavra.
- Tokens especiais que não são texto, como o marcador de fim de documento.
- Estruturas de dados mais rápidas. O laço daqui reconta todos os pares a cada passo, o que basta para 3 kB.

## Como rodar

```sh
cd projects/artificial-intelligence/bpe-tokenizer
./setup-unix-bpe-tokenizer.sh
docker compose run --rm ts-cli "qualquer frase que você quiser"
```
