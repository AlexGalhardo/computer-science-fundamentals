# Escalando por núcleos

> English version: [docs/en/parallelism/scaling-by-cores.md](../../en/parallelism/scaling-by-cores.md) · Versión en español: [docs/es/parallelism/scaling-by-cores.md](../../es/parallelism/scaling-by-cores.md)

Área: Paralelismo. Mini-projeto: [projects/parallelism/scaling-by-cores](../../../projects/parallelism/scaling-by-cores/README.pt-BR.md) (MP-PAR-1). Linguagens: Rust, Go, C++.

## A pergunta

Uma máquina tem 8 núcleos. Um programa roda 8 vezes mais rápido nela? Este mini-projeto mede a resposta para dois programas limitados por CPU e explica a distância entre o ideal e a medição.

## Conceitos

| Conceito | Significado |
| --- | --- |
| Speed-up | `S(N) = T(1) / T(N)`: quantas vezes o programa fica mais rápido com N trabalhadores. A base aqui é o programa sequencial, e não o paralelo com um trabalhador |
| Eficiência | `E(N) = S(N) / N`: a parte de cada trabalhador que virou ganho |
| Escalabilidade forte | O tamanho do problema é fixo e só os trabalhadores variam. É o que o benchmark faz |
| Lei de Amdahl | Com fração serial `s`, `S(N) = 1 / (s + (1 - s) / N)`, que nunca passa de `1 / s` |
| Métrica de Karp-Flatt | Amdahl invertida para uma medição: `s = (1/S - 1/N) / (1 - 1/N)`. `s` constante indica código serial, `s` crescente indica sobrecarga |
| Paralelismo de dados | A mesma operação sobre fatias dos dados: números a testar, linhas a calcular |
| Fork-join | Disparar os trabalhadores, esperar todos e só então ler os resultados |
| Escalonamento estático | Um bloco contíguo por trabalhador, decidido antes de o trabalho começar |
| Escalonamento dinâmico | Os trabalhadores buscam o próximo pedaço pequeno quando ficam livres |
| Redução | Cada trabalhador mantém um parcial local e os parciais são combinados no fim |

## As duas cargas

**Contagem de primos.** Contar os primos até `n` por divisão por tentativa, com divisores ímpares até a raiz quadrada. Provar que um número é primo custa cerca de `sqrt(n) / 2` divisões, então números grandes são mais caros que os pequenos. O resultado é a quantidade e a soma dos primos.

**Mandelbrot.** Calcular uma imagem quadrada do conjunto de Mandelbrot: para cada pixel, iterar `z = z² + c` até `|z| > 2` ou 1.000 passos. Pixels dentro do conjunto custam 1.000 passos, pixels distantes custam um ou dois. O resultado é a imagem, resumida pelo total de iterações e por um checksum.

As duas têm paralelismo de dados: nenhum número e nenhum pixel depende de outro. As duas são irregulares: fatias iguais de dados não são quantidades iguais de trabalho. Essa segunda propriedade é o que separa os dois escalonamentos.

## Como o trabalho é dividido

```text
estático, 4 trabalhadores                    dinâmico, 4 trabalhadores

linhas  0 ..  499 -> trabalhador 0 (barato)  contador compartilhado: próxima linha livre
linhas 500 .. 999 -> trabalhador 1 (caro)    cada trabalhador repete:
linhas 1000..1499 -> trabalhador 2 (caro)        pega as próximas 4 linhas
linhas 1500..1999 -> trabalhador 3 (barato)      calcula essas linhas
                                             até não sobrar linha
0 e 3 terminam cedo e ficam esperando        ninguém espera enquanto há trabalho
```

Com o escalonamento estático, o programa é tão lento quanto o seu trabalhador mais azarado. Com o dinâmico, as linhas caras acabam espalhadas por todos os trabalhadores, ao preço de uma operação atômica por pedaço. O pedaço é pequeno o bastante para equilibrar a carga e grande o bastante para manter esse contador compartilhado fora do laço quente: 4 linhas da imagem, ou 10.000 números.

## Por que o resultado paralelo é exatamente o sequencial

O critério de aceitação do mini-projeto é igualdade, não semelhança.

- **Nenhuma escrita compartilhada.** Cada pixel tem um único escritor, e cada trabalhador conta em uma variável local. Não existe corrida de dados para fazer o resultado depender do escalonamento.
- **Redução de inteiros.** Os parciais são inteiros combinados por soma, que é associativa e comutativa, então o agrupamento e a ordem dos trabalhadores não importam.
- **O ponto flutuante fica dentro do pixel.** A iteração de Mandelbrot usa doubles, mas cada pixel é calculado sozinho, pelas mesmas operações na mesma ordem. Nada é somado entre pixels em ponto flutuante.
- **Sem multiplicação e soma fundidas (FMA).** `x * y + z` calculado em uma única instrução arredonda uma vez em vez de duas e pode mudar o último bit. Rust nunca funde por conta própria, o código em Go arredonda cada produto com uma conversão explícita `float64(...)`, e o código em C++ é compilado com `-ffp-contract=off`. É por isso que as três linguagens produzem o mesmo checksum.

Os testes verificam a igualdade para 1, 2, 3, 4 e 8 trabalhadores com os dois escalonamentos, e as três suítes verificam o mesmo checksum de referência. O script de relatório se recusa a gerar a tabela quando alguma linha do benchmark imprime um checksum diferente.

## O que cada linguagem acrescenta

| Linguagem | Trabalhadores | O que é específico |
| --- | --- | --- |
| Rust | `std::thread::scope` | O compilador exige prova de que os trabalhadores escrevem em memória disjunta: a imagem é cortada com `split_at_mut` e `chunks_mut`, e o escalonamento dinâmico entrega os blocos a partir de uma fila atrás de um `Mutex` |
| Go | goroutines com `sync.WaitGroup` | Os trabalhadores escrevem em partes disjuntas de um mesmo slice. Nada na linguagem confere isso, então os testes rodam com o detector de corridas (`go test -race`) |
| C++ | `std::thread` e `join` | Mesma estrutura de Go, com `std::atomic`. A correção depende da mesma disciplina, sem verificador na execução dos testes |

Nenhuma dependência externa é usada em nenhuma das três: a lição é o mecanismo, e uma biblioteca como rayon o esconderia.

## Medindo

```sh
bun run bench -- --project projects/parallelism/scaling-by-cores
docker compose -f projects/parallelism/scaling-by-cores/docker-compose.yml --profile report run --rm report
```

O primeiro comando roda cada implementação com 1, 2, 4 e 8 trabalhadores dentro das imagens fixadas das linguagens, sem rede, e o hyperfine cronometra cada processo várias vezes. O segundo deriva speed-up, eficiência e o ajuste de Amdahl, e escreve `results/scaling.md`.

Duas decisões sobre os números:

- **Base.** O speed-up é calculado contra a implementação sequencial. O código paralelo com um trabalhador também está na tabela, então o custo da própria maquinaria paralela fica visível.
- **Melhor execução e média.** Outra carga na máquina só consegue deixar uma execução mais lenta. Por isso o speed-up é calculado entre as execuções mais rápidas, e a média com o desvio padrão aparece ao lado para mostrar o ruído.

## Resultados

Medido em 2026-10-07 em um AMD Ryzen 7 5700X3D (8 núcleos físicos, 16 lógicos), Docker Desktop no Windows com 16 CPUs, `n` = 9.000.000 (primos até 9.000.000 e uma imagem de 3000 x 3000), 5 execuções por linha depois de 1 de aquecimento. Máquina, versões dos runtimes e comandos exatos: [results/results.md](../../../projects/parallelism/scaling-by-cores/results/results.md). Todas as linhas, com média, desvio padrão, melhor execução e fração serial: [results/scaling.md](../../../projects/parallelism/scaling-by-cores/results/scaling.md) (em inglês, gerado pelo script).

**Leia estes números com cuidado.** A máquina estava sendo dividida com outras cargas em Docker enquanto o benchmark rodava, então os tempos têm ruído: o desvio padrão de uma linha é, em média, 9% da sua média, e passa de 20% em algumas linhas. É por isso que cada célula abaixo é calculada entre as execuções mais rápidas (melhor tempo sequencial sobre melhor tempo paralelo), e é por isso que a mesma grade, rodada duas vezes, não dá a mesma tabela. A faixa entre as duas rodadas aparece depois das tabelas. Em uma máquina sem outras cargas, espere valores mais altos e mais estáveis.

### Os resultados paralelos são iguais aos sequenciais

As 72 linhas da grade (3 linguagens, sequencial, estático e dinâmico, 1 a 8 trabalhadores) imprimiram o mesmo checksum por carga:

| Carga | Resultado |
| --- | --- |
| primes | 602.489 primos até 9.000.000, soma 2.613.521.583.098 |
| mandelbrot | 1.554.159.510 iterações no total, checksum da imagem `99d0e04fa277c931` |

### Speed-up e eficiência

Cada célula é `speed-up (eficiência)` para aquela quantidade de trabalhadores. A base é a implementação sequencial da mesma linguagem.

#### primes

| Linguagem | Escalonamento | Sequencial (ms) | 1 | 2 | 4 | 8 | Fração serial ajustada |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | estático | 1481 | 0,98 (98%) | 1,50 (75%) | 2,35 (59%) | 4,26 (53%) | 19,8% |
| cpp | dinâmico | 1481 | 0,90 (90%) | 1,74 (87%) | 3,22 (81%) | 4,22 (53%) | 11,5% |
| go | estático | 1572 | 0,82 (82%) | 1,50 (75%) | 1,59 (40%) | 2,46 (31%) | 39,0% |
| go | dinâmico | 1572 | 0,82 (82%) | 1,30 (65%) | 2,53 (63%) | 3,34 (42%) | 25,1% |
| rust | estático | 1388 | 0,89 (89%) | 1,46 (73%) | 2,28 (57%) | 3,31 (41%) | 24,6% |
| rust | dinâmico | 1388 | 0,75 (75%) | 1,67 (84%) | 2,49 (62%) | 3,07 (38%) | 21,4% |

#### mandelbrot

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

1. **Desbalanceamento de carga.** É o efeito grande, e as linhas de Mandelbrot estático o isolam. Com 2 trabalhadores a imagem é cortada no seu eixo de simetria, as duas metades custam o mesmo, e o speed-up chega a 1,8 em C++ e 2,0 em Go (1,5 em Rust, uma linha com ruído). Com 4 trabalhadores os dois blocos do meio concentram a maior parte dos pontos de dentro do conjunto, os dois trabalhadores das pontas terminam cedo e esperam, e o speed-up fica em cerca de 1,9. A lei de Amdahl lê o tempo ocioso como código serial: um s perto de 30% para um programa que não tem esse código. O escalonamento dinâmico remove o desbalanceamento e o s cai para menos de 7%. A fração serial por linha em `projects/parallelism/scaling-by-cores/results/scaling.md` (Karp-Flatt) também mostra isso: ela salta de uma quantidade de trabalhadores para a outra em vez de ficar constante, sinal de sobrecarga e não de código serial.
2. **A maquinaria paralela.** O código paralelo com 1 trabalhador é mais lento que o código sequencial em todas as linhas (speed-up entre 0,75 e 0,98): threads, o contador compartilhado, a fila e a fusão dos parciais não são de graça.
3. **Os núcleos não estão todos livres nem são todos iguais.** 8 trabalhadores precisam dos 8 núcleos físicos desta CPU, que também rodam o sistema operacional, o Docker e, durante esta medição, outros contêineres. Um trabalhador que perde o núcleo por um instante atrasa o join. Uma CPU também costuma rodar um único núcleo ocupado em um clock mais alto do que oito, o que este benchmark não isola.
4. **Código realmente serial.** Pequeno aqui, mas é a única parte que nenhuma quantidade de núcleos remove.

A leitura prática: antes de culpar a lei de Amdahl, confira se todos os trabalhadores ficam ocupados até o fim. Aqui essa única mudança, de estático para dinâmico, leva o speed-up de Mandelbrot com 8 trabalhadores de cerca de 2,7 para cerca de 5,7.

## Para onde ir depois

- Quiz: área `parallelism`, tópicos `amdahl-gustafson`, `speedup-efficiency-scalability`, `data-vs-task-parallelism`, `fork-join-work-stealing`, `parallel-sorting-reductions`, `determinism-reproducibility`, `false-sharing-cache-effects`, `shared-vs-distributed-memory` e `map-reduce-patterns`.
- Capítulos de origem: Tanenbaum e Bos, Sistemas Operacionais Modernos, capítulo 8 (sistemas com múltiplos processadores); Aho, Lam, Sethi e Ullman, Compiladores, capítulo 11 (otimização para paralelismo e localidade).
