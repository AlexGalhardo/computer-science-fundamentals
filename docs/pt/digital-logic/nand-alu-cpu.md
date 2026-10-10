# Uma ALU só de NANDs e uma CPU de 4 bits

> English version: [docs/en/digital-logic/nand-alu-cpu.md](../../en/digital-logic/nand-alu-cpu.md) · Versión en español: [docs/es/digital-logic/nand-alu-cpu.md](../../es/digital-logic/nand-alu-cpu.md)

Mini-projeto MP-DL-2, em [`projects/digital-logic/nand-alu-cpu`](../../../projects/digital-logic/nand-alu-cpu). Ele ensina como um computador é construído a partir de uma única porta. O código tem uma só primitiva, `nand(a, b)`, e todo o resto é ligação de fios: cada camada abaixo é escrita apenas com a camada anterior.

```text
NAND -> NOT, AND, OR, XOR -> multiplexador, decodificador, somador completo -> ALU
                          -> latch SR -> latch D -> flip-flop D -> registrador
ALU + registradores + multiplexadores + decodificador -> CPU -> um programa que multiplica
```

## 1. Todas as portas a partir da NAND

A NAND vale 0 só quando as duas entradas valem 1. É uma porta **universal**: com ela se constroem NOT, AND e OR, e essas três constroem qualquer função booleana.

| Porta | Construção | NANDs |
| --- | --- | ---: |
| NOT A | `NAND(A, A)`, pois A·A = A | 1 |
| A AND B | `NOT(NAND(A, B))`, as duas inversões se cancelam | 2 |
| A OR B | `NAND(NOT A, NOT B)`, De Morgan: A + B = (A'·B')' | 3 |
| A XOR B | `M = NAND(A, B)`, depois `NAND(NAND(A, M), NAND(B, M))` | 4 |
| Multiplexador 2 para 1 | `NAND(NAND(NOT S, I0), NAND(S, I1))` | 4 |
| Somador completo | duas XORs que compartilham as suas NANDs internas, mais uma NAND para o vai-um | 9 |

Traduzir A'·B + A·B' porta por porta custaria 9 NANDs para a XOR. Compartilhar o sinal M reduz o custo para 4, que é o mínimo. O mesmo compartilhamento faz o somador completo custar 9 NANDs em vez de 15. O código conta cada avaliação de `nand`, e os testes conferem esses números.

**Aceite (MP-DL-2.1).** Cada porta derivada é comparada com a sua tabela-verdade.

## 2. A ALU

A unidade lógica e aritmética recebe duas palavras de 4 bits e dois fios de controle e produz um resultado e quatro flags.

| op1 op0 | Operação |
| --- | --- |
| 0 0 | X + Y |
| 0 1 | X − Y |
| 1 0 | X and Y |
| 1 1 | X or Y |

Três ideias valem ser guardadas:

- **Hardware não tem `if`.** Os quatro resultados são calculados o tempo todo e multiplexadores escolhem um. Os fios de controle apenas selecionam.
- **A subtração reaproveita o somador.** Em complemento de 2, X − Y = X + Y' + 1. Uma XOR por bit inverte Y quando o fio `subtract` vale 1 (XOR com 1 inverte, XOR com 0 deixa passar) e o mesmo fio é o vai-um de entrada, que fornece o +1.
- **As flags são subprodutos gratuitos.** Z é a NOR dos bits do resultado. N é o bit mais significativo. C é o vai-um de saída do somador, e depois de uma subtração C = 1 significa "sem empréstimo", isto é, X ≥ Y como números sem sinal. V, o estouro com sinal, é o vai-um que entra no bit de sinal ser diferente do que sai dele.

```text
x     op   y     result  Z N C V
0111  ADD  0001  1000    0 1 0 1     7 + 1 = -8: estouro, sem vai-um de saída
1111  ADD  0001  0000    1 0 1 0     -1 + 1 = 0: vai-um de saída, sem estouro
0101  SUB  0011  0010    0 0 1 0     5 - 3 = 2, sem empréstimo
0011  SUB  0101  1110    0 1 0 0     3 - 5 = -2, houve empréstimo
```

As duas primeiras linhas são a razão de vai-um e estouro serem flags diferentes: o vai-um trata de números sem sinal, e o estouro, de números com sinal.

**Aceite (MP-DL-2.2).** As 16 × 16 × 4 = 1.024 combinações são comparadas com uma referência escrita em aritmética comum, resultado e quatro flags.

## 3. Memória a partir da realimentação

Um circuito combinacional esquece: a sua saída depende só das entradas presentes. A memória aparece quando uma saída volta para uma entrada.

- **Latch SR.** Duas NANDs em cruz: Q = NAND(S', Q') e Q' = NAND(R', Q). As entradas são ativas em nível baixo: S' = 0 liga, R' = 0 desliga, as duas em 1 mantêm. As duas em 0 forçam Q = Q' = 1, a combinação proibida.
- **Latch D.** Mais duas NANDs na frente tornam a combinação proibida impossível. Enquanto `enable` vale 1 o latch é transparente e Q acompanha D; quando vai a 0, Q é mantido.
- **Flip-flop D.** Dois latches D em sequência com habilitações opostas (mestre-escravo). O valor é capturado no instante em que o clock sobe e não pode mudar até a próxima borda de subida.
- **Registrador.** Um flip-flop por bit no mesmo clock. Um multiplexador na frente de cada um realimenta o bit para ele mesmo quando `load` vale 0, então o registrador mantém a palavra embora o clock continue pulsando.

O simulador trata o laço de realimentação recalculando as duas portas do latch até as saídas pararem de mudar, que é o que o circuito real faz ao se acomodar. A mesma forma de onda mostra a diferença entre nível e borda:

```text
t:          0 1 2 3 4 5 6 7 8 9
clock:      0 0 1 1 1 0 0 1 1 0
D:          1 0 0 1 1 0 1 1 0 0
latch D:    0 0 0 1 1 1 1 1 0 0     acompanha D enquanto o clock vale 1
flip-flop:  0 0 0 0 0 0 0 1 1 1     só olha para D quando o clock sobe
```

## 4. A CPU

Uma máquina de acumulador: um registrador de trabalho A, um contador de programa PC, duas flags Z e C, um registrador de saída, 16 células de memória de 4 bits e uma ROM de 16 instruções. Uma instrução é um byte, com o opcode no nibble alto e o operando no nibble baixo. A tabela de instruções está no [README](../../../projects/digital-logic/nand-alu-cpu/README.pt-BR.md).

Um ciclo de clock tem duas metades.

1. **A parte combinacional se acomoda.**
   - *Busca*: o PC é a entrada de seleção de uma árvore de multiplexadores 16 para 1 sobre a ROM.
   - *Decodificação*: um decodificador 4 para 16 transforma o opcode em uma linha ativa. Cada sinal de controle é uma OR de linhas, por exemplo `loadA = LDI + LDA + ADD + SUB + AND + OR + ADDI + SUBI`.
   - *Execução*: multiplexadores escolhem as entradas da ALU (A ou zero, uma célula de memória ou o operando) e a ALU calcula. Uma carga é calculada como "0 + operando", então toda escrita em A passa pela ALU e atualiza as flags.
   - *Próximo PC*: um multiplexador escolhe PC + 1 ou o destino do salto. `JZ` e `JC` são uma AND da linha da instrução com a flag.
2. **O clock sobe** e todos os registradores capturam a sua entrada na mesma borda. Todas as entradas foram calculadas a partir dos valores antigos, e é por isso que um projeto síncrono é previsível.

O que não é construído com NAND: o próprio clock e o conteúdo da ROM, que são fios constantes.

## 5. O programa

A CPU não tem instrução de multiplicar. O [`programs/multiply.asm`](../../../projects/digital-logic/nand-alu-cpu/programs/multiply.asm) constrói uma com soma e um laço: soma x ao produto y vezes, contando y até zero e saindo do laço com `JZ`. A primeira e a última iteração de 3 × 4, tiradas do trace versionado:

```text
step  pc  instr    A     dec  Z C  m0  m1  m2  out
   5   4  LDA 1    0100    4  0 0   3   4   0    0
   6   5  JZ 12    0100    4  0 0   3   4   0    0
   7   6  SUBI 1   0011    3  0 1   3   4   0    0
   8   7  STA 1    0011    3  0 1   3   3   0    0
   9   8  LDA 2    0000    0  1 0   3   3   0    0
  10   9  ADD 0    0011    3  0 0   3   3   0    0
  11  10  STA 2    0011    3  0 0   3   3   3    0
  12  11  JMP 4    0011    3  0 0   3   3   3    0
 ...
  37   4  LDA 1    0000    0  1 0   3   0  12    0
  38   5  JZ 12    0000    0  1 0   3   0  12    0
  39  12  LDA 2    1100   12  0 0   3   0  12    0
  40  13  OUT      1100   12  0 0   3   0  12   12
  41  14  HLT      1100   12  0 0   3   0  12   12
```

A execução inteira leva 41 instruções e 122.601 avaliações de NAND, cerca de 2.990 por ciclo de clock. A maior parte é gasta nos 64 flip-flops da memória, o que é um retrato justo dos chips reais: a memória domina a contagem de portas.

**Aceite (MP-DL-2.3).** O trace está versionado em `results/trace.txt` e impresso nos dois READMEs. Os testes das duas linguagens precisam reproduzir esse arquivo byte a byte, e também executam o mesmo programa para os 256 pares de números de 4 bits, conferindo o produto módulo 16.

## Por que existe uma versão em Go

TypeScript é a referência. O Go muda três coisas no modo de escrever o mesmo circuito:

- **A largura é um tipo.** Uma palavra é `Nibble`, um array `[4]Bit`. Ligar um feixe com a largura errada é um erro de compilação, enquanto a versão em TypeScript confere o tamanho em tempo de execução.
- **O valor zero importa.** Uma struct de zeros seria um latch com Q = Q' = 0, um estado que nenhum latch real mantém, e a primeira atualização o acordaria em 1. Por isso latches, flip-flops e registradores têm construtores que os iniciam no estado de reset.
- **Erros são valores.** O montador e a CPU retornam erros em vez de lançá-los.

As duas implementações ficam amarradas pelo `results/trace.txt` compartilhado: cada suíte de testes compara o seu próprio trace com esse arquivo, o que prova que elas concordam instrução por instrução. Elas também gastam o mesmo número de avaliações de NAND.

## Limites do modelo

A simulação é lógica, não elétrica. As portas não têm atraso, então não há glitches, violações de setup ou hold, nem metaestabilidade. Um projeto real também precisa de um circuito de reset; aqui todo registrador simplesmente começa zerado.

## Como rodar

```sh
./setup-unix-nand-alu-cpu.sh        # Linux e macOS
./setup-windows-nand-alu-cpu.ps1    # Windows
```

O script precisa apenas do Docker. Ele constrói as imagens, roda os testes das duas linguagens e depois as demos.

## Tópicos do quiz

`logic-gates`, `binary-codes`, `arithmetic-circuits`, `mux-demux-encoders-decoders`, `latches-flip-flops` e `registers-counters`, na área `digital-logic`. O mini-projeto anterior, [gates-karnaugh-adders](gates-karnaugh-adders.md), cobre tabelas-verdade, minimização e o somador ripple-carry.
