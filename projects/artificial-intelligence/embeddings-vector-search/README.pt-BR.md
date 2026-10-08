# embeddings-vector-search

> English version: [README.md](README.md)

Ensina **como o significado vira um vetor e como vetores parecidos são encontrados**. Os vetores de palavras são construídos contando quais palavras aparecem perto umas das outras em um corpus gerado para o projeto, sem rede neural. Os vizinhos mais próximos de uma palavra acabam sendo as palavras do seu grupo. Uma busca por força bruta é comparada com um índice de planos aleatórios (LSH), que faz muito menos comparações e às vezes erra. E uma pergunta recupera as passagens com mais chance de respondê-la, que é a etapa de busca do RAG.

Explicação completa: [docs/pt/artificial-intelligence/embeddings-vector-search.md](../../../docs/pt/artificial-intelligence/embeddings-vector-search.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `embeddings`: a hipótese distribucional, contagens de coocorrência, o peso PPMI, uma palavra como uma linha de números, similaridade do cosseno, vizinhos mais próximos, força bruta contra um índice aproximado, recall (com que frequência o índice acha o vetor realmente mais próximo).
- `artificial-intelligence` / `linear-algebra`: produto escalar, norma, normalizar um vetor para comprimento 1, similaridade do cosseno como produto escalar, uma busca como um produto matriz-vetor.
- `artificial-intelligence` / `using-llms`: a etapa de recuperação do RAG, transformar a pergunta e as passagens em vetores do mesmo jeito, as k melhores passagens pela nota, o que uma palavra desconhecida faz com a busca.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-embeddings-vector-search.sh        # Linux e macOS
./setup-windows-embeddings-vector-search.ps1    # Windows
```

O script constrói as duas imagens, roda os testes, roda as duas demos e recupera as passagens de uma pergunta.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `data/corpus.txt` | 2400 frases curtas escritas pelo gerador com semente, sobre 8 grupos de 10 palavras (animais, comidas, veículos, cores, clima, instrumentos, aparelhos, profissões) |
| `data/groups.json` | as 80 palavras de teste e os seus grupos. Só os testes e a demo leem este arquivo, nunca o código que constrói os vetores |
| `data/passages.json` | 30 passagens curtas escritas à mão para a demo de recuperação |
| `data/questions.json` | 10 perguntas de demonstração com a passagem que cada uma deve recuperar |
| `data/queries.txt` | 400 frases novas geradas, as consultas do experimento de busca |
| `data/expected.json` | os vizinhos, a tabela de comparações e as passagens recuperadas que as duas implementações precisam reproduzir |
| `ts/src/generate-corpus.ts` | o gerador de `corpus.txt`, `queries.txt` e `groups.json` |
| `ts/src/rng.ts` | o gerador aleatório com semente (mulberry32), escrito à mão |
| `ts/src/embeddings.ts` | contagens de coocorrência, PPMI, cosseno, vizinhos mais próximos |
| `ts/src/search.ts` | a força bruta e o índice de planos aleatórios |
| `ts/src/retrieval.ts` | um texto como a média ponderada dos vetores das suas palavras, e a ordenação das passagens |
| `ts/src/experiments.ts`, `ts/src/demo.ts` | os três experimentos e as tabelas de `results/results-ts.md` |
| `ts/src/cli.ts` | imprime as passagens recuperadas para uma pergunta |
| `python/*.py` | os mesmos módulos em Python com NumPy, gravando `results/results-python.md` |
| `results/` | resultados versionados das duas linguagens |

TypeScript é a implementação de referência (`oven/bun:1.4.2`, sem dependências): todo produto escalar é um laço visível. Python (`python:3.14.8-slim-trixie` com `numpy==2.5.3`) está aqui porque a lição muda: a mesma busca é **um produto matriz-vetor**, `vectors @ query`, e a verdade das 400 consultas é um produto de matrizes, `queries @ vectors.T`. Essa linha é o que um banco de dados vetorial roda em uma busca exata, e ela explica por que a força bruta continua competitiva por mais tempo do que as contagens de comparações sugerem.

Obter as mesmas tabelas em duas linguagens exige que toda escolha aleatória seja reproduzível nas duas. Os geradores aleatórios embutidos são diferentes, então `rng.ts` e `rng.py` implementam o mesmo gerador de 32 bits, e os planos usam só somas (sem `log` nem `cos`, cujo último dígito pode diferir entre linguagens).

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

O serviço de Python também roda `ruff check` e `ruff format --check`. Cada suíte tem testes com o nome dos critérios de aceite (`MP-AI-3.1`, `MP-AI-3.2`, `MP-AI-3.3`) e compara os seus vizinhos, a sua tabela de comparações e as suas passagens recuperadas com `data/expected.json`, que é como "igual nas duas linguagens" é verificado. A suíte em TypeScript também confere que o gerador ainda escreve o corpus versionado byte a byte.

## Demo

Um comando imprime as passagens recuperadas para uma pergunta:

```sh
docker compose run --rm ts-search "Which animal guards the farm at night?"
docker compose run --rm python-search "Which animal guards the farm at night?"
```

```text
question: "Which animal guards the farm at night?"
words used: guards farm night
not in the vocabulary: animal
compared with 30 passages by brute force

1. score 0.666  p01  The farm dog
   A farm dog sleeps lightly beside the barn. At night it guards the yard and barks when a fox comes near the hens. In the morning the farmer rewards it with a bone.
2. score 0.315  p08  Night trains
   A night train crosses the country while its passengers sleep in narrow beds. It stops at small stations in the dark, and the engine is changed at the border before sunrise.
3. score 0.282  p15  The first snow
   The first snow of winter usually falls at night and melts by noon. Real cold comes later, when frost hardens the ground and the snow stays on the hills for weeks.
```

Uma pergunta que não compartilha nenhuma palavra de conteúdo com as passagens que encontra só funciona pelos vetores de palavras ("drizzle" e "hail" ficam perto de "rain" e "snow"):

```text
question: "Will drizzle or hail come tomorrow?"
words used: drizzle hail
not in the vocabulary: come tomorrow
compared with 30 passages by brute force

1. score 0.558  p13  A summer storm
2. score 0.382  p14  Morning fog
3. score 0.361  p15  The first snow
```

As três tabelas vêm das demos:

```sh
docker compose run --rm ts-demo        # grava results/results-ts.md
docker compose run --rm python-demo    # grava results/results-python.md
```

**Vetores de palavras (MP-AI-3.1).** Os 5 vizinhos mais próximos de uma palavra de cada grupo, pela similaridade do cosseno:

| Palavra | Grupo | 5 vizinhos mais próximos (similaridade do cosseno) |
| --- | --- | --- |
| dog | animals | wolf 0.689, cat 0.674, cow 0.669, rabbit 0.640, deer 0.631 |
| bread | foods | stew 0.657, cake 0.611, rice 0.611, pasta 0.599, soup 0.577 |
| car | vehicles | ship 0.715, tram 0.667, van 0.653, truck 0.643, plane 0.624 |
| red | colours | purple 0.729, yellow 0.724, blue 0.716, black 0.707, pink 0.703 |
| rain | weather | thunder 0.793, sunshine 0.779, drizzle 0.749, hail 0.745, fog 0.650 |
| piano | instruments | harp 0.596, flute 0.561, organ 0.542, cello 0.532, trumpet 0.506 |
| laptop | devices | monitor 0.565, keyboard 0.550, server 0.549, tablet 0.531, phone 0.529 |
| doctor | professions | plumber 0.708, nurse 0.646, lawyer 0.643, engineer 0.625, teacher 0.619 |

Nas 80 palavras de teste, 99,8% dos 5 vizinhos mais próximos pertencem ao grupo da palavra (399 de 400, e 79 palavras têm os 5 no seu grupo). O único intruso é "behind" como quinto vizinho de "rabbit": o corpus usa "behind" só em frases sobre animais. O vocabulário tem 760 palavras, e os vizinhos são procurados entre todas elas, não só entre as palavras de teste.

| Peso | Cosseno médio, mesmo grupo | Cosseno médio, grupos diferentes | Diferença |
| --- | ---: | ---: | ---: |
| contagens cruas | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

Com contagens cruas, duas palavras de grupos diferentes ainda têm cosseno 0,82, porque toda linha é dominada pelas mesmas colunas frequentes ("the", "a", "and"). A PPMI derruba as palavras sem relação para 0,03.

**Força bruta contra o índice (MP-AI-3.2).** Indexado: as 1927 frases do corpus com palavras de conteúdo distintas, um vetor de 760 números cada. Consultas: as 400 frases de `data/queries.txt`, nenhuma delas no corpus.

| Busca | Tabelas | Bits | Sondagem | Mesmo primeiro resultado da força bruta | Vetores comparados (média) | Produtos escalares com planos | Total | Parte da força bruta |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| força bruta | - | - | - | 100.0% | 1927 | 0 | 1927 | 100.0% |
| índice | 1 | 12 | não | 37.0% | 9.8 | 12 | 21.8 | 1.1% |
| índice | 4 | 12 | não | 82.8% | 51.5 | 48 | 99.5 | 5.2% |
| índice | 8 | 12 | não | 94.3% | 84.4 | 96 | 180.4 | 9.4% |
| índice | 8 | 10 | não | 97.3% | 117.1 | 80 | 197.1 | 10.2% |
| índice | 2 | 10 | 1 bit | 94.3% | 113.1 | 20 | 133.1 | 6.9% |
| **índice (escolhido)** | 4 | 12 | 1 bit | 98.5% | 172.5 | 48 | 220.5 | 11.4% |
| índice | 8 | 12 | 1 bit | 100.0% | 250.1 | 96 | 346.1 | 18.0% |

A configuração escolhida devolve o mesmo primeiro resultado da força bruta em 98,5% das consultas com 11,4% dos produtos escalares. A configuração mais rápida faz 1,1% do trabalho e acerta só 37,0% das vezes. "Produtos escalares com planos" é o custo de calcular as chaves de balde da consulta, que uma contagem honesta precisa incluir.

**Recuperação (MP-AI-3.3).** As 10 perguntas de demonstração de `data/questions.json` recuperam a passagem esperada em primeiro lugar. A tabela completa, com as três passagens e as notas de cada pergunta, está em [`results/results-ts.md`](results/results-ts.md).

Não há dashboard: as tabelas em [`results/`](results/) são o resultado. As duas linguagens gravaram as mesmas tabelas.

## Limites

- O corpus é gerado a partir de modelos de frase, então os seus grupos são muito mais limpos do que em texto real. É por isso que 99,8% dos vizinhos estão certos, e que até as contagens cruas ordenam bem os vizinhos aqui (100,0%). O que as contagens cruas perdem é o contraste entre palavras relacionadas e sem relação, mostrado na segunda tabela.
- O vetor de um texto é uma média, então a ordem das palavras se perde: "the dog chased the cat" e "the cat chased the dog" recebem o mesmo vetor.
- Uma palavra fora do vocabulário é ignorada, e também toda forma que o corpus nunca mostrou. A pergunta "Why does the sea rise and fall?" recupera "The street band" em primeiro e a passagem certa, "Tides", em segundo: a passagem diz "rises" e "falls", que são palavras diferentes para um modelo sem noção de formas de palavra, enquanto "fall" aparece na passagem errada.
- Os pesos idf são contados em 2492 frases, poucas para reconhecer palavras funcionais, então uma stop list de 90 palavras é usada quando um texto vira vetor.
- Cada vetor de palavra tem 760 números, um por palavra do vocabulário, e a maioria é zero. Embeddings reais são densos e curtos (centenas de números), produzidos por um modelo treinado.
- 1927 vetores é pouco. Neste tamanho a força bruta é rápida o bastante e nenhum índice é necessário. O índice é mostrado porque o custo da força bruta cresce com o número de vetores, e com milhões de vetores isso importa. Sistemas reais usam índices melhores que planos aleatórios (grafos HNSW, arquivos invertidos com quantização).
- A concordância e as contagens de comparações dependem da semente dos planos. A semente versionada é 42. Cinco outras sementes, testadas à mão e fora da suíte de testes, deram de 99,0% a 99,8% de concordância para a configuração escolhida, com 132 a 167 vetores comparados em média.
