# Multiplicação de matrizes amigável à cache (MP-PERF-3)

> English version: [docs/en/performance/cache-friendly-matrix.md](../../en/performance/cache-friendly-matrix.md) · Versión en español: [docs/es/performance/cache-friendly-matrix.md](../../es/performance/cache-friendly-matrix.md)

Mini-projeto: [`projects/performance/cache-friendly-matrix`](../../../projects/performance/cache-friendly-matrix/README.pt-BR.md). Tópicos do quiz: `cpu-cache-locality`, `benchmarking-methodology`.

## Mesmo Big O, velocidade diferente

Multiplicar duas matrizes `n × n` com três laços aninhados é `O(n³)` seja qual for a ordem dos laços. O Big O conta operações e supõe que todo acesso à memória custa o mesmo. Em um processador real não custa: um valor na cache L1 chega em cerca de um nanossegundo, um valor na memória principal em cerca de cem. A ordem dos laços decide qual dos dois você paga.

## A hierarquia de memória e a linha de cache

```text
registradores  <  L1 (dezenas de KiB)  <  L2 (centenas de KiB)  <  L3 (MiB)  <  RAM (GiB)
mais rápido, menor                                                  mais lento, maior
```

A cache não guarda valores isolados. Ela guarda **linhas** de 64 bytes, então ler um `double` traz os 7 vizinhos de graça. Programas que usam os vizinhos em seguida (localidade espacial) ou usam o mesmo dado de novo logo (localidade temporal) rodam quase só da cache.

Uma matriz é guardada por linhas (row-major): o elemento `(i, j)` fica no índice `i × n + j`.

```text
percurso por linha:   a[i][0] a[i][1] a[i][2] ... 8 elementos por linha de cache, 1 falta em 8
percurso por coluna:  b[0][j]            um elemento por linha de cache
                      b[1][j]            n × 8 bytes adiante
                      b[2][j]            uma falta por elemento quando a coluna não cabe na cache
```

## As três variantes

| Variante | Laços | O laço interno percorre | Localidade |
| --- | --- | --- | --- |
| `naive` | i, j, k | uma linha de A e uma **coluna** de B | ruim: uma linha de cache de B por elemento |
| `interchanged` | i, k, j | uma linha de B e uma linha de C | espacial: contíguo, pré-buscado, vetorizado |
| `blocked-B` | blocos `B × B`, depois i, k, j | pedaços de linhas dentro de um bloco | espacial e temporal: o bloco fica na cache |

A troca de laços não muda nada além da ordem de duas linhas `for`. A blocagem acrescenta três laços externos que escolhem um bloco. Dentro de um bloco o código toca `B²` elementos de cada uma das três matrizes, `3 × B² × 8` bytes: 24 KiB para `B = 32` (cabe em uma L1 de 32 KiB) e 96 KiB para `B = 64` (cabe na L2).

Para cada elemento do resultado, as três variantes somam os mesmos produtos na mesma ordem de `k`, então os resultados são idênticos bit a bit. Os testes ainda comparam com tolerância, porque esse é o contrato honesto de código de ponto flutuante, e o build de C++ usa `-ffp-contract=off` para o compilador não fundir uma multiplicação e uma soma em processadores que têm essa instrução.

## Resultados medidos

A grade completa está em [`results/results.md`](../../../projects/performance/cache-friendly-matrix/results/results.md), e as tabelas comentadas estão no [README](../../../projects/performance/cache-friendly-matrix/README.pt-BR.md#resultados). A máquina tem 32 KiB de cache L1 de dados e 512 KiB de L2 por núcleo, 96 MiB de L3 e linhas de 64 bytes, e estava compartilhada com outros programas.

- **Ingênua contra blocos, `n = 1500`**: `blocked-64` foi 3,5 vezes mais rápida em C++ (5524 ms contra 1566 ms) e 19,6 vezes em Rust (26648 ms contra 1360 ms) no benchmark versionado. A demonstração `speedup`, rodada duas vezes, deu 3,3 e 8,8 vezes em C++ e 5,5 e 9,0 vezes em Rust. Sempre mais de 2 vezes, nunca o mesmo fator duas vezes: a variante ingênua é limitada pela memória e o seu tempo variou de 4,6 s a 30 s conforme a carga na máquina.
- **Linha de cache**: o laço interno ingênuo lê `n` elementos de B que estão a `n × 8` bytes um do outro, então usa um valor de cada linha de 64 bytes que busca e desperdiça os outros sete. O laço trocado usa os oito.
- **Tamanho do bloco**: na varredura, os melhores blocos foram de 32 a 128, com conjuntos de trabalho de 24 KiB a 384 KiB, dentro da L1 ou da L2. `B = 8` foi o mais lento (pouco trabalho por bloco), e `B = 256` e `512`, cujos conjuntos de trabalho de 1,5 MiB e 6 MiB não cabem mais nos 512 KiB da L2, voltaram a ser mais lentos.
- **Blocos contra laços trocados**: sem vencedor claro nesta máquina. Com 96 MiB de L3 as três matrizes (54 MiB) ficam no último nível de cache, onde os laços trocados as percorrem em sequência. Espera-se que a blocagem importe mais em um processador com cache de último nível menor ou com matrizes maiores. Isso não foi medido aqui.
- **Faltas por conflito**: a variante ingênua é mais de três vezes mais lenta com `n = 1024` do que com `n = 1000`. Um passo de coluna de 8192 bytes é múltiplo dos 4096 bytes cobertos por uma via da cache L1, então a coluna inteira cai em um único conjunto de 8 linhas.

## Método

- Mesma entrada gerada nas duas linguagens (um gerador com semente fixa), e um checksum impresso com cada resultado: 844274790.842 com `n = 1500` para todas as variantes nas duas linguagens.
- C++ em `-O3` e Rust em modo release, que são níveis equivalentes. Em `-O2` o GCC não vetoriza o laço trocado e a comparação entre linguagens seria injusta.
- O runner de benchmark repete cada processo 3 vezes depois de 1 aquecimento e informa média, desvio padrão e faixa. Tamanhos pequenos repetem a multiplicação 5 vezes dentro do processo e informam a mediana.
- A máquina estava compartilhada, e a dispersão é grande. Uma diferença menor que a dispersão não é relatada como diferença.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-PERF-3.1 as três dão a mesma matriz dentro da tolerância de ponto flutuante | `docker compose run --rm cpp-test` e `rust-test` (tolerância `1e-9 × n`, oito tamanhos, seis tamanhos de bloco) |
| MP-PERF-3.2 blocos pelo menos 2 vezes mais rápida que a ingênua no maior tamanho | `docker compose run --rm cpp-speedup` e `rust-speedup` (terminam com erro abaixo de 2 vezes, `n = 1500`), e as linhas de `n = 1500` em `results/results.md` |
| MP-PERF-3.3 o README relaciona o resultado com linha de cache e tamanho de bloco | "Resultados" e "Tamanho do bloco" no README |

## Como rodar

```sh
cd projects/performance/cache-friendly-matrix
./setup-unix-cache-friendly-matrix.sh      # testes
docker compose run --rm cpp-speedup        # demonstração
```
