# hybrid-quicksort

> English version: [README.md](README.md)

Um quicksort com dois botões: a estratégia de pivô (primeiro elemento, aleatório, mediana de três) e o limiar `k` abaixo do qual um trecho é ordenado com insertion sort. O projeto mede o que cada botão muda na prática: o pivô decide se a entrada ordenada é o melhor caso ou o pior caso quadrático, e o limiar reduz o fator constante.

Item do plano: MP-ALG-4. Linguagens: C++ e Rust. Texto completo: [docs/pt/algorithms/hybrid-quicksort.md](../../../docs/pt/algorithms/hybrid-quicksort.md).

## O que ensina

- Com o primeiro elemento como pivô, entradas ordenadas e invertidas dividem todo trecho em "nada" e "todo o resto": `n` níveis em vez de `log n`, e tempo que cresce 16 vezes quando `n` cresce 4 vezes.
- Um pivô aleatório elimina a entrada ruim: o pior caso passa a depender da sorte, não dos dados. A mediana de três faz o mesmo para dados ordenados ao preço de duas comparações.
- Fazer a recursão no lado menor mantém a pilha com profundidade `O(log n)` mesmo quando o tempo é quadrático.
- Trocar para insertion sort em trechos pequenos mantém o crescimento `O(n log n)` e diminui a constante. O melhor `k` é achado medindo, e depende da linguagem e da máquina.

## Tópicos do quiz que demonstra

Área `algorithms`:

- `quicksort` (particionamento, pior caso, estratégias de pivô, pivô aleatório, profundidade da pilha, limiar de insertion sort)
- `elementary-sorts` (insertion sort em trechos pequenos ou quase ordenados)
- `sorting-properties` (comportamento adaptativo e formatos de entrada)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-hybrid-quicksort.sh        # Linux e macOS
./setup-windows-hybrid-quicksort.ps1    # Windows
```

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/quicksort.hpp` | O quicksort, as três estratégias de pivô, os formatos de entrada e o checksum |
| `cpp/main.cpp` | Entrada do benchmark e a varredura de limiar |
| `cpp/test_quicksort.cpp` | Testes |
| `rust/src/lib.rs`, `rust/src/main.rs` | O mesmo em Rust, com os testes dentro de `lib.rs` |
| `bench.json`, `results/` | Grade do benchmark e resultados versionados |
| `dashboard/` | Página estática que desenha `results/results.js` |

Uma implementação se chama `<pivô>-k<limiar>`, por exemplo `median3-k10`. As entradas são montadas em memória a partir de uma semente fixa: `random`, `sorted` e `reversed` têm os mesmos valores em ordem diferente.

## Testes

```sh
docker compose run --rm cpp-test
docker compose run --rm rust-test
```

- Toda estratégia de pivô com todo limiar (0, 5, 10, 20, 50) ordena todo formato em seis tamanhos, mais uma entrada cheia de duplicatas. O oráculo é a ordenação da biblioteca.
- Com o pivô no primeiro elemento em entrada ordenada, o tempo precisa crescer mais de 8 vezes quando `n` cresce 4 vezes (o crescimento quadrático prevê 16), enquanto a mediana de três precisa crescer menos de 8 vezes (`n log n` prevê cerca de 4,4).

Formatadores e linters (clang-format, rustfmt, clippy) rodam nas imagens base:

```sh
./lint.sh          # confere
./lint.sh --fix    # reescreve
```

## Benchmark

```sh
bun run bench -- --project projects/algorithms/hybrid-quicksort
```

A grade roda sete implementações (`first-k0`, `random-k0`, `median3-k0`, `median3-k5`, `median3-k10`, `median3-k20`, `median3-k50`) nos três formatos com 4.000, 16.000 e 1.000.000 de valores, nas duas linguagens. Dentro de cada programa a ordenação é repetida 5 vezes em cópias novas e a mediana é informada como trecho medido.

Limites: `first-k0` para em 16.000 valores, porque com 1.000.000 o caso quadrático dele levaria minutos por execução. Todo o resto roda em milissegundos.

### Varredura de limiar

Um comando por linguagem ordena os mesmos 1.000.000 de valores aleatórios com `k` = 0, 5, 10, 20 e 50 e imprime o melhor valor:

```sh
docker compose run --rm cpp-sweep
docker compose run --rm rust-sweep
```

A saída versionada está em `results/threshold-cpp.md` e `results/threshold-rust.md`.

### Dashboard

Abra `dashboard/index.html` em um navegador, direto do disco. Ele lê o `results/results.js` versionado e desenha tempo contra `n`, uma linha por estratégia. Use o seletor "Variant" para alternar entre `random`, `sorted` e `reversed`: em `sorted` a linha de `first-k0` sobe com inclinação 2 no gráfico log-log, enquanto as outras ficam perto da inclinação 1.

### O que os resultados versionados mostram

Trecho medido em milissegundos (mediana de 5 ordenações), do `results/results.md` (120 linhas, cerca de 4 minutos):

| Implementação | Formato | n | C++ | Rust |
| --- | --- | ---: | ---: | ---: |
| `first-k0` | sorted | 4.000 | 3,81 | 14,9 |
| `first-k0` | sorted | 16.000 | 51,4 | 212 |
| `median3-k0` | sorted | 4.000 | 0,04 | 0,06 |
| `median3-k0` | sorted | 16.000 | 0,17 | 0,19 |
| `random-k0` | sorted | 16.000 | 0,29 | 0,30 |
| `median3-k0` | random | 1.000.000 | 89,8 | 121 |
| `median3-k5` | random | 1.000.000 | 85,7 | 79,3 |
| `median3-k10` | random | 1.000.000 | 82,5 | 68,7 |
| `median3-k20` | random | 1.000.000 | 74,6 | 69,6 |
| `median3-k50` | random | 1.000.000 | 68,1 | 65,7 |

- **Pivô.** Em entrada ordenada, `first-k0` cresceu 13,5 vezes (C++) e 14,2 vezes (Rust) quando `n` cresceu 4 vezes: crescimento quadrático, que prevê 16. A mediana de três cresceu cerca de 4 vezes. Com 16.000 valores o pivô no primeiro elemento já é cerca de 300 vezes (C++) e 1.100 vezes (Rust) mais lento que a mediana de três.
- **Limiar.** O melhor valor registrado é **k = 50** nas duas linguagens, na grade acima e na varredura dedicada (`results/threshold-cpp.md`: 56,7 ms contra 91,8 ms para k = 0, `results/threshold-rust.md`: 60,4 ms contra 67,7 ms). O ganho é um fator constante, como esperado.
- Os intervalos da varredura se sobrepõem para limiares vizinhos, e a máquina estava compartilhada, então leia "k = 50 é o melhor aqui" como "um limiar de algumas dezenas de valores ajuda", não como uma constante universal.
- As 120 linhas imprimem o mesmo checksum para o mesmo formato e tamanho: toda estratégia, todo limiar e as duas linguagens produzem a mesma saída ordenada.
