# file-organisation

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como registros, espaço livre e índices vivem dentro de arquivos, em C++ e em Rust. Um arquivo de dados de registros de tamanho fixo, com cabeçalho, dá acesso direto pelo número relativo do registro (RRN) e reaproveita os slots removidos com uma lista de livres guardada dentro do próprio arquivo. Um índice primário e dois índices secundários com listas invertidas respondem buscas sem varrer o arquivo. A codificação run-length e a de Huffman comprimem o arquivo de dados e informam a taxa.

Item do plano: MP-FS-1. Explicação completa: [docs/pt/file-systems/file-organisation.md](../../../docs/pt/file-systems/file-organisation.md).

## O que ensina

- Com registros de tamanho fixo, a posição de um registro é calculada, e não procurada: byte offset = 32 + RRN x 64. Um seek lê qualquer registro.
- Remover marca o slot e o empilha em uma pilha cuja cabeça fica no cabeçalho. A próxima inserção o desempilha, então o arquivo não cresce enquanto houver slots livres.
- Um índice separa a ordem de busca dos dados: entradas pequenas e ordenadas na memória, registros em ordem de chegada no disco. Uma busca por cidade lê só os slots que atendem, enquanto uma varredura lê todos os slots do arquivo.
- Um índice secundário que guarda chaves primárias (ligação tardia) não muda quando um registro é removido ou movido. Só o índice primário muda.
- Um índice mantido na memória precisa de um indicador de desatualizado em disco, para que uma sessão que terminou mal seja detectada e o índice seja reconstruído a partir dos dados.
- Preenchimento comprime muito bem. A codificação run-length elimina as sequências de espaços, a de Huffman dá códigos curtos aos bytes frequentes, e as duas podem ser encadeadas.

## Tópicos do quiz que demonstra

Área `file-systems`:

- `record-organisation`: registros de tamanho fixo e o seu preenchimento, registro de cabeçalho, RRN e byte offset, por que o acesso direto exige tamanho fixo.
- `indexes`: índice simples e busca binária, índice secundário, listas invertidas, ligação tardia, matching de duas listas (AND), indicador de desatualizado e reconstrução.
- `compression-and-space-reclamation`: lista de livres como pilha dentro do arquivo, codificação run-length, códigos de Huffman e a propriedade de prefixo.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-file-organisation.sh        # Linux e macOS
./setup-windows-file-organisation.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem (`gcc:16.2.0-trixie` e `rust:1.99.0-slim-trixie`) e roda checagem de formato, linter e testes em cada uma. Nada é instalado na máquina e não há dependência além da biblioteca padrão de cada linguagem. Todo arquivo que os programas criam fica em `/tmp` dentro do contêiner.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/record_file.hpp`, `rust/src/record_file.rs` | o arquivo de dados: cabeçalho, slots de tamanho fixo, acesso por RRN, lista de livres |
| `cpp/indexes.hpp`, `rust/src/indexes.rs` | índice primário com busca binária contada, índice secundário com listas invertidas, matching cossequencial |
| `cpp/database.hpp`, `rust/src/database.rs` | arquivo de dados mais índices: inserir, remover, buscar por id, cidade e ano, varredura completa, indicador de desatualizado e reconstrução |
| `cpp/compression.hpp`, `rust/src/compression.rs` | codificação run-length e de Huffman |
| `cpp/workload.hpp`, `rust/src/workload.rs` | gerador de registros com semente e a demonstração |
| `cpp/demo.cpp`, `rust/src/demo.rs` | o comando da demonstração |
| `results/demo.md` | a saída versionada da demonstração |

As duas linguagens usam os mesmos layouts de arquivo (inteiros little-endian em posições fixas), os mesmos algoritmos e o mesmo gerador pseudoaleatório (SplitMix64, semente 20261007), então gravam arquivos idênticos byte a byte e imprimem as mesmas tabelas.

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- **Lista de livres (MP-FS-1.1)**: 1.000 registros ocupam 32 + 1.000 x 64 bytes. Depois de 334 remoções o arquivo tem o mesmo tamanho, depois de 334 inserções continua com o mesmo tamanho e todo registro novo foi para um slot abaixo de 1.000, e mais uma inserção o faz crescer exatamente 64 bytes. Os slots são reaproveitados em ordem LIFO, e cabeçalho e registros são lidos de volta depois de reabrir o arquivo.
- **Índice contra varredura (MP-FS-1.2)**: 6.000 inserções e remoções aleatórias sobre 3.000 ids, conferidas com o mapa ordenado da linguagem. Depois, para cada uma das 12 cidades, 27 anos e 27 pares de cidade e ano, a busca pelos índices devolve exatamente os registros de uma varredura completa. A comparação é repetida com os índices carregados do disco e com os índices reconstruídos depois de uma sessão que não fechou.
- **Compressão (MP-FS-1.3)**: os dois métodos e o encadeamento deles devolvem os bytes originais para nove entradas (vazia, um byte, um único byte distinto, só bytes marcadores, sequências, alfabeto desbalanceado, bytes aleatórios, o arquivo de dados). Tamanhos calculados à mão são verificados: 18 bytes com duas sequências longas viram 10, e 100 símbolos com frequências 45, 25, 15, 10 e 5 ocupam 200 bits.
- **Demonstração**: a saída da demonstração é igual a `results/demo.md`, nas duas linguagens.

## Demonstração

```sh
docker compose run --rm cpp-test forg_demo
docker compose run --rm rust-test forg_demo
```

Imprime quatro tabelas para 10.000 registros: o tamanho do arquivo depois de cada passo do cenário da lista de livres, os slots lidos por uma varredura contra os slots lidos pelo índice, o que a abertura seguinte fez depois de um fim limpo e de um fim sem fechamento, e os tamanhos comprimidos com as taxas. Passe outro número de registros (de 100 a 50.000) como primeiro argumento. Todo número é uma contagem, e não um tempo, então a saída não depende da máquina. A saída versionada está em [results/demo.md](results/demo.md):

| Método | Bytes | Taxa (comprimido / original) |
| --- | ---: | ---: |
| nenhum | 672.096 | 1,000 |
| run-length | 452.375 | 0,673 |
| Huffman | 383.834 | 0,571 |
| run-length e depois Huffman | 357.092 | 0,531 |

## Limites

- Os registros têm só tamanho fixo. Registros de tamanho variável, com first-fit, best-fit e worst-fit, são cobertos pelo quiz e não foram implementados.
- Os índices secundários nunca são limpos enquanto os arquivos estão abertos: as chaves de registros removidos continuam nas listas e são filtradas pelo índice primário. É a reconstrução que as descarta.
- O arquivo de Huffman guarda as 256 frequências (1.032 bytes de cabeçalho), então entradas pequenas ficam maiores.
- Huffman e LZ77 comparados com a entropia da fonte são assunto de outro mini-projeto, `projects/information-theory/huffman-lz77`. Nenhum código é compartilhado: este mini-projeto tem o seu próprio codificador de Huffman.
