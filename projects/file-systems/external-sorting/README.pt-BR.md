# external-sorting

> English version: [README.md](README.md)

Como ordenar um arquivo maior que a memória, em Rust e em Go. A geração de runs ordena um pedaço do tamanho da memória por vez e o grava como uma run ordenada, e uma intercalação de k caminhos com heap de mínimo junta as runs, em uma passada ou em várias. Um contêiner com 32 MiB de memória ordena um arquivo de 320 MiB, e um benchmark mostra o que o tamanho da run e o fan-in da intercalação fazem com o tempo total.

Item do plano: MP-FS-2. Explicação completa: [docs/pt/file-systems/external-sorting.md](../../../docs/pt/file-systems/external-sorting.md).

## O que ensina

- Uma ordenação em memória precisa de memória proporcional ao arquivo. Sob um limite de 32 MiB, carregar um arquivo de 320 MiB faz o processo ser morto. A ordenação externa por intercalação usa memória proporcional ao tamanho da run, qualquer que seja o tamanho do arquivo.
- A fase 1 lê a entrada uma vez e grava runs. A fase 2 lê as runs em sequência e grava a saída. Nada fica indo e voltando no disco.
- Um heap de mínimo com uma entrada por run entrega a próxima linha em cerca de log2(k) comparações, e só uma linha de cada run fica na memória.
- Com mais runs que o fan-in, a intercalação leva várias passadas: teto(log na base fan-in do número de runs). Cada passada lê e grava o arquivo inteiro uma vez.
- O tamanho da run e o fan-in são os dois botões. Runs maiores significam menos runs e mais memória. Um fan-in maior significa menos passadas e, com orçamento fixo, buffers menores por run.
- O limite de memória de um contêiner também conta o cache de páginas dos arquivos sendo gravados, uma lição em que a própria demonstração esbarrou: veja [results/memory-limit.md](results/memory-limit.md).

## Tópicos do quiz que demonstra

Área `file-systems`:

- `external-sorting`: as duas fases, número de runs, número de passadas de intercalação, o heap da intercalação de k caminhos, o efeito do fan-in, o volume de entrada e saída por passada.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-external-sorting.sh        # Linux e macOS
./setup-windows-external-sorting.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem (`rust:1.99.0-slim-trixie`, e `golang:1.27.1-bookworm` com o `golangci-lint` v2.14.0), roda checagem de formato, linter e testes em cada uma, roda a demonstração do limite de memória nas duas linguagens e confere que a ordenação em memória é morta sob o mesmo limite. Levou entre 1,5 e 6 minutos na máquina dos resultados, conforme o que mais estava usando o disco, quase tudo na demonstração do limite de memória, que grava cerca de 1,3 GiB por linguagem dentro do contêiner e força a ida para o disco. Nada é instalado na máquina, não há dependência além da biblioteca padrão de cada linguagem, e todo arquivo que os programas criam fica em `/tmp` dentro do contêiner e some com ele.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `rust/src/lines.rs`, `go/lines.go` | gerador do arquivo de entrada com semente, checksum independente da ordem, o escritor que limita as páginas sujas, a conferência de um arquivo ordenado |
| `rust/src/sorter.rs`, `go/sorter.go` | geração de runs, o heap de mínimo de runs, a intercalação de k caminhos, o controle das passadas e a ordenação em memória usada como mau exemplo |
| `rust/src/main.rs`, `go/main.go` | o comando `extsort`: `generate`, `sort`, `bench`, `limit-check`, `in-memory-check` |
| `rust/tests/`, `go/extsort_test.go` | os testes |
| `fixtures/checksum-1000.txt` | checksum das primeiras 1.000 linhas geradas, verificado pelas duas linguagens |
| `docker-compose.yml` | serviços de teste e os dois serviços com o limite de 32 MiB de memória |
| `bench.json` | grade de benchmark lida pelo runner do repositório |
| `results/` | resultados versionados: `memory-limit.md`, e `results.md`, `results.json`, `results.js` do runner |
| `dashboard/` | página estática que desenha `results/results.js` |

As duas linguagens implementam o mesmo algoritmo e o mesmo gerador (SplitMix64, semente 20261007), então ordenam arquivos idênticos byte a byte e imprimem o mesmo checksum.

## Testes

```sh
docker compose run --rm rust-test
docker compose run --rm go-test
```

- **Saída igual à ordenação em memória (MP-FS-2.2)**: 7 entradas (0, 1, 2, 500 e 5.000 linhas, 5.000 linhas com 7 chaves distintas, 3.000 linhas com uma única chave) são ordenadas com 4 tamanhos de run (de 128 bytes a 1 MiB) e 4 fan-ins (2, 3, 8, 64), 112 combinações em cada linguagem. Em todas, o arquivo de saída é exatamente a lista de linhas da entrada ordenada na memória, o que significa ordenado e com o mesmo multiconjunto de linhas. O número de passadas de intercalação é conferido com a fórmula, e nenhum arquivo de run fica para trás.
- **Runs**: cada run está ordenada, cabe no buffer, e as runs juntas têm exatamente as linhas da entrada.
- **As conferências são conferidas**: um arquivo fora de ordem, um arquivo com uma linha repetida faltando e um arquivo com uma linha alterada são todos detectados.
- **Casos extremos**: entrada sem quebra de linha no fim, linhas vazias, uma linha maior que o tamanho da run (erro) e fan-in igual a 1 (erro).
- **Heap**: a menor linha atual está sempre no topo, e linhas iguais saem na ordem das runs.
- **Mesmo gerador**: as duas linguagens verificam o checksum de `fixtures/checksum-1000.txt`.

## Demonstração: o limite de memória (MP-FS-2.1)

```sh
docker compose run --rm rust-limit
docker compose run --rm go-limit
```

Cada contêiner tem `mem_limit: 32m` e `memswap_limit: 32m` no `docker-compose.yml`. O programa gera 335.544.323 bytes de linhas (10 vezes o limite), ordena com runs de 8 MiB e fan-in 8, confere que a saída está ordenada e tem as mesmas linhas, lê o próprio pico de memória residente na linha `VmHWM` de `/proc/self/status` e falha se esse pico não ficar abaixo do limite.

| Linguagem | Runs | Passadas de intercalação | Pico de memória residente | Fatia do limite |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11,2 MiB | 35% |
| Go | 41 | 2 | 19,9 MiB | 62% |

Para provar que o limite é real, o mesmo arquivo ordenado em memória sob o mesmo limite é morto pelo núcleo:

```sh
docker compose run --rm rust-limit extsort in-memory-check 32   # código de saída 137
```

Saída completa e como o limite foi conferido: [results/memory-limit.md](results/memory-limit.md).

## Benchmark: tamanho da run e fan-in (MP-FS-2.3)

```sh
bun run bench -- --project external-sorting    # a partir da raiz do repositório
```

O runner sobe um contêiner por linha, sem rede, e o hyperfine mede o processo inteiro 7 vezes depois de 1 execução de aquecimento. Grade: 250.000 e 1.000.000 de linhas (12,5 MB e 50 MB), runs de 1, 4 e 16 MiB, fan-in de 2, 4, 16 e 64, nas duas linguagens. A tabela completa, com máquina, versões e comandos, está em [results/results.md](results/results.md), e `dashboard/index.html` a desenha quando aberto direto do disco.

Processo inteiro, média ± desvio padrão em milissegundos em 7 execuções, para 1.000.000 de linhas (50 MB). Entre parênteses, o número de passadas de intercalação.

| Linguagem | Tamanho da run | Runs | Fan-in 2 | Fan-in 4 | Fan-in 16 | Fan-in 64 | Pico de memória (KiB) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rust | 1 MiB | 48 | 971 ± 379 (6) | 669 ± 221 (3) | 496 ± 20 (2) | 588 ± 119 (1) | 3.416 a 3.516 |
| Rust | 4 MiB | 12 | 979 ± 219 (4) | 619 ± 315 (2) | 389 ± 10 (1) | 538 ± 123 (1) | 7.080 a 7.584 |
| Rust | 16 MiB | 3 | 833 ± 286 (2) | 606 ± 304 (1) | 432 ± 37 (1) | 693 ± 646 (1) | 21.252 a 21.304 |
| Go | 1 MiB | 48 | 820 ± 39 (6) | 611 ± 21 (3) | 572 ± 14 (2) | 814 ± 96 (1) | 6.536 a 7.476 |
| Go | 4 MiB | 12 | 877 ± 71 (4) | 564 ± 36 (2) | 509 ± 23 (1) | 730 ± 96 (1) | 10.652 a 15.468 |
| Go | 16 MiB | 3 | 893 ± 92 (2) | 618 ± 34 (1) | 701 ± 87 (1) | 899 ± 319 (1) | 32.356 a 35.672 |

Medido em 2026-10-08 em um AMD Ryzen 7 5700X3D com Docker Desktop (WSL2), enquanto outras cargas usavam a mesma máquina.

- **O fan-in 2 é a coluna mais lenta em todas as linhas menos uma**, nas duas linguagens. Ele precisa de 6, 4 e 2 passadas de intercalação, e cada passada lê e grava os 50 MB de novo.
- **Menos passadas compensam até certo ponto.** Com runs de 1 MiB, ir do fan-in 2 para o fan-in 16 reduz as passadas de 6 para 2 e o tempo em 49% em Rust (de 971 para 496 ms) e em 30% em Go (de 820 para 572 ms).
- **O fan-in 64 economiza mais uma passada e não é mais rápido.** Com runs de 1 MiB ele intercala as 48 runs em uma única passada, e em Go é mais lento que o fan-in 16 (814 ± 96 contra 572 ± 14 ms). O orçamento de 1 MiB é dividido entre 65 buffers, então cada run é lida de 16 KiB em 16 KiB.
- **O tamanho da run define a memória**, cerca de 3,4, 7 e 21 MiB em Rust e 7, 11 a 15 e 32 a 36 MiB em Go. Aqui ele muda o tempo bem menos que o fan-in, porque um arquivo de 50 MB cabe no cache de páginas e reler uma run não custa acesso a disco.
- **Atenção à dispersão.** Várias células de Rust têm desvio padrão acima de 30% da média, porque a máquina estava compartilhada. Uma diferença menor que a dispersão não é diferença: as colunas de fan-in 4, 16 e 64 não podem ser ordenadas só com as linhas de Rust.

## Limites

- As linhas são comparadas como bytes, a partir do primeiro byte. Não há extração de chave nem regras de idioma.
- As runs são feitas ordenando blocos do tamanho da memória. A seleção por substituição, que faz runs com cerca do dobro do tamanho, é coberta pelo quiz e não foi implementada.
- Os buffers da intercalação têm o tamanho da run dividido pelo fan-in mais um, com piso de 4 KiB, para que a intercalação use mais ou menos a mesma memória que a geração de runs.
- O benchmark rodou em um SSD atrás de um disco virtual, onde um seek custa quase nada. A penalidade de um fan-in muito grande em disco magnético, muitas recargas pequenas que são cada uma um seek, não aparece nestes números.
- A comparação da entrada com a saída em arquivos grandes usa a contagem de linhas e um checksum de 64 bits independente da ordem. Os testes com arquivos pequenos comparam os arquivos exatamente.
