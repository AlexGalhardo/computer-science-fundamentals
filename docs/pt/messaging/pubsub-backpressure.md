# Fila, pub/sub e backpressure (MP-MSG-3)

> English version: [docs/en/messaging/pubsub-backpressure.md](../../en/messaging/pubsub-backpressure.md) · Versión en español: [docs/es/messaging/pubsub-backpressure.md](../../es/messaging/pubsub-backpressure.md)

Mini-projeto: [`projects/messaging/pubsub-backpressure`](../../../projects/messaging/pubsub-backpressure/README.pt-BR.md). Tópicos do quiz: `queue-pubsub-stream`, `rabbitmq-exchanges-routing`, `backpressure`, `sqs-sns`.

## Parte 1: quem recebe uma mensagem?

### Fila de trabalho: consumidores concorrentes

Uma fila, vários consumidores. O broker entrega cada mensagem a **um** deles, em rodízio. Adicionar um consumidor divide o mesmo trabalho entre mais mãos: o número total de entregas não muda. É assim que uma tarefa lógica (enviar o e-mail, redimensionar a imagem) escala.

### Fan-out: publish/subscribe

Uma exchange do tipo `fanout`, e **uma fila por assinante**. A exchange copia cada mensagem para toda fila ligada a ela, então cada assinante recebe todas. Adicionar um assinante acrescenta mais uma cópia completa do fluxo. O produtor cita só a exchange e não sabe quem escuta.

### A regra que cobre os dois

No RabbitMQ existe uma cópia **por fila**, nunca por consumidor. Se os assinantes dividem ou duplicam uma mensagem depende de quantas filas existem:

| Desejado | Topologia |
| --- | --- |
| Cada mensagem processada uma vez, por qualquer um de N workers | 1 fila, N consumidores |
| Cada um de N serviços vê todas as mensagens | N filas ligadas a uma exchange, 1 consumidor em cada |
| Cada um de N serviços vê todas as mensagens, e cada serviço roda M instâncias | N filas, M consumidores em cada |

O laboratório roda as três linhas com 300 mensagens e confere 300, 900 e 600 entregas. A mesma regra vale em outros lugares com outros nomes: um consumer group do Kafka é "uma fila", e um tópico SNS com uma fila SQS por serviço é o fan-out.

## Parte 2: e se o produtor for mais rápido?

Um buffer entre um produtor e um consumidor absorve rajadas. Ele não absorve uma diferença duradoura de velocidade: se 20 mensagens chegam por milissegundo e 1 sai, o buffer cresce 19 por milissegundo enquanto a diferença durar. Algo precisa ceder, e só há três opções: crescer (até a memória acabar), descartar, ou **desacelerar o produtor**. A terceira é o backpressure.

### Em um processo

```ts
await queue.push(message);   // só resolve quando há espaço
```

Esse `await` é o mecanismo inteiro. Com uma fila ilimitada a promise sempre resolve na hora, o produtor nunca espera, e o laboratório mede um buffer que cresce em linha reta (cerca de 45 MiB por segundo) junto com a memória residente do processo. Com capacidade 100 o buffer fica em 100 mensagens, a memória fica estável, e o produtor acaba produzindo exatamente na velocidade em que o consumidor consome. O custo também aparece na tabela: o produtor limitado enviou 1.388 mensagens em vez de 25.920. O backpressure não torna o sistema mais rápido; ele torna a parte lenta visível para a parte rápida em vez de escondê-la em um buffer.

### Entre um broker e um consumidor: prefetch

Um broker também é um buffer, e um lugar melhor para um acúmulo do que a memória de um consumidor: ele pode guardá-lo em disco e reparti-lo entre consumidores. O RabbitMQ empurra mensagens para os consumidores, então sem limite ele empurra tudo. O prefetch count (`basic.qos`) é o limite: no máximo aquela quantidade de mensagens sem ack por consumidor, com a próxima enviada só quando um ack chega.

O laboratório começa com 3.000 mensagens na fila e um consumidor lento. Sem prefetch o consumidor segurou 2.908 de uma vez e a fila ficou vazia; com `prefetch(10)` ele segurou 10 e 2.758 ficaram no broker. A quantidade de trabalho feito foi a mesma.

### Entre estágios: demanda (GenStage)

O GenStage coloca a mesma ideia no protocolo entre os estágios. Os dados descem, **a demanda sobe**:

```text
produtor  <---- "mande 10" ------  consumidor
produtor  ----- 10 eventos ----->  consumidor
```

Um produtor implementa `handle_demand(demand, state)` e pode devolver no máximo `demand` eventos. Um consumidor assina com `max_demand` (o máximo de eventos que aceita em andamento) e `min_demand` (o nível em que pede mais). Assim o estágio mais lento dita o ritmo do pipeline inteiro, e o buffer é um número na configuração.

O lado Elixir compara isso com o `send/2` puro, que nunca bloqueia e não dá sinal nenhum ao remetente: a caixa de mensagens do consumidor acaba segurando o fluxo inteiro (99.983 de 100.000 eventos). Com GenStage o pico é 10 para `max_demand: 10` e 100 para `max_demand: 100`, passem 1.000 ou 3.000 eventos.

## O que levar daqui

- Conte as filas, não os consumidores, para saber quantas vezes uma mensagem é processada.
- Um buffer ilimitado não resolve uma diferença de velocidade; ele adia a falha e a torna maior.
- Backpressure é um sinal que viaja contra os dados: uma fila cheia que faz o `push` esperar, uma janela de prefetch, uma mensagem de demanda.
- Coloque o acúmulo onde é mais barato guardar e mais fácil enxergar: no broker, não no heap do consumidor.
