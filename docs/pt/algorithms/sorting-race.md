# Corrida de ordenação

> English version: [docs/en/algorithms/sorting-race.md](../../en/algorithms/sorting-race.md) · Versión en español: [docs/es/algorithms/sorting-race.md](../../es/algorithms/sorting-race.md)

Mini-projeto: [`projects/algorithms/sorting-race`](../../../projects/algorithms/sorting-race/README.pt-BR.md) (MP-ALG-1). Linguagens: TypeScript (referência), C++, Python, Java, Elixir, Rust e Go. Quiz: área `algorithms`, tópicos `elementary-sorts`, `merge-sort`, `quicksort`, `heapsort`, `linear-time-sorts` e `sorting-properties`.

## A pergunta

Um programa é lento por causa da linguagem ou por causa do algoritmo? A corrida responde fixando uma coisa de cada vez: seis algoritmos, sete linguagens, os mesmos arquivos de entrada.

## Os seis algoritmos

| Algoritmo | Ideia | Melhor | Pior | Memória extra | Estável |
| --- | --- | --- | --- | --- | --- |
| Bubble | troca vizinhos fora de ordem, para após uma passada sem trocas | `O(n)` | `O(n²)` | `O(1)` | sim |
| Insertion | insere cada valor no prefixo ordenado | `O(n)` | `O(n²)` | `O(1)` | sim |
| Merge | divide ao meio, ordena as metades, intercala | `O(n log n)` | `O(n log n)` | `O(n)` | sim |
| Quick | particiona em torno da mediana de três, ordena cada lado | `O(n log n)` | `O(n²)` | pilha `O(log n)` | não |
| Heap | monta um max-heap no vetor, move o máximo para o fim | `O(n log n)` | `O(n log n)` | `O(1)` | não |
| Radix (LSD, base 256) | quatro passadas estáveis de contagem, uma por byte | `O(n)` | `O(n)` | `O(n)` | sim |

Toda implementação é uma função pura escrita do zero, sem chamar ordenação de biblioteca. O radix sort foi escrito para inteiros de 0 a 2^31 - 1, então os arquivos de entrada ficam nessa faixa.

## Como a corrida é mantida justa

- **Mesma entrada.** Um gerador com semente fixa escreve um inteiro por linha. Toda linguagem lê o mesmo arquivo.
- **Mesma resposta.** Todo programa imprime um checksum da saída, `h = (h · 31 + v) mod 1.000.000.007`, que depende da ordem. O verificador falha se duas linhas do mesmo arquivo discordarem.
- **Mesmos casos de teste.** Vazio, um elemento, ordenado, invertido, com duplicatas e aleatório, nos testes das sete linguagens.
- **Só a ordenação é cronometrada.** A coluna `section` exclui a subida do runtime e a leitura do arquivo. A coluna `process` inclui as duas.

## O que observar nos resultados

1. **Algoritmo contra linguagem.** Com 10.000 valores, o merge sort em Python levou 32,7 ms e o bubble sort em C++ levou 69,0 ms. A linguagem mais lenta com um bom algoritmo venceu a mais rápida com um algoritmo ruim.
2. **O teste de dobrar.** De 100.000 para 200.000 valores, o merge sort levou entre 1,76 e 2,45 vezes mais tempo em seis linguagens. `n log n` prevê cerca de 2,1 e um algoritmo quadrático daria 4.
3. **A exceção do Elixir.** O Elixir mediu 3,51 na execução versionada e de 2,1 a 2,6 em uma execução calma. As listas dele são imutáveis, então ordenar aloca células novas o tempo todo e o coletor de lixo copia as que estão vivas. O algoritmo continua `n log n`, mas o runtime acrescenta um custo que cresce mais rápido.
4. **Onde a lição muda.** Em Elixir não existe troca nem índice. O heapsort vira um heap esquerdista, uma árvore cuja única operação é "juntar dois heaps", e o quicksort monta três listas novas por partição.
5. **Formato da entrada.** O `results/shapes.md` compara entrada aleatória, ordenada e invertida em TypeScript: bubble e insertion sort caem de centenas de milissegundos para uma fração de milissegundo em entrada ordenada, enquanto heap e radix sort não reagem.

Os números vêm de uma máquina que estava rodando outras cargas. Leia a dispersão, e confie mais em razões do que em tempos absolutos.

## Como reproduzir

```sh
bun run bench -- --project projects/algorithms/sorting-race
```

Resultados: [`results/results.md`](../../../projects/algorithms/sorting-race/results/results.md). Dashboard: abra `projects/algorithms/sorting-race/dashboard/index.html` direto do disco. Os limites do benchmark estão listados no README do mini-projeto.

## Para experimentar

- Acrescente o selection sort e conte as trocas dele contra o bubble sort.
- Troque a mediana de três do quicksort pelo primeiro elemento e rode o formato ordenado.
- Acrescente 1.000.000 em `sizes` no `bench.json` e veja quais linguagens ainda terminam em um segundo.
