# Janela deslizante e um mini TCP

> English version: [docs/en/networks/sliding-window-mini-tcp.md](../../en/networks/sliding-window-mini-tcp.md) · Versión en español: [docs/es/networks/sliding-window-mini-tcp.md](../../es/networks/sliding-window-mini-tcp.md)

Mini-projeto: [`projects/networks/sliding-window-mini-tcp`](../../../projects/networks/sliding-window-mini-tcp/README.pt-BR.md). Linguagens: Go e Elixir. Tópicos do quiz: `networks` / `data-link-layer` e `networks` / `transport-layer`.

## O problema

Uma rede entrega pacotes sem garantia: um pacote pode se perder, chegar duas vezes ou chegar depois de um pacote enviado mais tarde. As aplicações querem o contrário: todos os bytes, uma vez, em ordem. Os protocolos deste mini-projeto constroem a segunda coisa a partir da primeira usando só três ferramentas: **números de sequência**, **confirmações** e **temporizadores**.

## Parte 1: o canal simulado

`go/channel` (e `elixir/lib/sliding_window_mini_tcp/channel.ex`) modela um sentido de um enlace. Entregar um pacote a ele no tick `now` devolve os ticks em que as cópias chegam:

| Resultado | Significado |
| --- | --- |
| nenhuma chegada | o pacote se perdeu |
| duas chegadas | o pacote foi duplicado |
| uma chegada depois da de um pacote mais novo | reordenação |

Toda decisão aleatória vem de um gerador semeado pela configuração. A mesma semente produz as mesmas perdas nos mesmos ticks, o que um teste verifica comparando dois traços. Um canal reproduzível é o que torna depurável um erro de protocolo.

## Parte 2: três protocolos, um motor

`go/arq` descreve um protocolo por dois números, a janela de envio e a janela de recepção:

| Protocolo | Janela de envio | Janela de recepção | Confirmação | No estouro do temporizador |
| --- | --- | --- | --- | --- |
| stop-and-wait | 1 | 1 | cumulativa | reenvia o quadro |
| go-back-N | N | 1 | cumulativa | reenvia a janela inteira |
| retransmissão seletiva | N | N | uma por quadro | reenvia só o quadro que expirou |

O enlace simulado transporta um quadro por tick com atraso de 5 ticks, então uma ida e volta leva pelo menos 10 ticks. Por isso o stop-and-wait entrega cerca de 0,09 quadro por tick sem perdas: ele envia um quadro e fica parado o resto da ida e volta. Uma janela preenche esse tempo ocioso.

### Os números de sequência dão a volta

Os quadros levam um número de sequência de 16 bits. Cada lado recupera a posição real pela distância até a borda da sua janela, módulo 2^16. Para que isso não seja ambíguo, a janela é limitada: 2^n - 1 no go-back-N e 2^(n-1) na retransmissão seletiva, porque um receptor que guarda quadros nunca pode ver a janela antiga e a nova se sobreporem. `MaxWindow` codifica a regra e um teste a confere com 3 bits (7 e 4).

O stop-and-wait clássico de 1 bit só é correto em um canal que mantém a ordem. Este canal reordena, então os três protocolos usam o espaço de 16 bits.

### O que a simulação mostra

De [results/results.md](../../../projects/networks/sliding-window-mini-tcp/results/results.md), um arquivo de 256 KiB em 256 quadros, janela de 8:

| perda | protocolo | ticks | quadros enviados | eficiência |
| --- | --- | --- | --- | --- |
| 0% | stop-and-wait | 2878 | 256 | 100,0% |
| 0% | go-back-N | 1832 | 522 | 49,0% |
| 0% | retransmissão seletiva | 444 | 256 | 100,0% |
| 20% | stop-and-wait | 6933 | 417 | 61,4% |
| 20% | go-back-N | 5099 | 1154 | 22,2% |
| 20% | retransmissão seletiva | 2037 | 417 | 61,4% |

- O go-back-N retransmite mesmo com 0% de perda. O canal continua reordenando 20% das cópias, e um receptor que aceita apenas o próximo quadro em ordem joga fora os que chegam adiantados. A reordenação custa ao go-back-N tanto quanto a perda.
- A retransmissão seletiva e o stop-and-wait enviam exatamente o mesmo número de quadros: os dois reenviam só o que realmente se perdeu. A retransmissão seletiva apenas faz isso várias vezes mais rápido.
- Toda linha termina com o mesmo SHA-256 do arquivo original, em todas as taxas de perda.

## Parte 3: o mini TCP sobre UDP

`go/minitcp` roda em sockets UDP reais na interface de loopback. A perda é injetada no ponto em que cada socket envia, nos dois sentidos, porque o loopback em si praticamente nunca descarta um pacote.

| Mecanismo | Como aparece no código |
| --- | --- |
| Acordo de três vias | SYN, SYN+ACK, ACK com números de sequência iniciais; os segmentos seguintes precisam confirmar o número do receptor, então segmentos estranhos são ignorados |
| Números de sequência por byte | `seq` é o número do primeiro byte dos dados, 32 bits, comparado com aritmética que dá a volta |
| ACK cumulativo | `ack` é o próximo byte esperado; um campo extra `sack` nomeia o segmento que provocou o ACK, usado pela retransmissão seletiva |
| Tempo limite de retransmissão | tempo de ida e volta suavizado mais quatro vezes o desvio; dobrado a cada estouro; a regra de Karn ignora segmentos retransmitidos |
| Encerramento ordenado | FIN, FIN+ACK, e o receptor aguarda para repetir a sua última resposta, como o TIME_WAIT |
| Integridade | CRC-32 em cada segmento, SHA-256 no arquivo inteiro |

O transmissor pode se recuperar de perdas das mesmas três formas da simulação. Medido na execução versionada (10 MB, 5% de perda em cada sentido, 3 execuções):

| protocolo | MB/s (média ± desvio padrão) | segmentos enviados | estouros de temporizador |
| --- | --- | --- | --- |
| stop-and-wait | 3,96 ± 0,14 | 9186 | 852 |
| go-back-N, janela 32 | 7,43 ± 0,54 | 22323 | 438 |
| retransmissão seletiva, janela 32 | 15,72 ± 0,30 | 9079 | 209 |

O go-back-N envia cerca de duas vezes e meia os segmentos para mover o mesmo arquivo. Esses tempos dependem da máquina e do escalonamento, então não são reproduzíveis até o último dígito; o relatório registra o processador e o runtime, e o que se mantém entre execuções é a ordem dos três.

## Por que Elixir também

A versão em Elixir repete a simulação como uma função pura. A transferência inteira é uma struct imutável; cada tick é um pipeline de quatro funções que devolvem a próxima struct; o laço é recursão com uma cláusula por situação. O gerador aleatório é um valor passado de chamada em chamada, então o determinismo não exige disciplina: não há estado escondido para esquecer. Os números diferem da tabela em Go porque as duas linguagens usam geradores diferentes, mas cada uma é repetível por conta própria.

## Limites

- Sem controle de congestionamento: a janela é fixa. Partida lenta e AIMD são assunto do quiz, não implementados aqui.
- Sem janela de controle de fluxo anunciada pelo receptor.
- Uma conexão por socket, dados em um sentido só.
- O mini TCP não interopera com o TCP real. É um protocolo didático e roda apenas na interface de loopback.

## Como verificar

```sh
cd projects/networks/sliding-window-mini-tcp
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
docker compose run --rm -T go-demo
```
