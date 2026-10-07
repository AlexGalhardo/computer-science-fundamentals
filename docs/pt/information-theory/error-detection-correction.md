# Detecção e correção de erros (MP-INFO-2)

> English version: [docs/en/information-theory/error-detection-correction.md](../../en/information-theory/error-detection-correction.md)

Código: [projects/information-theory/error-detection-correction](../../../projects/information-theory/error-detection-correction). Linguagem: C++.

## O que ensina

Um canal com ruído inverte bits. O transmissor não consegue impedir isso, mas pode acrescentar **redundância**: bits extras calculados a partir dos dados. Com pouca redundância, o receptor percebe que algo mudou (**detecção**, seguida de retransmissão). Com mais, ele descobre qual bit mudou e o inverte de volta (**correção**).

A ideia por trás das duas é a **distância**. Apenas alguns padrões de bits são palavras válidas. Se quaisquer duas palavras válidas diferem em pelo menos d posições (a distância de Hamming mínima), então:

| Distância mínima | Garantia |
| ---: | --- |
| 2 | detecta 1 erro (bit de paridade) |
| 3 | detecta 2 erros, **ou** corrige 1 (Hamming(7,4), repetição) |
| 4 | corrige 1 **e** detecta 2 (Hamming estendido (8,4)) |

Em geral, detectar d erros exige distância d + 1, e corrigir d erros exige distância 2d + 1.

## Detectar

**Bit de paridade.** Um bit que torna par o número de bits 1. É o XOR de todos os bits de dados. Qualquer número ímpar de inversões é pego, e qualquer número par passa.

**Checksum da Internet.** Os dados são lidos como palavras de 16 bits, as palavras são somadas com os vai-uns somados de volta, e o complemento da soma é enviado. É barato, e é cego para tudo que mantém a soma: duas palavras trocadas, ou um bit subindo em uma palavra enquanto o mesmo bit desce em outra.

**CRC-32.** A mensagem é um polinômio com coeficientes 0 e 1, e o CRC é o resto da sua divisão por um gerador fixo de grau 32. A subtração é XOR, então a divisão é feita de deslocamentos e XORs:

```
1101000 | 1011        mensagem 1101, gerador 1011 (grau 3), três zeros acrescentados
1011
----
 1100
 1011
 ----
  1110
  1011
  ----
   1010
   1011
   ----
    001               resto: o quadro enviado é 1101 001
```

Um quadro danificado só escapa se o padrão de erros for, ele mesmo, múltiplo do gerador. Isso nunca acontece para rajadas de até 32 bits, e para danos aleatórios mais longos acontece cerca de uma vez em 2^32. A implementação aqui é o CRC-32 refletido do Ethernet e do zip, primeiro bit a bit e depois com uma tabela de 256 entradas montada em tempo de compilação. As duas dão `0xCBF43926` para `123456789`, o valor de conferência padrão.

Um CRC protege apenas contra acidentes. Qualquer pessoa pode recalculá-lo, então ele não protege contra uma alteração proposital.

## Corrigir

**Repetição (3,1).** Cada bit é enviado três vezes e a maioria vence. Corrige um erro por bloco e custa 3 bits por bit de dados.

**Hamming(7,4).** Quatro bits de dados e três de paridade, dispostos de modo que as verificações de paridade apontem para o bit errado:

```
posição    1   2   3   4   5   6   7
conteúdo   p1  p2  d1  p4  d2  d3  d4

p1 cobre 1, 3, 5, 7      p2 cobre 2, 3, 6, 7      p4 cobre 4, 5, 6, 7

dados 1011         ->  palavra   0 1 1 0 0 1 1
posição 6 inverte  ->  recebido  0 1 1 0 0 0 1
verificações: p1 ok (0), p2 falha (1), p4 falha (1)  ->  síndrome 110 = 6  ->  inverte a posição 6
```

Os bits de paridade ficam nas potências de dois, e cada posição é coberta pelos bits de paridade cujos números somam o seu. Assim, as verificações que falham, lidas como número binário (a **síndrome**), são a posição do erro. No código, a síndrome é calculada como o XOR dos números de todas as posições que guardam um 1.

Dois erros são demais: a síndrome vira o XOR de duas posições, que indica um terceiro bit. O decodificador o inverte e entrega dados errados, acreditando ter corrigido um erro.

**Hamming estendido (8,4), SECDED.** Um bit a mais, com a paridade da palavra inteira, separa um número ímpar de erros de um número par:

| Síndrome | Paridade global | Conclusão |
| --- | --- | --- |
| 0 | ok | sem erro |
| diferente de 0 | errada | um erro: corrige |
| diferente de 0 | ok | dois erros: só detecta |
| 0 | errada | o próprio bit de paridade global foi atingido |

É o esquema das memórias ECC.

## O simulador de ruído

Um canal binário simétrico inverte cada bit de forma independente com probabilidade BER (taxa de erro de bit). Para cada esquema e cada BER, 200.000 blocos são enviados e todo bloco danificado é classificado:

- **detectado** (detected): o receptor sabe que o bloco está ruim (pediria retransmissão);
- **corrigido** (corrected): o receptor o consertou e os dados estão certos;
- **perdido** (missed): o receptor entregou dados errados como se estivessem certos.

O simulador consegue apontar um erro perdido porque sabe o que foi enviado. Um receptor real não consegue, e é exatamente por isso que essa coluna importa.

| Esquema | Bloco (bits) | BER | Blocos | Com erros | Detectados | Corrigidos | Perdidos | Perdidos / com erros |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.0001 | 200000 | 179 | 179 | 0 | 0 | 0.000% |
| Parity bit | 9 | 0.001 | 200000 | 1748 | 1741 | 0 | 7 | 0.400% |
| Parity bit | 9 | 0.01 | 200000 | 17220 | 16582 | 0 | 638 | 3.705% |
| Parity bit | 9 | 0.05 | 200000 | 73783 | 60989 | 0 | 12794 | 17.340% |
| Parity bit | 9 | 0.1 | 200000 | 122342 | 86441 | 0 | 35901 | 29.345% |
| Internet checksum | 272 | 0.0001 | 200000 | 5284 | 5282 | 0 | 2 | 0.038% |
| Internet checksum | 272 | 0.001 | 200000 | 47332 | 47154 | 0 | 178 | 0.376% |
| Internet checksum | 272 | 0.01 | 200000 | 186952 | 185317 | 0 | 1635 | 0.875% |
| Internet checksum | 272 | 0.05 | 200000 | 200000 | 199986 | 0 | 14 | 0.007% |
| Internet checksum | 272 | 0.1 | 200000 | 200000 | 199997 | 0 | 3 | 0.002% |
| CRC-32 | 288 | 0.0001 | 200000 | 5634 | 5634 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.001 | 200000 | 49730 | 49730 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.01 | 200000 | 188736 | 188736 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.05 | 200000 | 199999 | 199999 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.1 | 200000 | 200000 | 200000 | 0 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.0001 | 200000 | 62 | 0 | 62 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.001 | 200000 | 658 | 0 | 658 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.01 | 200000 | 6123 | 0 | 6068 | 55 | 0.898% |
| Repetition (3,1) | 3 | 0.05 | 200000 | 28625 | 0 | 27107 | 1518 | 5.303% |
| Repetition (3,1) | 3 | 0.1 | 200000 | 54003 | 0 | 48351 | 5652 | 10.466% |
| Hamming (7,4) | 7 | 0.0001 | 200000 | 148 | 0 | 148 | 0 | 0.000% |
| Hamming (7,4) | 7 | 0.001 | 200000 | 1387 | 0 | 1380 | 7 | 0.505% |
| Hamming (7,4) | 7 | 0.01 | 200000 | 13613 | 0 | 13225 | 388 | 2.850% |
| Hamming (7,4) | 7 | 0.05 | 200000 | 60198 | 0 | 51186 | 9012 | 14.971% |
| Hamming (7,4) | 7 | 0.1 | 200000 | 104208 | 0 | 74134 | 30074 | 28.860% |
| Hamming (8,4) SECDED | 8 | 0.0001 | 200000 | 161 | 0 | 161 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.001 | 200000 | 1566 | 5 | 1561 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.01 | 200000 | 15359 | 518 | 14825 | 16 | 0.104% |
| Hamming (8,4) SECDED | 8 | 0.05 | 200000 | 67275 | 10395 | 55782 | 1098 | 1.632% |
| Hamming (8,4) SECDED | 8 | 0.1 | 200000 | 113827 | 30736 | 76245 | 6846 | 6.014% |

A execução usa um gerador escrito à mão com semente fixa, então a tabela é a mesma em qualquer máquina: `docker compose run --rm demo`.

Como ler a tabela:

- **Taxa de erro de bit contra taxa de erro de bloco.** Com BER 0,01, só 1 bit em 100 está errado, mas 94% dos quadros de 288 bits chegam danificados: 1 − 0,99^288. Quadros longos precisam de detecção forte.
- **A paridade** deixa passar os blocos com um número par de inversões, que ficam comuns à medida que a BER cresce.
- **O checksum** deixa passar quadros em que duas inversões se cancelam na soma. Com BER muito alta ele perde menos, apenas porque quadros muito danificados raramente mantêm a soma por acaso.
- **O CRC-32** não deixa passar nenhum dos mais de 600.000 quadros danificados. Um escape aleatório tem probabilidade 2^−32.
- **A repetição** com BER 0,1 entrega 5.652 bits errados em 200.000, 2,8%, o valor de 3p²(1 − p) + p³.
- **O Hamming(7,4)** nunca diz "detectado": todo bloco com duas ou mais inversões é entregue errado. **O Hamming(8,4)** leva a maior parte deles para a coluna de detectados, e o que ele ainda perde são blocos com três ou mais inversões.
- **Corrigir não é livre de risco.** Um código que corrige precisa adivinhar, e com mais erros do que os previstos ele adivinha errado. É por isso que enlaces muito ruidosos combinam a correção com um CRC por cima.

## Como as respostas são verificadas

- CRC-32: o valor de conferência padrão, a concordância das duas implementações, todas as rajadas de até 12 bits em cada posição de um quadro e 100.000 rajadas aleatórias de até 32 bits.
- Hamming(7,4): todos os 16 × 7 erros simples corrigidos, todos os 16 × 21 erros duplos corrigidos para o valor errado, distância mínima 3.
- Hamming(8,4): todos os 16 × 8 erros simples corrigidos, todos os 16 × 28 erros duplos detectados, distância mínima 4.
- Paridade: toda inversão simples pega, toda inversão dupla perdida. Checksum: o exemplo da RFC 1071, e as palavras trocadas que ele não enxerga.
- Simulador: sem ruído não há dano, a mesma semente dá a mesma tabela, as contagens fecham, e a fração de blocos danificados bate com 1 − (1 − p)^n.

## Tópicos do quiz relacionados

`information-theory`: `error-detection`, `error-correction`, `channel-capacity-noise`, `encoding-hashing-encryption`.
