# tiny-language-model

> English version: [README.md](README.md)

Ensina **como um modelo de linguagem prevê o próximo token, da contagem à autoatenção**. Dois modelos aprendem o mesmo texto pequeno, caractere por caractere. O primeiro é uma tabela de bigramas feita por contagem. O segundo é um transformer só-decodificador cuja passagem direta e cuja retropropagação são escritas à mão com NumPy, sem framework de aprendizado profundo. Em texto que nenhum dos dois treinou, o transformer tem perda de 0,662 contra 1,741 do bigrama, e a demo mostra o motivo: ele usa pistas que estão vários caracteres atrás. O mesmo modelo treinado é depois amostrado com decodificação gulosa, temperatura, top-k e top-p, e uma tabela mede como cada configuração muda a entropia e a variedade do que ele escreve.

Explicação completa: [docs/pt/artificial-intelligence/tiny-language-model.md](../../../docs/pt/artificial-intelligence/tiny-language-model.md).

## Tópicos do quiz que ele demonstra

- `artificial-intelligence` / `language-models`: previsão do próximo token, o modelo de bigramas feito por contagem, entropia cruzada e perplexidade em texto reservado, o laço de geração, amostragem com decodificação gulosa, temperatura, top-k e top-p.
- `artificial-intelligence` / `attention-transformer`: query, key e value, pesos do softmax, a máscara causal, embeddings de posição, atenção com várias cabeças, a estrutura de um bloco (atenção, MLP, conexões residuais, normalização de camada).
- `artificial-intelligence` / `probability-statistics`: uma linha de contagens transformada em distribuição de probabilidade, softmax, entropia cruzada, entropia em bits, sorteio de uma amostra com gerador de semente fixa.
- `artificial-intelligence` / `training`: retropropagação pela regra da cadeia, a checagem de gradiente com diferenças centradas, o otimizador Adam, mini-lotes, perda de treino contra perda em texto reservado.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-tiny-language-model.sh        # Linux e macOS
./setup-windows-tiny-language-model.ps1    # Windows
```

O script constrói a imagem, roda os testes e depois roda a demo, que treina os dois modelos e regrava `results/`. Nada é baixado na execução e os containers não têm rede.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `python/corpus.py` | o gerador do texto com semente fixa, a divisão em linhas de treino e linhas reservadas, o vocabulário de caracteres, e `line_kind`, que diz se uma linha obedece à gramática |
| `python/bigram.py` | o modelo de bigramas: contagens, suavização "soma um", perda, perplexidade, amostragem |
| `python/transformer.py` | o transformer: passagem direta, passagem reversa à mão, entropia cruzada, Adam, o laço de treino |
| `python/sampling.py` | temperatura, top-k, top-p, guloso, entropia, e o laço de geração |
| `python/experiment.py` | o único experimento compartilhado por testes e demo: sementes, tamanhos, as sondas, a tabela de amostragem, o exemplo de atenção |
| `python/svg.py` | a curva de perda e o mapa de calor da atenção, escritos como texto SVG |
| `python/demo.py` | imprime as tabelas e grava `results/` |
| `python/test_*.py`, `python/conftest.py` | os testes. O modelo é treinado uma vez por execução dos testes |
| `results/` | saída da demo, versionada: `results.md`, `loss-curve.svg`, `attention.svg` |

Só Python (`python:3.14.8-slim-trixie`), com uma dependência, `numpy==2.5.3`. Sem PyTorch e sem TensorFlow: escrever a atenção e o gradiente dela à mão é a lição. Nada é importado de outro mini-projeto. Os tokens são caracteres isolados: cortar o texto em tokens maiores é assunto do [bpe-tokenizer](../bpe-tokenizer/).

Decisões que vale conhecer:

- **O texto é gerado** por uma gramática pequena com quatro tipos de linha, cada um escondendo uma pista vários caracteres atrás: `ana has a cat. she likes it.` (o pronome depende do nome), `the red cats see a dog.` (o verbo concorda com o sujeito), `tom says 4+5=9.` (o dígito depende dos dois números) e `([x]y){z}` (o fechamento precisa casar). Sem pistas assim um transformer não teria como ganhar de um bigrama.
- **Linhas reservadas nunca são linhas de treino.** O gerador só guarda uma linha na primeira vez em que a sorteia, então as 2400 linhas são todas diferentes. Elas são embaralhadas e as últimas 240 ficam reservadas. Um teste confere que os dois conjuntos não se cruzam.
- Blocos **pre-norm** (normalização de camada antes da atenção e antes do MLP), ReLU no MLP, embeddings de posição aprendidos, sem dropout.
- **Tamanhos**: contexto de 32 caracteres, d_model 48, 4 cabeças, 2 blocos, 62 253 parâmetros, float32. Adam por 1000 passos com lotes de 32 janelas.
- **Uma thread de BLAS** (`OPENBLAS_NUM_THREADS=1` no Dockerfile): as matrizes são minúsculas, mais threads só atrapalham, e o resultado sai igual em toda execução.

## Testes

```sh
docker compose run --rm python-test
```

Roda `ruff check`, `ruff format --check` e 53 testes, em cerca de meio minuto. O modelo é treinado uma vez, pela mesma função e semente da demo. Cada critério de aceite tem os seus testes:

| Critério | Teste | O que mede |
| --- | --- | --- |
| MP-AI-4.1 | `test_every_row_is_a_probability_distribution`, `test_sampling_is_reproducible_with_a_fixed_seed` | toda linha da tabela de bigramas soma 1, e a mesma semente escreve o mesmo texto |
| MP-AI-4.2 | `test_the_transformer_beats_the_bigram_on_heldout_text`, `test_no_heldout_line_is_a_training_line` | perda em texto reservado de 0,662 contra 1,741, exigida pelo menos 0,5 nat menor |
| MP-AI-4.2 | `test_backpropagation_matches_the_numerical_gradient` | o gradiente escrito à mão de cada grupo de parâmetros bate com diferenças centradas em float64 (erro relativo abaixo de 1e-6) |
| MP-AI-4.3 | `test_lower_temperature_gives_less_varied_output`, `test_top_k_and_top_p_lower_the_entropy_of_plain_sampling` | a entropia das amostras cai com a temperatura, e top-k e top-p a reduzem |
| MP-AI-4.4 | `test_the_demo_writes_the_results` | a demo grava a tabela e as duas figuras |

Outros testes cobrem a máscara causal (mudar o último token não muda nenhuma previsão anterior, e o triângulo superior dos pesos de atenção é exatamente zero), os embeddings de posição, o Adam, o verificador da gramática e os exemplos resolvidos da documentação.

## Demo

```sh
docker compose run --rm python-demo    # grava results/results.md e duas figuras SVG
```

A saída abaixo foi copiada de [`results/results.md`](results/results.md) (o arquivo é gerado em inglês).

**Perda em texto reservado**, entropia cruzada em nats, quanto menor melhor:

| Modelo | Contexto que enxerga | Perda no treino | Perda no texto reservado | Perplexidade no texto reservado |
| --- | --- | ---: | ---: | ---: |
| Chute uniforme, ln(45) | nada |  | 3,807 | 45,00 |
| Bigrama (contagem) | 1 caractere | 1,730 | 1,741 | 5,70 |
| Transformer | até 32 caracteres | 0,640 | 0,662 | 1,94 |

![Curva de perda](results/loss-curve.svg)

**O que o contexto compra.** A probabilidade que cada modelo dá ao caractere que a gramática exige em seguida (`_` é um espaço):

| Contexto | Próximo certo | Próximo errado | Bigrama: P(certo) | Bigrama: P(errado) | Transformer: P(certo) | Transformer: P(errado) |
| --- | :---: | :---: | ---: | ---: | ---: | ---: |
| `ana_has_a_cat._` | `s` | `h` | 0,141 | 0,077 | 0,982 | 0,011 |
| `leo_has_a_cat._` | `h` | `s` | 0,077 | 0,141 | 0,980 | 0,014 |
| `the_old_dogs_see` | `_` | `s` | 0,395 | 0,099 | 0,999 | 0,000 |
| `the_old_dog_see` | `s` | `_` | 0,099 | 0,395 | 0,998 | 0,001 |
| `tom_says_4+5=` | `9` | `1` | 0,091 | 0,417 | 0,433 | 0,410 |
| `tom_says_7+8=1` | `5` | `.` | 0,051 | 0,110 | 0,350 | 0,000 |
| `{[x]` | `}` | `]` | 0,065 | 0,100 | 0,210 | 0,005 |
| `[{x}` | `]` | `}` | 0,113 | 0,099 | 0,327 | 0,009 |

O bigrama dá os mesmos números para "ana" e para "leo": ele só enxerga o espaço. O transformer tem quase certeza do pronome e da concordância, e quase nunca fecha um colchete com o tipo errado (depois de `{[x]` ele também pode continuar com uma letra ou abrir outro colchete, então 0,210 para `}` não é erro). As somas são a regra que ele aprendeu só pela metade.

**Controles de amostragem**, 100 linhas por configuração, mesma semente:

| Configuração | Entropia média (bits) | Linhas distintas em 100 | Linhas gramaticais em 100 | Primeira linha escrita |
| --- | ---: | ---: | ---: | --- |
| guloso | 0,000 | 1 | 100 | `the new cat sees a cup.` |
| temperatura 0,2 | 0,304 | 66 | 100 | `the old cups see a cup.` |
| temperatura 0,5 | 0,520 | 97 | 95 | `the old bags see a cat.` |
| temperatura 1,0 | 0,856 | 99 | 73 | `ana says 5+8=14.` |
| temperatura 1,5 | 1,464 | 100 | 38 | `[9=1ups find a k map.` |
| temperatura 1,0, top-k 3 | 0,380 | 86 | 85 | `leo says 4+9=14.` |
| temperatura 1,0, top-p 0,9 | 0,751 | 99 | 87 | `[[x[y]{zx}x]}x` |
| temperatura 1,5, top-k 3 | 0,464 | 92 | 72 | `leo says 4+9=14.` |
| temperatura 1,5, top-p 0,9 | 1,039 | 99 | 67 | `[[x(y){z(yzyy)}]` |

A entropia média é a entropia da distribuição da qual cada caractere foi realmente sorteado. Temperatura menor, entropia menor, menos linhas diferentes, e mais delas corretas. O guloso escreve a mesma linha 100 vezes. Para comparar, a tabela de bigramas escreve linhas como `likeog w cu2+8=6it.`, e nenhuma das suas 100 linhas é gramatical.

**Atenção.** Uma cabeça na linha reservada `the sad cups see a hat.`. O triângulo cinza é a máscara causal. Na linha contornada o modelo está na última letra de "see" e precisa decidir se vem um "s". Esta cabeça põe 0,98 do peso no "s" de "cups", quatro caracteres atrás:

![Mapa de atenção](results/attention.svg)

Não há dashboard: as tabelas e as duas figuras em [`results/`](results/) são o resultado.

## Limites

- O corpus é sintético e minúsculo (47 kB, 45 caracteres), feito para que o contexto importe. Os números não dizem nada sobre linguagem real.
- As somas ficam aprendidas só pela metade em 1000 passos: depois de `4+5=` o modelo dá 0,433 para `9`, e 27 das 100 linhas escritas com temperatura 1,0 quebram uma regra. Treinar mais ajuda, mas a execução dos testes deixaria de caber no tempo previsto.
- As linhas reservadas são combinações novas de palavras que o modelo viu no treino, não palavras novas.
- As perdas vêm de um treino em float32. Na mesma máquina, rodar de novo dá o mesmo arquivo. Em outro processador as últimas casas decimais podem mudar, e por isso os testes usam margens e não valores exatos.
- O texto reservado é avaliado em janelas consecutivas de 32 caracteres, então os primeiros caracteres de cada janela são previstos com pouco contexto. Isso faz o transformer parecer um pouco pior do que é.
- Sem cache de chaves e valores: a geração roda a janela inteira de novo a cada caractere. Sem dropout, sem decaimento de pesos, sem aquecimento da taxa de aprendizado, sem compartilhamento de pesos entre a entrada e a saída.
- O brief pedia uma fixture de treino com escopo de módulo. Aqui ela tem escopo de sessão, então o modelo é treinado uma vez para todos os arquivos de teste, e não uma vez por arquivo.
