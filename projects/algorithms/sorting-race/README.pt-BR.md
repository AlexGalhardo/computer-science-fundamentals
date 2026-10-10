# sorting-race

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Seis algoritmos de ordenação (bubble, insertion, merge, quick, heap e radix), escritos do zero em sete linguagens, ordenam os mesmos arquivos de entrada. A corrida mostra duas coisas ao mesmo tempo: como o tempo medido de cada algoritmo acompanha seu Big O quando `n` cresce, e quanto do tempo pertence à linguagem e não ao algoritmo.

Item do plano: MP-ALG-1. Texto completo: [docs/pt/algorithms/sorting-race.md](../../../docs/pt/algorithms/sorting-race.md).

## O que ensina

- Um algoritmo quadrático perde para um `n log n` em qualquer linguagem quando `n` é grande o bastante: o bubble sort em C++ fica mais lento que o merge sort em Python bem antes de 10^5 valores.
- A ordem da entrada importa para alguns algoritmos e não para outros. Insertion e bubble sort são lineares em entrada ordenada, heapsort e merge sort não mudam.
- Dobrar `n` multiplica o tempo do merge sort por cerca de 2,1, e o do bubble sort por cerca de 4. Esse teste de dobrar é como um benchmark revela a ordem de crescimento.
- O radix sort vence as ordenações por comparação em inteiros de largura fixa porque nunca compara dois valores.
- Em Elixir a lição muda: com listas encadeadas imutáveis não há troca nem índice, então o heapsort vira um heap esquerdista e o quicksort monta listas novas.

## Tópicos do quiz que demonstra

Área `algorithms`:

- `elementary-sorts` (bubble e insertion sort, inversões, melhor e pior caso)
- `merge-sort` (intercalação, estabilidade, o teste de dobrar)
- `quicksort` (particionamento, mediana de três)
- `heapsort` (heap em vetor, descida, ordenação in-place)
- `linear-time-sorts` (radix sort LSD e a passada estável de contagem)
- `sorting-properties` (algoritmos estáveis, in-place e adaptativos)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-sorting-race.sh        # Linux e macOS
./setup-windows-sorting-race.ps1    # Windows
```

O script constrói uma imagem fixada por linguagem e roda os testes das sete.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/` | Implementação de referência, um arquivo por algoritmo, mais o gerador de entrada (`generate.ts`), a entrada do benchmark (`bench.ts`) e o verificador de resultados (`check-results.ts`) |
| `cpp/`, `python/`, `java/`, `elixir/`, `rust/`, `go/` | Os mesmos seis algoritmos, uma entrada de benchmark e os mesmos casos de teste |
| `data/` | Arquivos de entrada gerados, um inteiro por linha. Não são versionados |
| `bench.json` | Grade do benchmark lida pelo runner do repositório |
| `results/` | Resultados versionados do benchmark (`results.md`, `results.json`, `results.js`) |
| `dashboard/` | Página estática que desenha `results/results.js` |

Todo algoritmo é uma função pura: recebe os valores e devolve uma nova sequência ordenada. Nenhuma implementação chama uma ordenação de biblioteca. Os valores são inteiros de 0 a 2^31 - 1, a faixa para a qual o radix sort foi escrito.

## Testes

```sh
docker compose run --rm ts-test       # ou cpp-test, python-test, java-test, elixir-test, rust-test, go-test
```

Toda linguagem roda os mesmos seis casos para cada algoritmo: vazio, um elemento, ordenado, invertido, com duplicatas e aleatório (1.000 valores de uma semente fixa). A referência em TypeScript também roda um teste de propriedade sobre 200 vetores aleatórios, conferindo que a saída está em ordem e é uma permutação da entrada.

Formatadores e linters (clang-format, ruff, mix format, rustfmt e clippy, gofmt e golangci-lint, javac `-Xlint:all` e Spotless) rodam nas imagens base de [docs/pt/environment.md](../../../docs/pt/environment.md):

```sh
./lint.sh          # confere
./lint.sh --fix    # reescreve
bunx biome check projects/algorithms/sorting-race    # TypeScript, a partir da raiz do repositório
```

## Benchmark

Um comando, a partir da raiz do repositório:

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

Ele gera os arquivos de entrada (semente fixa, formatos `random`, `sorted` e `reversed`), compila cada linguagem, roda cada algoritmo nos arquivos aleatórios dentro de um contêiner sem rede e escreve `results/`. Depois, confira as duas afirmações do benchmark e imprima a tabela de formatos de entrada:

```sh
cd projects/algorithms/sorting-race
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/check-results.ts
docker run --rm --network none -v "$PWD:/app" -w /app oven/bun:1.4.2 bun run ts/src/shapes.ts 10000
```

O verificador falha se alguma implementação imprimir um checksum diferente para o mesmo arquivo de entrada (182 linhas, 7 linguagens, 5 arquivos na execução versionada) ou se o merge sort passar do seu limite de dobra. A saída versionada do script de formatos é `results/shapes.md`.

### Limites

| Limite | Valor | Motivo |
| --- | --- | --- |
| Algoritmos quadráticos (bubble, insertion) | `n` até 10.000 | Em 100.000 uma única execução leva minutos em Python e Elixir |
| Tamanhos do benchmark | 1.000, 2.000, 10.000, 100.000 e 200.000 | Dois pares de dobra: 1.000 para 2.000 para os algoritmos quadráticos e 100.000 para 200.000 para os demais |
| Formato do benchmark | só `random`, nas sete linguagens | Correr os três formatos em sete linguagens são 546 linhas. Os formatos são comparados em uma linguagem pelo `shapes.ts` |
| Gerador de entrada | três formatos, até 1.000.000 | `bun run ts/src/generate.ts 1000000` escreve os arquivos de 10^6. Acrescente tamanhos e formatos ao `bench.json` para colocá-los na corrida |
| Execuções | 3 execuções medidas após 1 de aquecimento, por linha | A tabela informa média e desvio padrão do processo inteiro |
| Trecho medido | a mais rápida de até 5 ordenações dentro do programa, enquanto o total fica abaixo de 300 ms | O mínimo é o valor menos perturbado por outros programas na máquina |

A execução versionada tem 182 linhas e levou cerca de 16 minutos na máquina registrada em `results/results.md`, que estava compartilhada com outras cargas no momento. A maior parte disso é subida de contêiner, um contêiner por vez.

### O que os resultados versionados mostram

Trecho medido (só a ordenação), entrada aleatória, em milissegundos:

| n | algoritmo | C++ | Rust | Go | Java | TypeScript | Python | Elixir |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10.000 | bubble | 69,0 | 108 | 63,6 | 82,1 | 252 | 7.319 | 1.205 |
| 10.000 | insertion | 12,8 | 23,4 | 18,3 | 12,1 | 104 | 4.317 | 562 |
| 10.000 | merge | 0,60 | 0,65 | 0,63 | 1,32 | 1,55 | 32,7 | 2,94 |
| 200.000 | merge | 18,1 | 14,2 | 21,5 | 24,3 | 47,1 | 1.121 | 211 |
| 200.000 | heap | 22,3 | 20,4 | 20,7 | 29,9 | 48,5 | 1.294 | 758 |

- O algoritmo pesa mais que a linguagem: com 10.000 valores, o merge sort em Python (32,7 ms) é duas vezes mais rápido que o bubble sort em C++ (69,0 ms), e a diferença cresce com `n`.
- Dobrar `n` de 100.000 para 200.000 multiplicou o tempo do merge sort por 1,76 (C++), 1,81 (Rust), 1,82 (Go), 1,93 (Python), 2,37 (TypeScript) e 2,45 (Java), todos abaixo do limite de 2,5 e longe do 4 de um algoritmo quadrático.
- O Elixir é a exceção: 3,51 na execução versionada, e entre 2,1 e 2,6 em uma execução separada com a máquina calma. Ele ordena listas encadeadas imutáveis, então o tempo dele inclui o coletor de lixo copiando dados vivos. O verificador dá a ele o limite 4, o bastante para mostrar que o crescimento não é quadrático. Pares que levam menos de 1 ms (1.000 para 2.000 valores) são impressos, mas não julgados, porque o ruído do relógio é maior que a medida.
- Formato da entrada, TypeScript, 10.000 valores (`results/shapes.md`): o bubble sort leva 220 ms em entrada aleatória e 0,13 ms em entrada ordenada, o insertion sort 126 ms e 0,36 ms. Heap e radix sort ficam nos mesmos poucos milissegundos em qualquer formato.

Tempos em uma máquina compartilhada são ruidosos: leia a dispersão em `results/results.md` antes de comparar dois números próximos.

### Como ler os resultados

O `results/results.md` tem dois tempos por linha. `process` é o programa inteiro medido pelo hyperfine, incluindo a subida do runtime e a leitura do arquivo. `section` é só a chamada da ordenação, cronometrada pelo próprio programa. Use `section` para comparar algoritmos e `process` para ver quanto um usuário esperaria.

### Dashboard

Abra `dashboard/index.html` em um navegador, direto do disco. Ele carrega o `results/results.js` versionado com uma tag `<script>` e não faz nenhuma requisição de rede. O gráfico mostra tempo contra `n` em eixos log-log, uma linha por algoritmo, com seletores de linguagem, formato da entrada e métrica. Em eixos log-log, um algoritmo quadrático é uma reta de inclinação 2 e um `n log n` é uma reta de inclinação pouco acima de 1.
