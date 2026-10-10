# cache-friendly-matrix

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Três formas de multiplicar duas matrizes, em C++ e em Rust: a ordem do livro-texto (i-j-k), os mesmos laços trocados (i-k-j), e uma versão em blocos. As três fazem exatamente as mesmas `n³` multiplicações e somas e devolvem a mesma matriz, bit a bit. A única diferença é a ordem em que a memória é visitada, e só isso torna a ordem do livro-texto várias vezes mais lenta. A lição: o Big O conta operações, e o processador também cobra por onde o dado está.

Item do plano: MP-PERF-3. Linguagens: C++ e Rust. Texto completo: [docs/pt/performance/cache-friendly-matrix.md](../../../docs/pt/performance/cache-friendly-matrix.md).

## O que ensina

- Uma matriz guardada por linhas (row-major) tem linhas contíguas e colunas espalhadas. Uma **linha de cache** tem 64 bytes, ou 8 doubles: percorrer uma linha da matriz custa uma falta de cache a cada 8 elementos, percorrer uma coluna custa uma por elemento quando a coluna não cabe mais na cache.
- A **troca de laços** (i-k-j) transforma o percurso por coluna em dois percursos por linha. Isso é localidade espacial.
- A **blocagem** corta o trabalho em blocos `B × B` cujo conjunto de trabalho (`3 × B² × 8` bytes) cabe em um nível de cache, então o dado é reutilizado antes de ser despejado. Isso é localidade temporal.
- Um tamanho múltiplo de uma potência de dois pode ser muito pior que um ligeiramente menor, porque os elementos de uma coluna passam a disputar o mesmo conjunto da cache (faltas por conflito).
- Como medir sem se enganar: mesma entrada, mesmo nível de otimização, um checksum provando que as variantes concordam, várias execuções, e a dispersão.

## Resultados

Medido na máquina descrita em [results/results.md](results/results.md) (AMD Ryzen 7 5700X3D: 32 KiB de cache L1 de dados e 512 KiB de L2 por núcleo, 96 MiB de L3 compartilhada, linhas de cache de 64 bytes), enquanto outros programas a usavam. Os números têm ruído, e a dispersão faz parte do resultado.

Maior tamanho, `n = 1500` (18 MiB por matriz), processo inteiro, média ± desvio padrão de 3 execuções depois de 1 de aquecimento, do benchmark versionado:

| Variante | C++ (ms) | Rust (ms) |
| --- | ---: | ---: |
| `naive` (i-j-k) | 5524 ± 755 | 26648 ± 5773 |
| `interchanged` (i-k-j) | 1968 ± 530 | 1575 ± 141 |
| `blocked-32` | 2080 ± 191 | 1757 ± 166 |
| `blocked-64` | 1566 ± 17 | 1360 ± 760 |
| `naive` / `blocked-64` | **3,5 vezes** | **19,6 vezes** |

A versão em blocos foi pelo menos 2 vezes mais rápida que a ingênua no maior tamanho em todas as execuções feitas para este projeto, mas o quanto variou muito. A demonstração `speedup` (mediana de 3 execuções em um processo) deu 3,3 e 8,8 vezes em C++ e 5,5 e 9,0 vezes em Rust em duas ocasiões, e o benchmark acima deu 3,5 e 19,6. A variante ingênua é a instável (de 4,6 s a 30 s para o mesmo trabalho): ela é limitada pela memória, então é a que mais sofre quando outros programas disputam a cache L3 compartilhada e o barramento de memória. O valor de 26,6 s do Rust é um ponto fora da curva desse tipo. Leia "várias vezes mais rápida", não um fator preciso.

O que os números dizem, e o que não dizem:

- **A ordem dos laços importa mais que a linguagem.** Nas duas linguagens a ordem ingênua é a lenta, e as duas variantes amigáveis à cache ficam próximas uma da outra.
- **A blocagem não venceu a simples troca de laços nesta máquina.** As diferenças entre `interchanged`, `blocked-32` e `blocked-64` estão dentro do ruído. As três matrizes ocupam 54 MiB e este processador tem 96 MiB de L3, então os laços trocados percorrem dados que ainda estão no último nível de cache, com a ajuda do prefetcher. A blocagem compensa mais quando as matrizes são maiores que a cache de último nível.
- **1024 contra 1000.** A variante ingênua levou 6636 ms com `n = 1024` e 1402 ms com `n = 1000` em C++ (6454 ms e 1930 ms em Rust): 7% a mais de trabalho, mais de três vezes o tempo. Com `n = 1024` os elementos de uma coluna ficam a 8192 bytes um do outro, um múltiplo de 4096 bytes, então todos caem no mesmo conjunto da cache L1, que guarda só 8 linhas por conjunto. As variantes com laços trocados e em blocos não percorrem colunas e não são afetadas.

### Tamanho do bloco

`docker compose run --rm cpp-sweep` e `rust-sweep`, `n = 1500`, mediana de 3 execuções:

| Bloco `B` | Conjunto de trabalho `3 × B² × 8` bytes | Cabe em | C++ (ms) | Rust (ms) |
| ---: | ---: | --- | ---: | ---: |
| 8 | 1,5 KiB | L1 | 2411 | 1827 |
| 16 | 6 KiB | L1 | 1705 | 1204 |
| 32 | 24 KiB | L1 (32 KiB) | 1330 | 1004 |
| 64 | 96 KiB | L2 | 1349 | 772 |
| 128 | 384 KiB | L2 (512 KiB) | 1352 | 717 |
| 256 | 1,5 MiB | só na L3 | 1682 | 945 |
| 512 | 6 MiB | só na L3 | 1657 | 919 |

A curva é um U. Blocos muito pequenos gastam tempo com o controle dos laços e cortam o laço interno em pedaços curtos demais para instruções vetoriais. Blocos cujo conjunto de trabalho passa dos 512 KiB da L2 perdem a reutilização que é a razão de ser da blocagem. Os melhores blocos (32 a 128) são aqueles cujo conjunto de trabalho cabe na L1 ou na L2. O tamanho certo do bloco é uma propriedade da cache, então ele é encontrado medindo na máquina de destino.

## Tópicos do quiz que ele demonstra

Área `performance`:

- `cpu-cache-locality` (hierarquia de memória, linha de cache, localidade espacial e temporal, percurso row-major, troca de laços, blocagem)
- `benchmarking-methodology` (aquecimento, várias execuções e a sua dispersão, checksum contra eliminação de código morto e para provar trabalho igual, mesmo Big O com velocidade diferente)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-cache-friendly-matrix.sh        # Linux e macOS
./setup-windows-cache-friendly-matrix.ps1    # Windows
```

O script constrói as duas imagens e roda os testes das duas linguagens.

## Demonstração

```sh
docker compose run --rm cpp-speedup     # as três variantes com n = 1500, falha abaixo de 2 vezes
docker compose run --rm rust-speedup
docker compose run --rm cpp-sweep       # tamanhos de bloco de 8 a 512
docker compose run --rm rust-sweep
```

`MATRIX_N=1024 docker compose run --rm cpp-speedup` muda o tamanho. O `speedup` imprime uma tabela com o checksum de cada variante e termina com erro a menos que a variante em blocos seja pelo menos 2 vezes mais rápida que a ingênua e as três matrizes concordem.

## Benchmark

```sh
bun run bench -- --project cache-friendly-matrix    # a partir da raiz do repositório
```

O runner compila os dois programas, roda cada variante com `n` = 256, 512, 1000, 1024 e 1500 dentro das imagens das linguagens com o hyperfine (3 execuções depois de 1 de aquecimento), e grava `results/results.md`, `results.json` e `results.js`. Leva cerca de cinco minutos. `dashboard/index.html` desenha `results/results.js` e funciona aberto direto do disco.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/matrix.hpp` | As três multiplicações, o gerador de entrada e o checksum |
| `cpp/main.cpp` | Entrada do benchmark, `speedup` e `sweep` |
| `cpp/test_matrix.cpp` | Testes |
| `rust/src/lib.rs`, `rust/src/main.rs` | O mesmo em Rust, com os testes dentro de `lib.rs` |
| `bench.json`, `results/` | Grade do benchmark e resultados versionados |
| `dashboard/` | Página estática que desenha `results/results.js` |

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- As três variantes dão a mesma matriz dentro de uma tolerância de `1e-9 × n`, e o mesmo checksum, em oito tamanhos e seis tamanhos de bloco, incluindo tamanhos que o bloco não divide e um bloco maior que a matriz.
- Um produto 2 × 2 conhecido, multiplicação pela identidade, e a mesma entrada gerada nas duas linguagens (checksum compartilhado).
- Com `n = 512` a ordem ingênua precisa levar mais de 1,5 vez o tempo da variante com laços trocados e da variante em blocos. É uma razão com margem larga (foram medidas de 3 a 8 vezes), não um tempo absoluto.

Formatadores e linters (clang-format, rustfmt, clippy) rodam nas imagens base de [docs/pt/environment.md](../../../docs/pt/environment.md):

```sh
./lint.sh          # confere
./lint.sh --fix    # reescreve
```

## Versões

| Componente | Versão |
| --- | --- |
| C++ | `gcc:16.2.0-trixie`, `-std=c++23 -O3 -ffp-contract=off` |
| Rust | `rust:1.99.0-slim-trixie`, edição 2024, perfil release, sem dependências |
| hyperfine | 2.0.0, na imagem de benchmark do repositório |
