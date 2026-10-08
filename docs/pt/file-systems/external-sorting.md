# Ordenação externa

> English version: [docs/en/file-systems/external-sorting.md](../../en/file-systems/external-sorting.md)

Mini-projeto: [projects/file-systems/external-sorting](../../../projects/file-systems/external-sorting). Linguagens: Rust, Go. Tópico do quiz: `file-systems` / `external-sorting`.

## O problema

Ordenar na memória supõe que os dados cabem na memória. Quando o arquivo é maior, as duas saídas fáceis falham. Carregá-lo mesmo assim termina com o processo morto, ou com a máquina fazendo swap. Ordenar o arquivo no próprio lugar, com um algoritmo que salta dentro dele, transforma cada comparação em um acesso a disco, e um acesso a disco custa cerca de cem mil vezes mais que um acesso à memória.

A ordenação externa por intercalação cumpre duas promessas: o uso de memória não depende do tamanho do arquivo, e todo arquivo é lido e gravado em sequência.

## Fase 1: geração de runs

```
arquivo de entrada: [ ....... 320 MiB, em qualquer ordem ....... ]
                       |          |          |               |
                    lê 8 MiB   lê 8 MiB   lê 8 MiB   ...   lê o resto
                    ordena     ordena     ordena           ordena
                    grava      grava      grava            grava
                       v          v          v               v
runs:               run-0      run-1      run-2      ...   run-40   (cada uma ordenada)
```

Um buffer do tamanho de uma run é o único pedaço grande de memória. Ele é preenchido a partir do arquivo, as linhas dentro dele são ordenadas e gravadas como uma **run**, um arquivo ordenado. As linhas não são movidas para ordenar: o programa ordena um índice de pares (início, tamanho) que apontam para dentro do buffer, com 8 bytes por linha. Uma linha cortada pelo fim do buffer é levada para o começo do próximo.

Número de runs = teto(tamanho do arquivo / tamanho da run), com uma a mais ou a menos, porque o buffer nunca termina no meio de uma linha.

## Fase 2: intercalação de k caminhos com heap

```
run-0:  apple  fig    pear  ...        heap de números de runs, ordenado
run-1:  banana grape  plum  ...   -->  pela linha atual de cada run       -->  saída
run-2:  cherry kiwi   lime  ...        (topo = menor linha atual)
```

Cada run é lida do início ao fim pelo seu próprio buffer, e só uma linha de cada run fica na memória. Um **heap de mínimo** tem uma entrada por run. O topo é a run cuja linha atual é a menor: essa linha vai para a saída, a próxima linha da mesma run é lida, e a entrada desce até o seu lugar. Cada linha custa cerca de log2(k) comparações, em vez das k - 1 de olhar todas as runs. Quando duas linhas são iguais, sai primeiro a da run de menor número, o que mantém a intercalação estável.

## Várias passadas

A intercalação lê no máximo `fan-in` runs por vez. Com mais runs do que isso, uma passada junta grupos de `fan-in` runs em runs maiores, e a passada seguinte junta essas:

```
41 runs, fan-in 8:   41  -->  6  -->  1        2 passadas de intercalação
48 runs, fan-in 2:   48 -> 24 -> 12 -> 6 -> 3 -> 2 -> 1      6 passadas de intercalação
```

Passadas = teto(log na base fan-in do número de runs). Cada passada lê e grava cada linha uma vez, então o número de passadas é o custo real de uma configuração.

## Os dois botões

| Botão | Maior significa | Preço |
| --- | --- | --- |
| tamanho da run | menos runs, logo menos passadas | mais memória, pois o buffer da run é a memória da fase 1 |
| fan-in | menos passadas | com orçamento de memória fixo, buffers menores por run, logo mais recargas, e em disco magnético cada recarga é um seek |

Nesta implementação cada buffer da intercalação tem `tamanho da run / (fan-in + 1)` bytes, com piso de 4 KiB, então a intercalação usa mais ou menos a mesma memória que a geração de runs.

## O limite de memória

Os serviços `*-limit` do `docker-compose.yml` rodam a ordenação em um contêiner com `mem_limit: 32m` e `memswap_limit: 32m`: 32 MiB de memória e nenhum swap. O programa gera um arquivo de 320 MiB, dez vezes o limite, ordena com runs de 8 MiB e fan-in 8, confere a saída e então lê o próprio **pico de memória residente** na linha `VmHWM` de `/proc/self/status`. Ele termina com erro se o pico não ficar abaixo do limite.

| Linguagem | Runs | Passadas de intercalação | Pico de memória residente | Fatia do limite |
| --- | ---: | ---: | ---: | ---: |
| Rust | 41 | 2 | 11,2 MiB | 35% |
| Go | 41 | 2 | 19,9 MiB | 62% |

O limite é provado real pelo experimento oposto: `extsort in-memory-check 32` ordena o mesmo arquivo carregando-o inteiro, no mesmo contêiner, e o núcleo o mata (código de saída 137). O script de setup exige essa falha.

### O que o limite também conta

A primeira versão da demonstração foi morta enquanto ainda gravava o arquivo de entrada, com menos de 1 MiB de memória própria. Vale a pena saber o motivo. Os bytes entregues ao núcleo com `write` ainda não estão no disco: esperam no **cache de páginas** como páginas sujas. O limite de memória de um contêiner conta também essas páginas, e uma página suja não pode ser descartada antes de ser gravada. Um programa que grava mais rápido que o disco enche o limite com páginas que não são memória dele, e é morto.

A correção está no escritor por onde passa todo arquivo de saída: quando há um intervalo de sincronização, ele chama `fdatasync` a cada 4 MiB, o que limita as páginas sujas que o processo deixa para trás. O intervalo é usado só na demonstração do limite. É por isso que essa demonstração é lenta: quem dita o ritmo é o disco, e não a ordenação.

## Como a saída é conferida

- **Arquivos pequenos, nos testes**: a saída é comparada com a lista de linhas da entrada ordenada na memória. Ser igual a essa lista significa ordenada, e com o mesmo multiconjunto de linhas.
- **Arquivos grandes, na demonstração e no benchmark**: uma passada sequencial na saída confere que cada linha é maior ou igual à anterior, e compara a contagem de linhas e um checksum com os da entrada. O checksum é a soma e o ou-exclusivo de um hash de 64 bits de cada linha, então não depende da ordem das linhas e precisa de memória O(1). O gerador o calcula para a entrada durante a gravação.

As duas linguagens geram o mesmo arquivo a partir da mesma semente, e um teste em cada uma verifica o mesmo checksum.

## O que os testes provam

| Item do plano | Como é verificado |
| --- | --- |
| MP-FS-2.1 pico de memória abaixo do limite com um arquivo 10 vezes maior | `docker compose run --rm rust-limit` e `go-limit`: limite de 32 MiB no contêiner, sem swap, arquivo de 320 MiB, pico de memória residente de 11,2 MiB e 19,9 MiB lido de `VmHWM`, e a ordenação em memória morta sob o mesmo limite |
| MP-FS-2.2 saída ordenada, mesmo multiconjunto de linhas | 112 combinações de entrada, tamanho de run e fan-in em cada linguagem, cada uma igual à ordenação em memória |
| MP-FS-2.3 tabela de tempo total por configuração | `bun run bench -- --project external-sorting`, versionada em `results/results.md` |

## Resultados

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

## Limites desta implementação

- As linhas são comparadas como bytes. Não há extração de chave.
- As runs vêm da ordenação de blocos. A seleção por substituição, que dobra o tamanho médio das runs, não foi implementada.
- No SSD usado no benchmark um seek é quase gratuito, então a penalidade de um fan-in muito grande em disco magnético não aparece.

## Como rodar

```sh
cd projects/file-systems/external-sorting
./setup-unix-external-sorting.sh             # ou ./setup-windows-external-sorting.ps1
docker compose run --rm rust-limit           # ou go-limit
bun run bench -- --project external-sorting  # a partir da raiz do repositório
```
