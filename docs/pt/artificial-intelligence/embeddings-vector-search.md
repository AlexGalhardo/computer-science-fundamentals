# Embeddings e busca vetorial

> English version: [docs/en/artificial-intelligence/embeddings-vector-search.md](../../en/artificial-intelligence/embeddings-vector-search.md)

Mini-projeto MP-AI-3, em [`projects/artificial-intelligence/embeddings-vector-search`](../../../projects/artificial-intelligence/embeddings-vector-search). Ensina como o significado vira um vetor e como vetores parecidos são encontrados. A base está na seção 8 da [página da área](README.md#8-embeddings-e-similaridade), com o produto escalar e o cosseno da [seção 3](README.md#3-vetores-e-matrizes) e a etapa de recuperação da [seção 11](README.md#11-uso-de-llms).

## O problema

Um programa compara números, não significados. Para perguntar "qual texto fala da mesma coisa que esta pergunta?", cada palavra e cada texto precisam antes virar uma lista de números, um **vetor**, construído de modo que significados parecidos deem vetores parecidos. Aí aparecem mais dois problemas: como medir "parecido", e como achar o vetor mais parecido entre muitos sem olhar para todos.

O projeto faz os três passos só com contagem e aritmética. Não há rede neural e nada é treinado.

## Passo 1: uma palavra é conhecida pelas companhias que tem

A **hipótese distribucional** diz que palavras usadas nos mesmos contextos têm significados parecidos. Então, para cada palavra, conte as palavras que aparecem perto dela. Pegue um corpus de quatro frases e chame de "perto" tudo o que está na mesma frase:

```text
the dog eats     the cat eats     the car stops     the bus stops
```

A **tabela de coocorrência** tem uma linha e uma coluna por palavra. A linha "dog" diz quantas vezes cada outra palavra apareceu perto de "dog":

```text
          bus  car  cat  dog  eats  stops  the
dog        0    0    0    0    1     0      1
cat        0    0    0    0    1     0      1
car        0    0    0    0    0     1      1
the        1    1    1    1    2     2      0
```

Cada linha é o vetor da sua palavra. "dog" e "cat" têm a mesma linha, embora nunca apareçam na mesma frase: são parecidas porque têm as mesmas companhias. Essa é a ideia inteira de um embedding.

No projeto, "perto" é uma janela de 4 palavras de cada lado, dentro de uma frase, e o corpus tem 2492 frases e 760 palavras distintas, então cada vetor de palavra tem 760 números.

## Passo 2: medir a similaridade com o cosseno

O **produto escalar** de dois vetores multiplica posição por posição e soma os resultados. A **norma** é o comprimento de um vetor: a raiz quadrada do produto escalar dele com ele mesmo. A **similaridade do cosseno** é o produto escalar dividido pelas duas normas:

```text
cosseno(a, b) = dot(a, b) / (norma(a) * norma(b))
```

Ela mede o ângulo entre os vetores e ignora o comprimento: 1 significa a mesma direção, 0 significa nada em comum. Para "dog" e "car" acima:

```text
dot(dog, car)  = 1*1 (a coluna "the") + 0 em todo o resto = 1
norma(dog)     = raiz(1*1 + 1*1) = 1.414        norma(car) = 1.414
cosseno        = 1 / (1.414 * 1.414) = 0.5
```

Metade parecidas, e a única coisa que elas têm em comum é "the". Isso é um problema.

Se cada vetor for antes dividido pela própria norma, todas as normas valem 1 e o cosseno é só o produto escalar. O projeto guarda todos os vetores assim.

## Passo 3: por que contagens cruas não bastam, e a PPMI

"the" fica perto de quase toda palavra. Em uma tabela real, a coluna dela guarda o maior número de quase toda linha, então todas as linhas apontam quase para a mesma direção e toda palavra parece com qualquer outra.

A **PMI** (informação mútua pontual) faz uma pergunta melhor: quantas vezes mais essas duas palavras se encontram do que se encontrariam por acaso, dada a frequência de cada uma?

```text
pmi(w, c) = log2( contagem(w, c) * total / (soma da linha de w * soma da linha de c) )
```

Na tabela pequena o total de todas as contagens é 24, a linha de "dog" soma 2, a linha de "the" soma 8 e a linha de "eats" soma 4:

```text
pmi(dog, the)  = log2(1 * 24 / (2 * 8)) = log2(1.5) = 0.585    sem surpresa
pmi(dog, eats) = log2(1 * 24 / (2 * 4)) = log2(3)   = 1.585    típico de "dog"
```

A **PPMI** guarda os valores positivos e escreve 0 no resto (um par visto menos que o acaso, ou nunca). Com as linhas de PPMI, o cosseno de "dog" e "car" cai de 0.5 para 0.12, e o cosseno de "dog" e "cat" continua 1. Os dois números são conferidos pelos testes.

## O corpus

O corpus é gerado por `ts/src/generate-corpus.ts` com semente fixa, então nenhum texto de terceiros é usado e o arquivo pode ser reconstruído byte a byte. São 8 grupos de 10 palavras (animais, comidas, veículos, cores, clima, instrumentos, aparelhos, profissões). Cada grupo tem os seus modelos de frase e as suas palavras de contexto:

```text
the rabbit and the goat slept behind the meadow
the warm bread smelled good in the kitchen
the driver parked the bus beside the train
he mixed black and pink paint on the palette
```

Uma frase em cada dez mistura dois grupos ("a black deer stood beside the tram"), porque texto real não é arrumado. As 30 passagens escritas à mão para a demo de recuperação entram no corpus, para que as palavras delas também tenham vetor.

O código que constrói os vetores nunca vê os grupos. Recuperá-los é o teste.

## Resultado 1: os vizinhos caem no grupo esperado

Os 5 vizinhos mais próximos de uma palavra de cada grupo, entre todas as 760 palavras:

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

Nas 80 palavras de teste, 399 dos 400 vizinhos pertencem ao grupo da palavra (99,8%). A exceção ensina algo: o quinto vizinho de "rabbit" é "behind". O corpus usa "behind" só em frases sobre animais, então a linha dela parece a linha de um animal. Os vetores capturam como uma palavra é usada, o que nem sempre é o que uma pessoa chamaria de significado.

O que a PPMI muda aparece no contraste entre palavras relacionadas e sem relação:

| Peso | Cosseno médio, mesmo grupo | Cosseno médio, grupos diferentes | Diferença |
| --- | ---: | ---: | ---: |
| contagens cruas | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

Com contagens cruas, duas palavras de grupos diferentes (um cachorro e uma impressora, por exemplo) têm cosseno 0,82 em média. Neste corpus muito regular a ordem dos vizinhos ainda sai certa com contagens cruas (100,0% no grupo), mas tudo fica espremido entre 0,82 e 0,96. Com PPMI, palavras sem relação ficam perto de 0 e os grupos se separam.

## Achar o vetor mais próximo: força bruta

A **força bruta** compara a consulta com todos os vetores guardados e fica com o melhor. Sempre acerta, e custa um produto escalar por vetor guardado: n comparações para n vetores.

Em TypeScript isso é um laço. Em Python com NumPy é uma linha, `vectors @ query`: uma matriz com um vetor guardado por linha, multiplicada pela consulta, dá todas as similaridades de uma vez. É o que um banco de dados vetorial faz quando roda uma busca exata.

## Achar o vetor mais próximo: um índice de planos aleatórios

Um **índice aproximado** olha só para uma parte promissora dos dados. O que é construído aqui é o LSH de hiperplanos aleatórios (locality-sensitive hashing).

Sorteie um plano que passa pela origem. Todo vetor cai de um lado ou do outro, e o lado é o sinal do produto escalar do vetor com a direção perpendicular ao plano. O fato útil é:

```text
chance de dois vetores caírem do mesmo lado = 1 - (ângulo entre eles) / 180 graus
```

Vetores que apontam quase para a mesma direção raramente são separados. Agora sorteie vários planos e escreva os lados como bits. Cada padrão de bits é um **balde**:

```text
3 planos:   vetor a -> acima, abaixo, acima -> 101 -> balde 5
            vetor b -> acima, abaixo, acima -> 101 -> balde 5   (a e b são parecidos)
            vetor c -> abaixo, acima, abaixo -> 010 -> balde 2
```

Para buscar, calcule o balde da consulta e compare-a só com os vetores desse balde.

Há três botões de ajuste:

- **Bits** (planos por tabela). Mais bits dão mais baldes e menores: menos comparações, e uma chance maior de o vizinho verdadeiro ser separado por um dos planos.
- **Tabelas.** Uma tabela pode errar, então o índice mantém várias, cada uma com os seus planos, e junta os candidatos: menos erros, mais comparações.
- **Sondagem.** O erro mais provável é um vizinho que difere em exatamente um bit. Inverter um bit da chave por vez visita esses baldes também.

Uma conta mostra por que uma tabela não basta. Um vizinho com cosseno 0.97 está a 14 graus de distância, então um plano mantém o par junto com probabilidade 1 - 14/180 = 0.92. Doze planos mantêm o par junto com probabilidade 0.92 elevado a 12, cerca de 0.38. Com quatro tabelas independentes, a chance de pelo menos uma funcionar é 1 - (1 - 0.38) elevado a 4, cerca de 0.85.

## Resultado 2: concordância contra comparações

O que foi indexado: as 1927 frases do corpus com palavras de conteúdo distintas, cada uma transformada em um vetor de 760 números (como no passo "Recuperação" abaixo). Os 80 vetores de palavras e as 30 passagens sozinhos seriam poucos para um índice fazer diferença. As consultas são 400 frases novas, de outra semente, nenhuma delas no corpus. Para cada consulta, a força bruta dá a frase realmente mais próxima, e o índice acerta quando o seu primeiro resultado é essa mesma frase.

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

Como ler a tabela:

1. Uma tabela de 12 bits compara a consulta com cerca de 10 vetores dos 1927 e acha o vizinho verdadeiro só 37,0% das vezes. A velocidade foi paga com respostas erradas.
2. Mais tabelas sobem a concordância e o custo juntos: 37,0%, 82,8%, 94,3% para 1, 4 e 8 tabelas. Os 82,8% das quatro tabelas ficam perto do 0.85 da conta acima.
3. Menos bits (10 no lugar de 12) fazem baldes maiores: 97,3% no lugar de 94,3%, com mais vetores comparados.
4. Sondar os baldes vizinhos é o caminho mais barato para subir: 4 tabelas com sondagem chegam a 98,5% com 11,4% do trabalho da força bruta. Essa é a configuração escolhida, e o teste de MP-AI-3.2 garante que ela fica em 95% ou mais.
5. A coluna "Produtos escalares com planos" é o custo de calcular as chaves de balde da consulta (tabelas vezes bits). Faz parte do trabalho, então entra no total.

A parcela de respostas certas de um índice aproximado é o seu **recall**. Todo índice vetorial real é um ponto em uma curva como esta, e escolher o ponto é uma decisão de engenharia.

## Recuperação: a pergunta escolhe as passagens

Um texto inteiro vira um vetor somando os vetores das suas palavras e normalizando a soma:

```text
vetor(texto) = normaliza( soma, nas palavras, de idf(palavra) * vetor(palavra) )
idf(palavra) = ln( número de frases / frases que contêm a palavra )
```

O peso **idf** faz uma palavra rara valer mais que uma comum. Uma stop list curta remove as palavras funcionais ("the", "how", "why"), que um corpus tão pequeno não consegue reconhecer contando. Uma palavra fora do vocabulário não tem vetor e é ignorada.

As 30 passagens viram vetores uma vez. Uma pergunta vira vetor do mesmo jeito, é comparada com os 30 vetores de passagem por força bruta, e as 3 melhores são impressas:

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

Esta é a etapa de recuperação do **RAG** (geração aumentada por recuperação): as passagens encontradas aqui são o que seria colado no prompt de um modelo de linguagem, para que ele responda a partir delas. O projeto para na recuperação. Nenhum modelo de linguagem é chamado.

## Resultado 3: as passagens recuperadas

| Pergunta | Esperada | 1ª | 2ª | 3ª |
| --- | --- | --- | --- | --- |
| Which animal guards the farm at night? | p01 | p01 The farm dog (0.666) | p08 Night trains (0.315) | p15 The first snow (0.282) |
| How do I bake a loaf of bread? | p04 | p04 Baking bread (0.554) | p05 A pot of soup (0.217) | p10 Mixing paint (0.208) |
| Which colours do I mix to get green? | p10 | p10 Mixing paint (0.569) | p04 Baking bread (0.348) | p05 A pot of soup (0.172) |
| Why is my computer so slow? | p19 | p19 A slow laptop (0.519) | p16 Learning the piano (0.217) | p07 The morning bus (0.124) |
| What happens when thunder and rain arrive? | p13 | p13 A summer storm (0.594) | p14 Morning fog (0.281) | p15 The first snow (0.266) |
| How do musicians tune the strings of a guitar? | p18 | p18 Tuning a guitar (0.702) | p16 Learning the piano (0.314) | p17 The street band (0.197) |
| Who checks each patient in the hospital at night? | p22 | p22 The night nurse (0.558) | p03 Sheep in the hills (0.239) | p18 Tuning a guitar (0.142) |
| What do bees make from flowers? | p26 | p26 Bees and honey (0.611) | p27 Why we sleep (0.221) | p05 A pot of soup (0.121) |
| Why do leaves turn red in autumn? | p11 | p11 Autumn leaves (0.839) | p07 The morning bus (0.274) | p02 Foxes at dusk (0.225) |
| Is the wolf a danger to the flock? | p03 | p03 Sheep in the hills (0.556) | p01 The farm dog (0.209) | p20 The office printer (0.173) |
| Will drizzle or hail come tomorrow? | p13, p14 ou p15 | p13 A summer storm (0.558) | p14 Morning fog (0.382) | p15 The first snow (0.361) |
| Why does the sea rise and fall? | p25 | p17 The street band (0.346) | p25 Tides (0.272) | p04 Baking bread (0.255) |

Três coisas para ler nela:

1. As 10 perguntas de demonstração recuperam a passagem esperada em primeiro lugar, com uma distância clara para a segunda.
2. "Will drizzle or hail come tomorrow?" encontra as três passagens sobre clima, e nenhuma delas contém "drizzle" ou "hail". Uma busca por palavras exatas não devolveria nada. Aqui os vetores de "drizzle" e "hail" ficam perto dos de "rain", "snow" e "fog", que as passagens contêm. É isso que os embeddings acrescentam a uma busca.
3. "Why does the sea rise and fall?" é um erro, mantido de propósito. A passagem certa diz "rises" e "falls". Para um modelo que só conta palavras, "rise" e "rises" não têm relação, e "fall" aparece na passagem sobre a banda de rua (moedas caem em um estojo de violão). A passagem certa fica em segundo.

## O mesmo resultado em duas linguagens

TypeScript é a implementação de referência, com todo produto escalar escrito como um laço. Python está aqui porque o NumPy muda a leitura do código: a tabela de coocorrência é uma matriz, a PPMI é uma expressão sobre a matriz inteira, e uma busca é `vectors @ query`.

As duas precisam gravar as mesmas tabelas, e três detalhes tornam isso possível:

- O vocabulário é ordenado, então cada palavra tem o mesmo número de linha nas duas.
- Os planos aleatórios vêm de um pequeno gerador com semente (mulberry32) escrito à mão nas duas linguagens, usando só aritmética inteira. Os geradores embutidos das duas linguagens nunca coincidem.
- O índice guarda cada conteúdo distinto uma vez. Duas frases com as mesmas palavras de conteúdo em outra ordem têm o mesmo vetor, e um empate entre duas cópias seria decidido pelo último dígito de uma soma.

Os testes das duas linguagens comparam a sua saída com `data/expected.json`, e os dois arquivos de resultados são idênticos, fora o título e o comando que os gerou.

## O que um sistema real acrescenta

- **Embeddings aprendidos e densos.** Um modelo treinado leva uma palavra ou um texto inteiro a algumas centenas de números, nenhum deles preso a uma palavra específica. Significados parecidos caem perto mesmo quando as palavras mudam ("rise" e "rises", "car" e "automobile"), e o vetor de uma palavra pode depender da frase ao redor.
- **Tokens de subpalavra.** Com os tokens do [bpe-tokenizer](bpe-tokenizer.md) não existe palavra desconhecida: uma palavra nunca vista é cortada em pedaços conhecidos.
- **Índices melhores.** Índices de grafo (HNSW) e arquivos invertidos com quantização chegam a um recall alto com muito menos comparações que planos aleatórios, em milhões de vetores.
- **Divisão em trechos (chunking).** Documentos longos são cortados em passagens antes de virar vetores, e o tamanho dos pedaços muda o que é encontrado.
- **Busca híbrida e reordenação.** Muitos sistemas combinam a busca vetorial com a busca por palavras-chave e depois reordenam os melhores candidatos com um modelo mais lento e mais preciso.
- **A etapa de geração.** No RAG as passagens recuperadas entram no prompt de um modelo de linguagem. A resposta só pode ser tão boa quanto o que foi recuperado.

## Como rodar

```sh
cd projects/artificial-intelligence/embeddings-vector-search
./setup-unix-embeddings-vector-search.sh
docker compose run --rm ts-search "qualquer pergunta em inglês"
docker compose run --rm python-search "qualquer pergunta em inglês"
```

As palavras que o modelo conhece são as de `data/corpus.txt` e `data/passages.json`, então as perguntas precisam estar em inglês e usar esse vocabulário. O comando imprime quais palavras usou e quais ignorou.
