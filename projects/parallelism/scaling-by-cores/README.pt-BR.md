# scaling-by-cores

> English version: [README.md](README.md)

Quanto um programa acelera com mais núcleos, e por que não de forma linear? Este mini-projeto (MP-PAR-1) roda duas cargas limitadas por CPU, contagem de primos e um render de Mandelbrot, de forma sequencial e com 1, 2, 4 e 8 trabalhadores, em Rust, Go e C++. Ele prova que os resultados paralelos são exatamente os sequenciais, mede speed-up e eficiência, e ajusta a lei de Amdahl às medições para estimar a fração serial.

Explicação mais longa dos conceitos: [docs/pt/parallelism/scaling-by-cores.md](../../../docs/pt/parallelism/scaling-by-cores.md).

## Tópicos do quiz que ele demonstra

Área `parallelism` do quiz:

- `amdahl-gustafson`: a fração serial é estimada a partir das medições, invertendo a lei de Amdahl.
- `speedup-efficiency-scalability`: tabelas de speed-up e eficiência para 1, 2, 4 e 8 trabalhadores, com base sequencial (escalabilidade forte).
- `data-vs-task-parallelism`: a mesma operação sobre fatias de números ou de linhas, e o que acontece quando fatias iguais não são trabalho igual.
- `fork-join-work-stealing`: os trabalhadores são criados e aguardados (fork e join); blocos estáticos contra pedaços dinâmicos em uma carga irregular.
- `parallel-sorting-reductions`: um parcial local por trabalhador, combinado depois do join com um operador associativo e comutativo.
- `determinism-reproducibility`: o resultado paralelo é igual ao sequencial bit a bit, em três linguagens.
- `false-sharing-cache-effects`: os trabalhadores acumulam em variáveis locais e escrevem a posição compartilhada uma única vez, então nenhuma linha de cache é disputada no laço quente.
- `shared-vs-distributed-memory`: threads de um mesmo processo escrevem em partes disjuntas do mesmo buffer.
- `map-reduce-patterns`: um map independente sobre os itens seguido da fusão dos parciais.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-scaling-by-cores.sh        # Linux e macOS
./setup-windows-scaling-by-cores.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem, roda formatador, linter e testes de cada uma, e termina com uma demonstração: a mesma imagem de Mandelbrot com 1 e com 8 trabalhadores nas três linguagens. O campo `checksum` precisa ser idêntico em todas as linhas e o `elapsedMs` deve cair.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `rust/` | `std::thread::scope`, sem crates. `src/primes.rs`, `src/mandelbrot.rs`, `src/schedule.rs` e a linha de comando em `src/main.rs` |
| `go/` | goroutines com `sync.WaitGroup` e `sync/atomic`, só a biblioteca padrão |
| `cpp/` | `std::thread` e `std::atomic`, biblioteca só de cabeçalhos mais `main.cpp` e `test_scaling.cpp` |
| `report/` | `scaling.ts` transforma as linhas do benchmark em speed-up, eficiência e no ajuste de Amdahl |
| `results/` | saída versionada do benchmark e do relatório |
| `dashboard/` | página estática que desenha speed-up e eficiência contra trabalhadores a partir de `results/results.js` |
| `bench.json` | a grade do benchmark: 3 linguagens, 6 implementações, 4 quantidades de trabalhadores |

Cada implementação tem a mesma linha de comando, `<carga>-<modo> <n> <trabalhadores>`, com carga `primes` ou `mandelbrot` e modo `seq`, `static` ou `dynamic`. Ela imprime uma linha JSON que segue o [contrato de benchmark](../../../docs/pt/benchmarks.md). `n` é o número de itens: os inteiros até `n` para os primos, ou os pixels de uma imagem quadrada cujo lado é a raiz quadrada inteira de `n`.

Duas formas de dividir o trabalho estão implementadas, porque a diferença entre elas é o principal motivo de o speed-up não ser linear aqui:

- `static`: um bloco contíguo por trabalhador. Nenhuma coordenação, mas os blocos não custam o mesmo, então alguns trabalhadores terminam cedo e ficam esperando.
- `dynamic`: os trabalhadores pegam o próximo pedaço pequeno (10.000 números ou 4 linhas) de um contador atômico compartilhado. Rust usa uma fila atrás de um mutex para a imagem, porque é assim que mantém a prova de que cada pixel tem um único escritor.

## Testes

```sh
docker compose run --rm rust-test     # cargo fmt --check, clippy -D warnings, cargo test
docker compose run --rm go-test       # gofmt, go vet, golangci-lint, go test -race
docker compose run --rm cpp-test      # clang-format --dry-run --Werror, testes compilados com -Wall -Wextra -Werror
docker compose run --rm report-test   # bun test das fórmulas do relatório
```

O que os testes provam:

- O resultado paralelo é exatamente igual ao sequencial, para 1, 2, 3, 4 e 8 trabalhadores e para os dois escalonamentos, inclusive em intervalos menores que o número de trabalhadores.
- Valores conhecidos: 25 primos até 100, 9.592 primos até 100.000 com soma 454.396.537.
- As três linguagens geram a mesma imagem: o mesmo checksum de referência é verificado nas três suítes de teste.
- Os testes de Go rodam com o detector de corridas.
- O ajuste de Amdahl devolve a fração serial que gerou dados exatos de Amdahl, e o relatório recusa um benchmark cujos checksums diferem.

## Benchmark

Um comando, a partir da raiz do repositório (precisa do Bun na máquina, como todo benchmark do repositório):

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
```

Ele compila cada implementação dentro da sua imagem fixada, roda a grade inteira sem rede e escreve `results/results.md`, `results/results.json` e `results/results.js`. Depois, derive as tabelas de escalabilidade, em Docker:

```sh
docker compose --profile report run --rm report
```

Isso escreve `results/scaling.md` e `results/scaling.json`. Abra `dashboard/index.html` em um navegador para ver o gráfico.

## Resultados

Medido em 2026-10-07 em um AMD Ryzen 7 5700X3D (8 núcleos físicos, 16 lógicos), Docker Desktop no Windows com 16 CPUs, `n` = 9.000.000 (primos até 9.000.000 e uma imagem de 3000 x 3000), 5 execuções por linha depois de 1 de aquecimento. Máquina, versões dos runtimes e comandos exatos: [results/results.md](results/results.md). Todas as linhas, com média, desvio padrão, melhor execução e fração serial: [results/scaling.md](results/scaling.md) (em inglês, gerado pelo script).

**Leia estes números com cuidado.** A máquina estava sendo dividida com outras cargas em Docker enquanto o benchmark rodava, então os tempos têm ruído: o desvio padrão de uma linha é, em média, 9% da sua média, e passa de 20% em algumas linhas. É por isso que cada célula abaixo é calculada entre as execuções mais rápidas (melhor tempo sequencial sobre melhor tempo paralelo), e é por isso que a mesma grade, rodada duas vezes, não dá a mesma tabela. A faixa entre as duas rodadas aparece depois das tabelas. Em uma máquina sem outras cargas, espere valores mais altos e mais estáveis.

### Os resultados paralelos são iguais aos sequenciais

As 72 linhas da grade (3 linguagens, sequencial, estático e dinâmico, 1 a 8 trabalhadores) imprimiram o mesmo checksum por carga:

| Carga | Resultado |
| --- | --- |
| primes | 602.489 primos até 9.000.000, soma 2.613.521.583.098 |
| mandelbrot | 1.554.159.510 iterações no total, checksum da imagem `99d0e04fa277c931` |

### Speed-up e eficiência

Cada célula é `speed-up (eficiência)` para aquela quantidade de trabalhadores. A base é a implementação sequencial da mesma linguagem.

**primes**

| Linguagem | Escalonamento | Sequencial (ms) | 1 | 2 | 4 | 8 | Fração serial ajustada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | estático | 1481 | 0,98 (98%) | 1,50 (75%) | 2,35 (59%) | 4,26 (53%) | 19,8% |
| cpp | dinâmico | 1481 | 0,90 (90%) | 1,74 (87%) | 3,22 (81%) | 4,22 (53%) | 11,5% |
| go | estático | 1572 | 0,82 (82%) | 1,50 (75%) | 1,59 (40%) | 2,46 (31%) | 39,0% |
| go | dinâmico | 1572 | 0,82 (82%) | 1,30 (65%) | 2,53 (63%) | 3,34 (42%) | 25,1% |
| rust | estático | 1388 | 0,89 (89%) | 1,46 (73%) | 2,28 (57%) | 3,31 (41%) | 24,6% |
| rust | dinâmico | 1388 | 0,75 (75%) | 1,67 (84%) | 2,49 (62%) | 3,07 (38%) | 21,4% |

**mandelbrot**

| Linguagem | Escalonamento | Sequencial (ms) | 1 | 2 | 4 | 8 | Fração serial ajustada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | estático | 4455 | 0,90 (90%) | 1,80 (90%) | 1,95 (49%) | 2,59 (32%) | 28,7% |
| cpp | dinâmico | 4455 | 0,89 (89%) | 2,00 (100%) | 3,59 (90%) | 6,24 (78%) | 3,3% |
| go | estático | 4550 | 0,92 (92%) | 2,03 (102%) | 1,92 (48%) | 2,65 (33%) | 26,6% |
| go | dinâmico | 4550 | 0,94 (94%) | 1,88 (94%) | 3,34 (83%) | 5,37 (67%) | 6,8% |
| rust | estático | 5246 | 0,79 (79%) | 1,51 (75%) | 1,78 (45%) | 2,82 (35%) | 32,7% |
| rust | dinâmico | 5246 | 0,88 (88%) | 1,98 (99%) | 3,58 (89%) | 5,44 (68%) | 4,8% |

Faixa entre duas rodadas da grade inteira, speed-up com 8 trabalhadores (a rodada versionada é o segundo valor):

| Carga | Escalonamento | cpp | go | rust |
| --- | --- | --- | --- | --- |
| primes | estático | 4,32 e 4,26 | 4,10 e 2,46 | 4,12 e 3,31 |
| primes | dinâmico | 4,45 e 4,22 | 5,01 e 3,34 | 4,49 e 3,07 |
| mandelbrot | estático | 2,19 e 2,59 | 2,23 e 2,65 | 2,71 e 2,82 |
| mandelbrot | dinâmico | 6,11 e 6,24 | 4,23 e 5,37 | 6,05 e 5,44 |

### Ajuste de Amdahl: a fração serial estimada

A última coluna das tabelas é a fração serial `s` da lei de Amdahl, `S(N) = 1 / (s + (1 - s) / N)`, ajustada por mínimos quadrados aos speed-ups medidos com 2, 4 e 8 trabalhadores.

- **Mandelbrot, escalonamento dinâmico: s é 3,3% (C++), 6,8% (Go) e 4,8% (Rust).** É o melhor que o programa faz. Com s perto de 5%, a lei de Amdahl limita o speed-up a cerca de 20, por mais núcleos que se acrescentem, e prevê cerca de 6 com 8 trabalhadores, que é o que foi medido.
- **Mandelbrot, escalonamento estático: s é 28,7% (C++), 26,6% (Go) e 32,7% (Rust).** O código é o mesmo, só a divisão mudou, e o speed-up para perto de 2,7.
- **Primos: s fica entre 11,5% e 39,0%**, com o escalonamento dinâmico abaixo do estático nas três linguagens. São as linhas com mais ruído da grade, como mostra a tabela de faixas.

### Por que não é linear

O s ajustado é uma fração serial *efetiva*. O código realmente serial nesses programas é minúsculo: iniciar o processo e as threads, alocar a imagem, uma passada sobre ela para o checksum, imprimir uma linha. O que o ajuste absorve é todo o resto que impede os trabalhadores de trabalhar:

1. **Desbalanceamento de carga.** É o efeito grande, e as linhas de Mandelbrot estático o isolam. Com 2 trabalhadores a imagem é cortada no seu eixo de simetria, as duas metades custam o mesmo, e o speed-up chega a 1,8 em C++ e 2,0 em Go (1,5 em Rust, uma linha com ruído). Com 4 trabalhadores os dois blocos do meio concentram a maior parte dos pontos de dentro do conjunto, os dois trabalhadores das pontas terminam cedo e esperam, e o speed-up fica em cerca de 1,9. A lei de Amdahl lê o tempo ocioso como código serial: um s perto de 30% para um programa que não tem esse código. O escalonamento dinâmico remove o desbalanceamento e o s cai para menos de 7%. A fração serial por linha em `results/scaling.md` (Karp-Flatt) também mostra isso: ela salta de uma quantidade de trabalhadores para a outra em vez de ficar constante, sinal de sobrecarga e não de código serial.
2. **A maquinaria paralela.** O código paralelo com 1 trabalhador é mais lento que o código sequencial em todas as linhas (speed-up entre 0,75 e 0,98): threads, o contador compartilhado, a fila e a fusão dos parciais não são de graça.
3. **Os núcleos não estão todos livres nem são todos iguais.** 8 trabalhadores precisam dos 8 núcleos físicos desta CPU, que também rodam o sistema operacional, o Docker e, durante esta medição, outros contêineres. Um trabalhador que perde o núcleo por um instante atrasa o join. Uma CPU também costuma rodar um único núcleo ocupado em um clock mais alto do que oito, o que este benchmark não isola.
4. **Código realmente serial.** Pequeno aqui, mas é a única parte que nenhuma quantidade de núcleos remove.

A leitura prática: antes de culpar a lei de Amdahl, confira se todos os trabalhadores ficam ocupados até o fim. Aqui essa única mudança, de estático para dinâmico, leva o speed-up de Mandelbrot com 8 trabalhadores de cerca de 2,7 para cerca de 5,7.

## Dependências e versões

Nenhuma biblioteca fora da biblioteca padrão de cada linguagem: `std::thread` em Rust e C++, goroutines em Go. Uma crate como rayon esconderia o mecanismo que é o assunto deste mini-projeto.

| Ferramenta | Versão |
| --- | --- |
| Rust | imagem `rust:1.99.0-slim-trixie` |
| Go | imagem `golang:1.27.1-bookworm`, golangci-lint de `golangci/golangci-lint:v2.14.0` |
| C++ | imagem `gcc:16.2.0-trixie` (C++23), clang-format do pacote Debian |
| Relatório | imagem `oven/bun:1.4.2` |
