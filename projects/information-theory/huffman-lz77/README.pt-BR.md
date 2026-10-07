# huffman-lz77

> English version: [README.md](README.md)

Até onde um arquivo pode encolher, e por quê? Este mini-projeto mede a **entropia de Shannon** de um arquivo, comprime-o com **Huffman** (códigos curtos para bytes frequentes) e com **LZ77** (referências a trechos repetidos), e coloca os três números lado a lado para cinco arquivos de amostra gerados. O mesmo código está escrito em Rust e em Python, e os dois produzem saídas idênticas byte a byte.

Explicação completa: [docs/pt/information-theory/huffman-lz77.md](../../../docs/pt/information-theory/huffman-lz77.md).

## Tópicos do quiz que ele demonstra

- `information-theory` / `shannon-entropy`: entropia de ordem 0 de um arquivo, 0 bit para um símbolo e 8 bits para bytes uniformes, e por que a ordem 0 não é o limite de um compressor que usa contexto.
- `information-theory` / `source-coding-prefix-codes`: códigos de prefixo, decodificação gulosa, comprimento médio entre H e H + 1.
- `information-theory` / `huffman-coding`: união dos dois nós mais leves com um heap, comprimentos dos códigos, o cabeçalho de que o decodificador precisa, o piso de 1 bit por símbolo.
- `information-theory` / `arithmetic-coding-lz-family`: triplas do LZ77 (deslocamento, comprimento, literal), cópias sobrepostas, a janela deslizante, LZ77 seguido de Huffman como no DEFLATE.
- `information-theory` / `limits-of-compression`: ida e volta sem perdas, dados aleatórios que crescem ao serem "comprimidos".
- `information-theory` / `encoding-hashing-encryption`: dados que parecem aleatórios (como texto cifrado) não podem ser comprimidos.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-huffman-lz77.sh        # Linux e macOS
./setup-windows-huffman-lz77.ps1    # Windows
```

O script constrói as duas imagens fixadas e roda, para cada linguagem, a checagem do formatador, o linter e os testes.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `rust/src/entropy.rs`, `python/entropy.py` | entropia de Shannon de ordem 0 de uma sequência de bytes |
| `rust/src/huffman.rs`, `python/huffman.py` | árvore de Huffman, códigos canônicos, codificador e decodificador |
| `rust/src/lz77.rs`, `python/lz77.py` | tokens do LZ77, codificador e decodificador |
| `rust/src/samples.rs`, `python/samples.py` | os cinco arquivos de amostra gerados |
| `rust/src/report.rs`, `python/report.py` | a tabela comparativa e o fixture entre linguagens |
| `rust/src/main.rs` | linha de comando: `compare`, `entropy`, `compress`, `decompress` |
| `fixtures/expected.tsv` | tamanhos e impressões digitais que as duas linguagens precisam reproduzir |
| `results/comparison-table.md` | a tabela versionada |

O crate Rust não tem dependências e o código Python usa apenas a biblioteca padrão.

## Testes

```sh
docker compose run --rm rust-test
docker compose run --rm python-test
```

- Entropia: um símbolo repetido dá 0 e bytes uniformes dão 8 bits por byte.
- Ida e volta `decode(encode(x)) == x` para Huffman e LZ77 em entradas de texto, binárias e vazias, nas cinco amostras e em centenas de entradas aleatórias.
- Casos conhecidos feitos à mão: comprimentos de Huffman 1, 2, 3, 3 para as contagens 5, 2, 1, 1; a cópia sobreposta do LZ77 que transforma `ab` + (2, 4, `c`) em `abababc`.
- Entrada danificada é rejeitada com erro, em vez de produzir dados errados.
- As duas linguagens reproduzem `fixtures/expected.tsv` e `results/comparison-table.md` exatamente, o que prova que geram as mesmas amostras e os mesmos bytes comprimidos.

## Demonstração

```sh
docker compose run --rm rust-test cargo run --quiet --release -- compare
docker compose run --rm python-test python report.py
```

Os dois imprimem a tabela abaixo (tamanhos em bytes, taxa = comprimido / original entre parênteses). Os tamanhos são determinísticos, então a tabela não depende da máquina.

| Amostra | Bytes | Entropia (bits/byte) | Limite da entropia (bytes) | Huffman | LZ77 | LZ77 + Huffman |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `single-symbol` | 16384 | 0.000 | 0 | 2312 (0.141) | 268 (0.016) | 340 (0.021) |
| `byte-cycle` | 16384 | 8.000 | 16384 | 16648 (1.016) | 1284 (0.078) | 758 (0.046) |
| `random` | 16384 | 7.988 | 16361 | 16648 (1.016) | 65496 (3.998) | 24756 (1.511) |
| `skewed` | 16384 | 1.749 | 3583 | 3847 (0.235) | 8616 (0.526) | 6374 (0.389) |
| `text` | 16384 | 4.157 | 8513 | 8842 (0.540) | 8920 (0.544) | 6971 (0.425) |

O que ler nela:

- **`skewed`**: Huffman chega ao limite da entropia (3.583 bytes de códigos mais o cabeçalho de 264 bytes). O LZ77 vai bem pior, porque símbolos independentes não têm estrutura repetida para apontar.
- **`single-symbol`**: a entropia é 0, mas Huffman não consegue ficar abaixo de 1 bit por byte. O LZ77 descreve o arquivo inteiro com 65 tokens.
- **`byte-cycle`**: a entropia de ordem 0 é a máxima, 8 bits, e Huffman não ganha nada, mas o LZ77 reduz o arquivo a 8%. A entropia de ordem 0 limita apenas códigos de símbolo.
- **`random`**: nada comprime. Huffman acrescenta seu cabeçalho, e este formato simples de LZ77 multiplica o tamanho por 4.
- **`text`**: as duas redundâncias existem, e LZ77 seguido de Huffman supera cada um sozinho e o limite de ordem 0.

Para comprimir um arquivo seu (rode a partir desta pasta; no PowerShell do Windows use `${PWD}` no lugar de `$PWD`):

```sh
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- compress huffman /data/README.md /data/README.huff
docker compose run --rm -v "$PWD:/data" rust-test cargo run --quiet --release -- entropy /data/README.md
```

## Limites

Formatos didáticos, não de produção: o cabeçalho do Huffman sempre custa 264 bytes, o LZ77 gasta 4 bytes em cada token (mesmo para um único literal), a janela é de 4.096 bytes, e os arquivos são lidos inteiros na memória. Formatos reais, como o DEFLATE, corrigem cada um desses pontos.
