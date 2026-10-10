# Condição de corrida no contador

> English version: [docs/en/concurrency/counter-race.md](../../en/concurrency/counter-race.md) · Versión en español: [docs/es/concurrency/counter-race.md](../../es/concurrency/counter-race.md)

Mini-projeto: [projects/concurrency/counter-race](../../../projects/concurrency/counter-race/README.pt-BR.md) (MP-CONC-1). Linguagens: Go, Rust, Java, TypeScript, Elixir.

## O problema

`counter++` não é um passo só. O processador lê o valor, soma 1 e grava o resultado de volta. Quando duas threads executam esses três passos ao mesmo tempo, isto pode acontecer:

```text
thread A            thread B            contador
lê 41                                   41
                    lê 41               41
soma 1 (42)
                    soma 1 (42)
grava 42                                42
                    grava 42            42   <- dois incrementos, o contador cresceu um
```

Uma atualização se perdeu. Nada quebrou e nenhum erro apareceu. O programa só dá uma resposta errada, diferente a cada execução. No mini-projeto, 8 workers fazem 1.000.000 de incrementos no total e o contador com bug costuma terminar entre 150.000 e 700.000.

Os três passos formam uma **seção crítica**: um trecho de código que só uma thread por vez pode executar. Toda correção é um jeito de garantir isso.

## Por que o bug se esconde

Uma corrida precisa de azar no tempo, e testes pequenos raramente têm esse azar. Três coisas neste mini-projeto existem só para o bug aparecer sempre:

- Um **portão de largada**. Todos os workers esperam e saem juntos. Sem ele, o primeiro worker costuma terminar antes de o último começar.
- **Leituras e escritas de verdade**. Um compilador otimizador pode transformar um laço de 125.000 incrementos em um único `+= 125000`. A corrida continua lá, mas quase nunca aparece. A versão em Rust usa leituras e escritas voláteis, e a versão em Java usa um campo `volatile`, para manter uma leitura e uma escrita por incremento. Com um campo Java comum, medimos o bug se escondendo em 8 de 10 execuções depois que o compilador JIT aqueceu.
- **Repetição**. O teste roda o experimento 10 vezes e exige atualizações perdidas em pelo menos 9.

O `volatile` do Java merece atenção: ele garante que uma leitura enxerga a última escrita (visibilidade), e nada além disso. `count++` em um campo volatile continua sendo três passos e continua perdendo atualizações.

## As quatro correções

| Correção | Ideia | Custo |
| --- | --- | --- |
| Mutex | Só quem tem a trava executa a seção crítica. Os outros esperam | Espera, e um lock e um unlock por incremento |
| Operação atômica | O processador faz leitura, soma e escrita como uma instrução indivisível | Serve para uma variável. Duas variáveis que mudam juntas ainda precisam de trava |
| Canal ou troca de mensagens | Uma thread é dona do número. As outras mandam mensagens a ela, tratadas uma por vez | Uma operação de fila por incremento, a mais lenta das quatro |
| Ator | A mesma ideia como recurso da linguagem: um processo Elixir guarda o estado no próprio laço e tem uma caixa de mensagens | O mesmo de cima. Em troca, o estado nunca é compartilhado por acidente |

As duas primeiras compartilham a memória e a protegem. As duas últimas não compartilham a memória.

### Troca de mensagens não elimina toda corrida

A pasta de Elixir também tem uma função propositalmente errada, `get_then_set`: ela pede o valor ao dono e depois manda de volta o valor mais um. Cada mensagem é tratada sozinha, mas dois processos podem ler 41 e os dois gravar 42. É a mesma atualização perdida, um nível acima. A regra é igual em todos os modelos: a operação inteira precisa ser **um** passo indivisível. Com trava, isso é uma seção crítica. Com ator, é uma mensagem.

## O que cada linguagem faz a respeito

- **Go** compila o bug sem aviso. O detector de corrida (`go test -race`, `go build -race`) o encontra em tempo de execução: ele lembra qual goroutine tocou cada endereço e sob qual trava, e denuncia dois acessos sem sincronização em que um é escrita.
- **Rust** se recusa a compilar o bug. Um valor compartilhado por threads precisa ser `Sync`, e um número escrito através de uma referência compartilhada não é. A versão com bug precisa de `UnsafeCell` e de um `unsafe impl Sync` falso para existir, e por isso está marcada como propositalmente errada. Corrida de dados é comportamento indefinido em Rust.
- **Java** compila o bug sem aviso e o JDK não tem detector dinâmico de corrida. A ferramenta usual é estática: o campo declara sua trava com `@GuardedBy("this")` e o plugin de compilador Error Prone aponta todo acesso feito sem essa trava.
- **TypeScript**: workers não compartilham nada por padrão. Uma corrida precisa de um `SharedArrayBuffer`. `Atomics.add` é a correção atômica, e dá para montar um mutex com `Atomics.compareExchange`, `Atomics.wait` e `Atomics.notify`.
- **Elixir**: processos não compartilham memória, então não há corrida de dados para escrever. Corridas de nível mais alto, como `get_then_set`, continuam possíveis.

## Resultados

Saída capturada dos detectores: [race-detector-go.txt](../../../projects/concurrency/counter-race/results/race-detector-go.txt) e [race-detector-java.txt](../../../projects/concurrency/counter-race/results/race-detector-java.txt).

Vazão com 1, 2, 4 e 8 workers: [throughput.md](../../../projects/concurrency/counter-race/results/throughput.md), com a máquina em [results.md](../../../projects/concurrency/counter-race/results/results.md). A principal lição da tabela é que um contador compartilhado fica mais lento com mais workers, não mais rápido: todo núcleo precisa da mesma posição de memória, então eles se revezam.

## Quiz

Tópicos da área `concurrency` que este mini-projeto demonstra: `race-conditions`, `mutexes-and-locks`, `atomics-and-memory-models`, `message-passing-and-channels` e `actor-model-and-beam`.
