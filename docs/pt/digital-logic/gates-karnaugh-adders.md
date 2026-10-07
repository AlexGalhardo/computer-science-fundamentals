# Portas lógicas, Karnaugh e somadores

> English version: [docs/en/digital-logic/gates-karnaugh-adders.md](../../en/digital-logic/gates-karnaugh-adders.md)

Mini-projeto MP-DL-1, em [`projects/digital-logic/gates-karnaugh-adders`](../../../projects/digital-logic/gates-karnaugh-adders). Ele ensina como uma função booleana vira um circuito: de uma expressão para uma tabela-verdade, de uma tabela-verdade para a menor expressão, e de portas para um circuito que soma.

## 1. Uma expressão é um circuito

`A·B + C'` e o desenho de uma porta AND e um inversor alimentando uma porta OR são o mesmo objeto. O parser em `ts/src/expression.ts` transforma o texto em uma árvore em que cada nó é uma porta e cada folha é um fio de entrada:

```text
        OR
       /  \
    AND    NOT
    / \     |
   A   B    C
```

As prioridades são as usuais: NOT primeiro, depois AND, depois XOR, depois OR. Avaliar a árvore para certos valores de entrada é simular o circuito, e fazer isso para as 2^n combinações das entradas, em ordem de contagem binária, dá a tabela-verdade. A linha k da tabela é o mintermo k, com a primeira variável como bit mais significativo.

```text
A B C | F
---------
0 0 0 | 1
0 0 1 | 0
0 1 0 | 1
0 1 1 | 0
1 0 0 | 1
1 0 1 | 0
1 1 0 | 1
1 1 1 | 1
```

A tabela-verdade é também a ferramenta que resolve qualquer dúvida de álgebra booleana: duas expressões são equivalentes exatamente quando as suas colunas de saída são iguais. Os teoremas de De Morgan, a absorção e o teorema do consenso são todos conferidos desse modo nos testes, em vez de serem aceitos de confiança.

**Aceite.** Vinte tabelas-verdade foram escritas à mão e o gerador reproduz todas, nas duas linguagens.

## 2. Da tabela-verdade à menor expressão

A soma canônica de produtos tem um termo por linha com saída 1, o que é correto e desperdiça portas. O mapa de Karnaugh elimina o desperdício pelo olho: células vizinhas diferem em uma variável, então um par de células com 1 é um termo sem essa variável (X·Y + X·Y' = X), um grupo de quatro perde duas variáveis, e assim por diante.

O método de Quine-McCluskey é a mesma ideia escrita como um procedimento, e por isso funciona para qualquer número de variáveis:

1. **Achar todos os implicantes primos.** Parte-se dos mintermos. Cada dois termos que diferem em exatamente uma variável se fundem em um termo sem ela, e o processo se repete com os termos fundidos. Um termo que nunca se fundiu é um grupo que não pode crescer: um implicante primo.
2. **Escolher uma cobertura.** Um implicante primo é **essencial** quando é o único que cobre algum mintermo, então precisa estar na resposta. Para os mintermos que ainda ficaram descobertos, `minimise` faz uma busca exata e guarda a cobertura com menos termos e, entre essas, com menos literais.

As **condições irrelevantes** (don't care) participam do passo 1, onde ajudam a formar grupos maiores, mas não entram na lista que o passo 2 precisa cobrir.

| Função | Implicantes primos | Essenciais | Soma de produtos mínima |
| --- | ---: | ---: | --- |
| Σm(0, 2, 4, 5, 6) | 2 | 2 | `A·B' + C'` |
| Σm(1, 3, 7) | 2 | 2 | `A'·C + B·C` |
| Σm(1, 3, 7) + d(5) | 1 | 1 | `C` |
| Σm(0, 2, 5, 7, 8, 10, 13, 15) | 2 | 2 | `B'·D' + B·D` |
| Σm(0, 1, 2, 5, 8, 9, 10) | 3 | 3 | `A'·C'·D + B'·C' + B'·D'` |
| Σm(1, 2, 4, 7) | 4 | 4 | os quatro mintermos: nada se funde |
| Σm(0, 1, 2, 5, 6, 7) | 6 | 0 | três termos de dois literais |

Três linhas merecem um segundo olhar. A quarta é a XNOR de B e D: os seus grupos são os quatro cantos e as quatro células centrais, que só existem porque o mapa se fecha sobre si mesmo. A sexta é o padrão de tabuleiro de xadrez de A xor B xor C, em que nenhum 1 é vizinho de outro e a soma de produtos não pode diminuir. A última é um mapa cíclico: nenhum implicante primo é essencial, então escolher de forma gulosa não basta, e é a busca exata que garante três termos.

**Aceite.** A expressão minimizada é escrita de volta como texto, analisada de novo, e a sua tabela-verdade é comparada com a original em todas as linhas. Isso é feito para as 256 funções de 3 variáveis, as 65.536 funções de 4 variáveis e funções aleatórias de 5 e 6 variáveis. Com condições irrelevantes, toda linha obrigatória precisa coincidir e as linhas irrelevantes ficam livres.

Um limite que vale conhecer: a minimização exata é exponencial no pior caso. Ela serve bem para os tamanhos de um curso, e as ferramentas reais de síntese usam heurísticas como o Espresso.

## 3. Das portas à aritmética

Somar dois bits dá um bit de soma e um vai-um. A tabela mostra que a soma é a XOR e o vai-um é a AND: esse é o **meio somador**. Para somar uma coluna no meio de um número é preciso uma terceira entrada, o vai-um que chega da direita. O **somador completo** são dois meio somadores e uma OR:

```text
Soma           = A xor B xor Cin
Vai-um (saída) = A·B + Cin·(A xor B)        (1 quando pelo menos duas entradas valem 1)
```

Encadear n somadores completos, com o vai-um de saída de cada estágio ligado ao vai-um de entrada do seguinte, dá o **somador com propagação de vai-um** (ripple-carry):

```text
carry out of each stage:    01111000
A = 109                     01101101
B = 58                      00111010
sum = 167, carry out = 0    10100111
```

A linha dos vai-uns mostra o custo desse projeto: um vai-um pode ter de atravessar todos os estágios, então o atraso no pior caso cresce com o número de bits. `255 + 1` é o pior caso, com vai-um saindo dos oito estágios.

**Aceite.** O somador de 8 bits feito de portas concorda com a soma nativa para os 65.536 pares de entrada, incluindo o vai-um de saída.

## Por que existe uma versão em Python

O código em TypeScript simula uma linha por vez, que é como o assunto é explicado no papel. Os inteiros do Python não têm limite de tamanho, e isso muda a lição: uma coluna inteira da tabela-verdade cabe em **um inteiro**, em que o bit r é o valor do sinal na linha r.

```text
A           00001111   = 240
B           00110011   = 204
C           01010101   = 170
A & B | ~C  10101011   = 213
```

Uma porta processa então todas as linhas com um único `&`, `|` ou `^`. Isso é simulação bit-paralela. Dois detalhes merecem atenção em `python/logic.py`: o NOT é um XOR com a coluna de uns, porque o `~` do Python daria um número negativo, e nenhum parser é escrito, porque `ast.parse` já conhece as prioridades de `~`, `&`, `^` e `|`. Só os tipos de nó de uma expressão booleana são aceitos e nada é executado com `eval`.

O somador mostra o ganho. As 16 entradas do somador de 8 bits viram 16 colunas de 65.536 bits cada, e rodar a rede de portas **uma vez**, 40 operações de porta, soma todos os pares de bytes ao mesmo tempo.

## Como rodar

```sh
./setup-unix-gates-karnaugh-adders.sh        # Linux e macOS
./setup-windows-gates-karnaugh-adders.ps1    # Windows
```

O script precisa apenas do Docker. Ele constrói as imagens, roda os testes das duas linguagens e depois as demos, que gravam `results/results-ts.md` e `results/results-python.md`.

## Tópicos do quiz

`logic-gates`, `boolean-algebra`, `karnaugh-maps` e `arithmetic-circuits`, na área `digital-logic`. O próximo mini-projeto, [nand-alu-cpu](nand-alu-cpu.md), parte de uma única porta e chega a um pequeno processador.
