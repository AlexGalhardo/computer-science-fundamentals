# Brinquedo de difusão

> English version: [docs/en/artificial-intelligence/diffusion-toy.md](../../en/artificial-intelligence/diffusion-toy.md) · Versión en español: [docs/es/artificial-intelligence/diffusion-toy.md](../../es/artificial-intelligence/diffusion-toy.md)

Mini-projeto MP-AI-5, em [`projects/artificial-intelligence/diffusion-toy`](../../../projects/artificial-intelligence/diffusion-toy). Ensina como um modelo de imagens aprende a remover ruído, com pontos de duas dimensões no lugar de pixels. A base está na seção 12 da [página da área](README.md#12-geração-de-imagens), com a distribuição gaussiana da [seção 2](README.md#2-probabilidade-e-estatística) e a retropropagação da [seção 6](README.md#6-descida-do-gradiente-e-retropropagação).

## O problema

Desenhar uma imagem plausível de uma vez só é difícil. Tirar um pouco de ruído de uma imagem quase limpa é fácil. Um modelo de difusão troca o problema difícil pelo fácil, repetido muitas vezes: ele aprende a tirar um pouco de ruído, e depois é aplicado de novo e de novo, partindo de nada além de ruído.

Uma imagem de 64 x 64 pixels são 12.288 números, e ninguém consegue olhar para um espaço de 12.288 dimensões. Então aqui uma "imagem" tem 2 números: é um ponto (x, y), e as "figuras que vale a pena gerar" são os pontos de um anel de raio 1. Todo o resto é o método de verdade, seguindo o artigo "Denoising Diffusion Probabilistic Models" (Ho, Jain e Abbeel, 2020), e como o dado é 2D cada passo pode ser desenhado.

```text
direto (fixo, nada a aprender):   anel  ->  anel borrado  ->  ...  ->  ruído
reverso (uma rede treinada):      ruído ->  ...  ->  anel borrado  ->  anel
```

## Os dados

4000 pontos sobre um anel: um ângulo aleatório, e um raio de 1 mais uma pequena variação (desvio padrão 0,03), porque dado real nunca é perfeitamente limpo. O anel foi escolhido porque a distância de qualquer ponto p até ele é exata:

```text
distância = | comprimento de p - 1 |
p = (0,6; 0,9):   comprimento = sqrt(0,36 + 0,81) = 1,082    distância = 0,082
```

A média dessa distância em uma nuvem de pontos diz quão bem a nuvem está sobre o anel. É o número que o teste de aceite usa.

## Processo direto: somar ruído passo a passo

Cada passo encolhe um pouco o ponto e soma um pouco de ruído gaussiano:

```text
x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) ruído          ruído ~ normal(0, 1), um sorteio novo a cada passo
```

`beta_t` é a variância do ruído do passo t. O encolhimento é o que impede a nuvem de crescer para sempre. Se a variância era 1 antes do passo, depois dele é (1 - beta) x 1 + beta x 1 = 1. Assim o processo é puxado para um destino fixo, uma distribuição normal de média 0 e variância 1, qualquer que seja a forma inicial.

A lista de betas é a **agenda de ruído** (noise schedule). Aqui são 100 passos e beta cresce em linha reta de 0,001 a 0,2.

Mais dois nomes:

- `alpha_t = 1 - beta_t`: a parte do ponto anterior que sobrevive ao passo t.
- `alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t`: a parte do ponto **original** que sobrevive a t passos.

| Passo t | beta_t | alpha_bar_t | sinal = sqrt(alpha_bar_t) | ruído = sqrt(1 - alpha_bar_t) |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0,0000 | 1,000000 | 1,0000 | 0,0000 |
| 10 | 0,0191 | 0,903813 | 0,9507 | 0,3101 |
| 25 | 0,0492 | 0,527916 | 0,7266 | 0,6871 |
| 50 | 0,0995 | 0,074197 | 0,2724 | 0,9622 |
| 75 | 0,1497 | 0,002578 | 0,0508 | 0,9987 |
| 100 | 0,2000 | 0,000020 | 0,0045 | 1,0000 |

### O atalho

Uma soma de ruídos gaussianos é de novo ruído gaussiano. Então os t ruídos pequenos de t passos podem ser trocados por um ruído maior, e qualquer passo é alcançado em um salto a partir do ponto limpo:

```text
x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) ruído

x_0 = (1; 0), t = 25, ruído = (0,5; -1,0):
x_25 = 0,7266 x (1; 0) + 0,6871 x (0,5; -1,0) = (1,0702; -0,6871)
```

O treino depende desse atalho: cada exemplo custa uma multiplicação em vez de até 100 passos. Um teste faz 20000 pontos andarem passo a passo, envia outros 20000 pelo atalho, e confere que as duas nuvens têm as mesmas estatísticas nos passos 10, 25, 50 e 100.

![processo direto](../../../projects/artificial-intelligence/diffusion-toy/results/forward.svg)

| Passo t | Distância média até o anel | Raio médio | Dispersão do raio | Variância de x | Variância de y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 0,024 | 1,000 | 0,030 | 0,496 | 0,504 |
| 10 | 0,240 | 1,005 | 0,301 | 0,544 | 0,556 |
| 25 | 0,433 | 1,088 | 0,537 | 0,736 | 0,735 |
| 50 | 0,525 | 1,222 | 0,640 | 0,957 | 0,947 |
| 75 | 0,539 | 1,254 | 0,651 | 1,016 | 0,981 |
| 100 | 0,546 | 1,261 | 0,658 | 1,002 | 1,020 |

A variância de cada coordenada vai de 0,5 (um anel de raio 1) a 1 (o ruído), exatamente como o atalho diz: no passo 25, 0,528 x 0,5 + 0,472 x 1 = 0,736.

### Por que 100 passos aqui e 1000 no artigo

O processo reverso, abaixo, supõe que desfazer um passo é de novo um pequeno movimento gaussiano. Isso só é uma boa aproximação quando cada passo direto soma muito pouco ruído. O artigo usa 1000 passos com beta de 0,0001 a 0,02, porque imagens são complicadas e pedem esse cuidado. Aqui há 10 vezes menos passos e cada beta é 10 vezes maior, então a quantidade total de ruído é quase a mesma e o fim continua sendo ruído puro. Cada passo é mais grosseiro. Para um anel isso custa um pouco de nitidez. Para uma fotografia não seria aceitável.

### O último passo é mesmo ruído?

O critério de aceite diz que depois do último passo os pontos são estatisticamente indistinguíveis de ruído gaussiano. O teste pega 20000 pontos do anel, soma ruído pelos 100 passos um a um, e compara o resultado com uma normal padrão de sete maneiras:

| Verificação | Esperado para ruído gaussiano padrão | Medido (x, y) | Tolerância |
| --- | ---: | ---: | ---: |
| Média | 0 | -0,0033; -0,0110 | 0,0283 |
| Variância | 1 | 1,0021; 1,0202 | 0,0400 |
| Correlação entre x e y | 0 | -0,0031 | 0,0283 |
| Correlação com o ponto de partida | 0 | -0,0006; -0,0069 | 0,0283 |
| Parcela a até 1 desvio padrão | 0,6827 | 0,6804; 0,6792 | 0,0132 |
| Parcela a até 2 desvios padrão | 0,9545 | 0,9537; 0,9520 | 0,0059 |
| Estatística de Kolmogorov-Smirnov | 0 | 0,0038; 0,0113 | 0,0138 |

As tolerâncias valem cerca de 4 erros padrão para 20000 pontos. Uma medida feita em uma amostra nunca é exatamente o valor verdadeiro, e o seu erro típico diminui com 1 / sqrt(n): para a média de 20000 valores de variância 1 ele é 1 / sqrt(20000) = 0,0071, e 4 vezes isso dá 0,0283.

A **estatística de Kolmogorov-Smirnov** compara a forma inteira, não só dois números. Ordene os valores. Depois do i-ésimo de n valores a amostra diz "uma parcela i / n de mim está abaixo deste valor", e a distribuição normal tem a sua própria resposta para o mesmo valor, calculada com `math.erf`. A estatística é a maior diferença entre as duas respostas. Para uma amostra que é mesmo normal ela fica abaixo de 1,95 / sqrt(n) = 0,0138 em 999 de 1000 casos.

O mesmo teste também prova que as verificações não são cegas. O anel limpo falha na verificação de Kolmogorov-Smirnov, o passo 25 falha na de variância e ainda está correlacionado com o ponto de partida, e 20000 valores sorteados direto de uma normal passam em tudo.

**O que "indistinguível" quer dizer, com honestidade.** Quer dizer "estas verificações não conseguem separar os dois com 20000 pontos". Não quer dizer que não sobrou nada. O ponto original continua dentro de x_100, multiplicado por sqrt(alpha_bar_100) = 0,0045. Isso apareceria como uma correlação de cerca de 0,003 com o ponto de partida, e 20000 pontos só enxergam correlações acima de cerca de 0,03. Uma amostra da ordem de um milhão de pontos enxergaria. A agenda é montada para essa sobra ser desprezível, não zero.

## A rede e o objetivo do treino

A rede recebe um ponto com ruído e o número do passo, e responde com dois números: o seu palpite do ruído que está dentro daquele ponto.

```text
entrada (18 números): x_t (2)  +  codificação do passo t (16)
camadas:              18 -> 64 -> 64 -> 64 -> 2      tanh depois de cada camada escondida
parâmetros:           9666
```

**Por que o passo é uma entrada.** No passo 5 o ponto está quase limpo e o ruído é uma correção pequena. No passo 95 o ponto é quase ruído puro. A rede precisa saber em qual caso está. Um número cru seria uma entrada ruim, então o passo é descrito por 8 senos e 8 cossenos de velocidades diferentes: as ondas lentas dizem "cedo ou tarde" e as rápidas separam passos vizinhos. É a mesma ideia da codificação de posição de um transformer.

O **treino** repete cinco linhas, 6000 vezes, em lotes de 256 pontos:

```text
1. pegue pontos limpos x_0 dos dados
2. sorteie um passo t para cada um, de 1 a 100
3. sorteie o ruído e salte para x_t com o atalho
4. pergunte à rede qual foi o ruído, dados x_t e t
5. perda = média de (ruído verdadeiro - palpite)^2, e mova os pesos para ela diminuir
```

Os rótulos (o ruído) foram feitos por nós. Então isto é aprendizado supervisionado comum com erro quadrático médio, como na seção 4 da página da área.

![perda do treino](../../../projects/artificial-intelligence/diffusion-toy/results/loss.svg)

| Iterações | Perda |
| ---: | ---: |
| 1 a 200 | 0,2465 |
| 801 a 1000 | 0,1877 |
| 2801 a 3000 | 0,1731 |
| 5801 a 6000 | 0,1702 |

Uma rede que sempre responde "ruído nenhum" (zeros) teria perda 1, a variância do ruído. A perda se acomoda perto de 0,17 e não pode chegar a 0: o mesmo ponto com ruído pode vir de muitos pares diferentes de ponto limpo e ruído, então a melhor resposta possível é uma média deles, e a média nunca é exatamente o ruído que foi sorteado.

### Sem framework: retropropagação e Adam à mão

A única biblioteca é o NumPy, para vetores e produtos de matrizes. Para uma camada `out = in @ W + b`, com `g` querendo dizer "quanto a perda muda quando `out` muda":

```text
dPerda/dW = in.T @ g          dPerda/db = soma de g no lote          g para a camada anterior = g @ W.T
atravessar uma tanh multiplica g por (1 - tanh^2)
```

**Verificação do gradiente.** Uma derivada escrita à mão é fácil de errar, então um teste a compara com uma inclinação medida sem cálculo nenhum: mexa um peso em +h e em -h, e calcule (perda_mais - perda_menos) / 2h. Com h = 0,000001 e números de 64 bits as duas coincidem para cada um dos 195 pesos de uma rede pequena, com erro relativo abaixo de 0,00001.

O **Adam** substitui o tamanho de passo único da descida de gradiente simples. Para cada peso ele guarda uma média móvel do gradiente (a direção) e do gradiente ao quadrado (o tamanho típico), e divide a primeira pela raiz quadrada da segunda. Cada peso então anda cerca de uma taxa de aprendizado por passo, qualquer que seja a escala do seu gradiente. A taxa de aprendizado começa em 0,003 e cai suavemente até 0.

## Processo reverso: gerar

A geração parte de 2000 pontos de ruído gaussiano puro e aplica este passo 100 vezes, de t = 100 até t = 1:

```text
x_(t-1) = ( x_t - (1 - alpha_t) / sqrt(1 - alpha_bar_t) x palpite ) / sqrt(alpha_t)  +  sigma_t z
```

- `palpite` é o ruído que a rede enxerga em x_t. Só a parte que pertence a este passo é retirada.
- Dividir por `sqrt(alpha_t)` desfaz o encolhimento do passo direto.
- `sigma_t z` soma de volta um pouco de ruído novo, com `sigma_t = sqrt(beta_t)` (uma das duas escolhas do artigo). A rede dá uma resposta média, e sem esse ruído os pontos escorregariam para uma média borrada. No último passo z = 0, porque o resultado precisa sair limpo.

Um passo com números, em t = 25, para o ponto do exemplo do atalho e uma rede que acerta o ruído exatamente:

```text
beta_25 = 0,0492    sqrt(alpha_25) = 0,9751    (1 - alpha_25) / sqrt(1 - alpha_bar_25) = 0,0492 / 0,6871 = 0,0716
x = (1,0702 - 0,0716 x 0,5) / 0,9751 = 1,0608
y = (-0,6871 - 0,0716 x (-1,0)) / 0,9751 = -0,6312
depois some sigma_25 z, com sigma_25 = sqrt(0,0492) = 0,2218
```

O ponto andou só um pouco, de (1,0702; -0,6871) para cerca de (1,0608; -0,6312). Nenhum passo sozinho faz o trabalho. Cem deles fazem.

![processo reverso](../../../projects/artificial-intelligence/diffusion-toy/results/reverse.svg)

| Passo t | Distância média até o anel | Raio médio | Dispersão do raio | Variância de x | Variância de y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0,535 | 1,244 | 0,647 | 0,967 | 0,995 |
| 75 | 0,543 | 1,252 | 0,654 | 0,971 | 1,023 |
| 50 | 0,509 | 1,206 | 0,622 | 0,936 | 0,905 |
| 25 | 0,449 | 1,099 | 0,556 | 0,772 | 0,744 |
| 10 | 0,256 | 0,992 | 0,320 | 0,552 | 0,534 |
| 0 | 0,047 | 0,987 | 0,066 | 0,496 | 0,482 |

Leia esta tabela ao lado da tabela do processo direto: as linhas coincidem, na ordem contrária. O processo reverso volta pelas mesmas nuvens. A maior parte da mudança visível acontece nos últimos 25 passos, assim como a maior parte da destruição aconteceu nos primeiros 25.

### Caiu sobre o anel?

| Pontos | Distância média até o anel |
| --- | ---: |
| Dado real (o conjunto de treino) | 0,024 |
| Gerados (passo 0 do processo reverso) | 0,047 |
| Ruído puro (passo 100, onde a geração começa) | 0,535 |
| Limite do teste | 0,10 |

O limite documentado é **0,10**: cerca do dobro do 0,047 medido, e menos de um quinto da distância do ruído puro. Os pontos gerados estão 11 vezes mais perto do anel que o ruído de onde partiram, e cerca de duas vezes mais longe que o dado real. O anel gerado é mais grosso que o real (dispersão do raio 0,066 contra 0,030), o que vem do erro de uma rede pequena e dos passos grosseiros.

Uma distância pequena não basta. Um modelo que pusesse todos os pontos no mesmo lugar do anel também a teria. Por isso um segundo teste corta o plano em 12 fatias iguais e exige que cada uma tenha entre 50% e 150% de uma parte igual. Medido: de 137 a 182 pontos por fatia, com 167 para um anel perfeitamente uniforme. Um terceiro teste confere que os pontos são novos: nenhum deles é cópia de um ponto do treino.

### Por que a difusão é lenta para gerar

A rede foi chamada 100 vezes para produzir um lote de pontos. Uma GAN ou o decodificador de um autoencoder é chamado uma vez. Esse é o preço de dividir um problema difícil em passos fáceis, e é por isso que tanto trabalho foi dedicado a amostradores que precisam de menos passos.

## O que um modelo de imagens de verdade acrescenta

- **Pixels no lugar de pontos 2D.** As mesmas fórmulas, aplicadas a todos os números do tensor da imagem de uma vez. Uma imagem colorida de 512 x 512 tem 786.432 deles.
- **Uma U-Net (ou um transformer) no lugar de um MLP.** A rede que adivinha o ruído precisa entender a figura, então é feita de convoluções que encolhem a imagem, processam e a fazem crescer de volta, com atalhos entre as duas metades. Tem centenas de milhões de parâmetros em vez de 9666.
- **Difusão latente.** O processo inteiro roda no pequeno latente de um autoencoder (por exemplo 64 x 64 x 4 números em vez de 512 x 512 x 3), e o decodificador transforma o resultado em pixels só no fim. Custa muito menos computação.
- **Condicionamento por texto.** A rede recebe uma terceira entrada além da imagem com ruído e do passo: o prompt, codificado por um modelo de texto e lido por atenção cruzada (cross-attention). Aqui não há condição, então o modelo só sabe desenhar o anel.
- **Menos passos.** Amostradores que pulam passos geram com algumas dezenas de chamadas em vez de 1000.
- **Detalhes do treino em escala.** Outras agendas de ruído, uma média móvel dos pesos, e muito mais dados e passos.

Nenhum deles muda as três ideias mostradas aqui: destruir o dado com um ruído conhecido, aprender a adivinhar esse ruído, e gerar retirando-o pouco a pouco.

## Como rodar

```sh
cd projects/artificial-intelligence/diffusion-toy
./setup-unix-diffusion-toy.sh          # build, testes, demo
docker compose run --rm python-test    # só os testes
docker compose run --rm python-demo    # regrava results/
```

Todos os números desta página estão em [`results/results.md`](../../../projects/artificial-intelligence/diffusion-toy/results/results.md) (em inglês), gravado pela demo com sementes fixas.
