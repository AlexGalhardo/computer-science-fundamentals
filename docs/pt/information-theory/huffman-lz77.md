# Huffman e LZ77 (MP-INFO-1)

> English version: [docs/en/information-theory/huffman-lz77.md](../../en/information-theory/huffman-lz77.md) · Versión en español: [docs/es/information-theory/huffman-lz77.md](../../es/information-theory/huffman-lz77.md)

Código: [projects/information-theory/huffman-lz77](../../../projects/information-theory/huffman-lz77). Linguagens: Rust e Python.

## O que ensina

A compressão funciona removendo **redundância**, e existem dois tipos diferentes dela:

| Redundância | Exemplo | Quem remove |
| --- | --- | --- |
| Alguns símbolos são muito mais frequentes que outros | a letra `e` contra a letra `z` | um código de símbolo: Huffman |
| Trechos inteiros voltam a aparecer | a mesma palavra, o mesmo cabeçalho, uma sequência de zeros | um método de dicionário: LZ77 |

A **entropia** diz quanto existe do primeiro tipo e, portanto, até onde um código de símbolo pode ir.

## Entropia: a régua

Para um arquivo, a entropia de ordem 0 é

```text
H = soma, sobre os valores de byte que aparecem, de  p * log2(1 / p)      p = contagem / total
```

É o número médio de bits por byte que um código símbolo a símbolo precisa no mínimo. Um valor repetido dá 0, e 256 valores igualmente frequentes dão 8. `H * tamanho / 8` é o limite da entropia em bytes mostrado na tabela.

"Ordem 0" importa: cada byte é olhado sozinho. Um arquivo formado por `0, 1, 2, ..., 255` repetido tem H = 8 e mesmo assim é extremamente previsível. A entropia de ordem 0 é um limite para códigos que tratam os símbolos de forma independente, e não para todo compressor.

## Huffman: códigos curtos para símbolos frequentes

```text
contagens: A=5  B=2  C=1  D=1

1. une os dois mais leves:  C(1) + D(1)  -> nó 2
2. une os dois mais leves:  B(2) + nó 2  -> nó 4
3. une os dois mais leves:  A(5) + nó 4  -> raiz 9

        (9)
       /   \
      A    (4)            A = 0      1 bit
          /   \           B = 10     2 bits
         B    (2)         C = 110    3 bits
             /   \        D = 111    3 bits
            C     D
                          5*1 + 2*2 + 1*3 + 1*3 = 15 bits em vez de 9 * 8 = 72
```

- Os símbolos ficam apenas nas folhas, então nenhum código é o começo de outro (um **código de prefixo**) e o decodificador nunca precisa de separadores.
- Um min-heap entrega os dois nós mais leves em O(log n).
- O decodificador precisa do mesmo código. Este projeto grava apenas os **comprimentos dos códigos** (256 bytes) e reconstrói os códigos com uma regra fixa, o código de Huffman canônico. Com o tamanho original, o cabeçalho custa 264 bytes.
- O comprimento médio L satisfaz H ≤ L < H + 1. A igualdade exige que toda probabilidade seja uma potência de 1/2. O piso é 1 bit por símbolo, por mais previsível que o arquivo seja.

## LZ77: aponte para o que já foi visto

A saída é uma lista de tokens `(deslocamento, comprimento, literal)`: copie `comprimento` bytes começando `deslocamento` bytes atrás e depois escreva um byte literal.

```text
entrada: a b c d e f a b c d e f X
tokens:  (0,0,a) (0,0,b) (0,0,c) (0,0,d) (0,0,e) (0,0,f) (6,6,X)
                                                           |
                                 "6 para trás, copie 6, depois X"
```

- O dicionário são os próprios dados, dentro de uma **janela deslizante** de 4.096 bytes. Nada extra é enviado: o decodificador reconstrói a janela enquanto escreve.
- A cópia pode ser mais longa que o deslocamento. `a` seguido de `(1, 8, a)` significa dez `a`: a cópia lê bytes que acabou de escrever. É assim que uma sequência longa custa um token.
- Achar a repetição mais longa é a parte cara. Um índice de onde cada grupo de 3 bytes começou fornece os candidatos. Decodificar só copia, então é muito mais rápido que codificar.
- Este formato didático gasta 4 bytes por token, mesmo para um literal isolado, então dados sem repetição crescem 4 vezes.

## A tabela

Cinco amostras geradas de 16.384 bytes. Tamanhos em bytes, taxa = comprimido / original entre parênteses.

| Amostra | Bytes | Entropia (bits/byte) | Limite da entropia (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

| Amostra | O que é | Lição |
| --- | --- | --- |
| `single-symbol` | o byte `a` repetido | H = 0, mas Huffman não consegue gastar menos de 1 bit por byte: 2.048 bytes de códigos mais o cabeçalho. O LZ77 precisa de 65 tokens |
| `byte-cycle` | 0 a 255, repetido | H = 8 e Huffman só acrescenta seu cabeçalho. O LZ77 enxerga a repetição e chega a 8%. A entropia de ordem 0 não é o limite de um compressor que usa contexto |
| `random` | bytes pseudoaleatórios | nenhuma redundância de nenhum dos tipos. Todo compressor sem perdas aumenta algumas entradas, e aqui os dois aumentam |
| `skewed` | símbolos independentes com probabilidades 1/2, 1/4, 1/8, 1/8 | os códigos ocupam 3.583 bytes, exatamente o limite: Huffman é ótimo quando as probabilidades são potências de 1/2. O LZ77 só encontra repetições casuais |
| `text` | palavras e frases geradas | Huffman fica a 1% do limite de ordem 0. LZ77 seguido de Huffman fica abaixo desse limite, porque palavras repetidas são uma redundância que a ordem 0 não mede |

A última coluna é a ideia do DEFLATE (gzip, zip, PNG): o estágio de dicionário remove os trechos repetidos, e o estágio de entropia então espreme as estatísticas desiguais do que sobrou.

## Como as respostas são verificadas

- **Entropia**: 0 para um símbolo, 8 para bytes uniformes, e distribuições feitas à mão (1,5 e 1,75 bit).
- **Ida e volta sem perdas**: `decode(encode(x)) == x` para os dois métodos em entradas de texto, binárias e vazias, nas cinco amostras e em centenas de entradas aleatórias com alfabetos de 1 a 256 símbolos.
- **Casos feitos à mão**: a árvore acima, a cópia sobreposta, o token de um trecho repetido.
- **Teorema da codificação de fonte**: em toda amostra, o comprimento médio do código de Huffman fica entre H e H + 1.
- **Entrada danificada**: dados truncados ou inconsistentes retornam erro.
- **Duas linguagens, uma resposta**: as amostras vêm de um gerador escrito à mão com as mesmas constantes em Rust e em Python. `fixtures/expected.tsv` guarda tamanhos e impressões digitais escritos pelo programa em Rust, e os testes das duas linguagens precisam reproduzi-lo, e também a tabela versionada, exatamente.

## Como rodar

```sh
./setup-unix-huffman-lz77.sh        # ou setup-windows-huffman-lz77.ps1
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

## Tópicos do quiz relacionados

`information-theory`: `shannon-entropy`, `source-coding-prefix-codes`, `huffman-coding`, `arithmetic-coding-lz-family`, `limits-of-compression`, `encoding-hashing-encryption`.
