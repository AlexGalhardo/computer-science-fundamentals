# Máquina de estados de pedido

> English version: [docs/en/state-machines/order-state-machine.md](../../en/state-machines/order-state-machine.md) · Versión en español: [docs/es/state-machines/order-state-machine.md](../../es/state-machines/order-state-machine.md)

Mini-projeto MP-FSM-1, em [`projects/state-machines/order-state-machine`](../../../projects/state-machines/order-state-machine). Ensina como estados e transições explícitos eliminam situações inválidas. Linguagens: TypeScript e Elixir.

## O problema das flags

Um jeito comum de guardar a situação de um pedido é um booleano por fato: `isPaid`, `isShipped`, `isDelivered`, `isCancelled`, `isRefunded`. Cinco booleanos podem ser combinados de 2^5 = 32 maneiras, e o negócio só conhece 6 situações. As outras 26 combinações, como "cancelado e entregue", não significam nada, mas o banco de dados as grava sem reclamar. Toda função que lê o pedido precisa então se defender delas.

Uma máquina de estados inverte isso. O pedido tem **um** campo de estado com um conjunto fechado de valores, e as mudanças permitidas estão listadas em **uma** tabela. O que não está na tabela não acontece.

## A máquina

Estados: `created`, `paid`, `shipped`, `delivered`, `cancelled`, `refunded`. Eventos: `pay`, `ship`, `deliver`, `cancel`, `refund`.

| estado | pay | ship | deliver | cancel | refund |
| --- | --- | --- | --- | --- | --- |
| created | paid | - | - | cancelled | - |
| paid | - | shipped | - | - | refunded |
| shipped | - | - | delivered | - | - |
| delivered | - | - | - | - | refunded |
| cancelled | - | - | - | - | - |
| refunded | - | - | - | - | - |

A tabela é uma função parcial de (estado, evento) para o próximo estado. Há 6 × 5 = 30 pares: 6 estão definidos e 24 são rejeitados. `cancelled` e `refunded` têm linhas vazias, então são estados terminais. As decisões de negócio ficam visíveis na tabela: um pedido só pode ser cancelado antes do pagamento, depois do pagamento o caminho de volta é o reembolso, e um pacote em trânsito não pode ser cancelado nem reembolsado até ser entregue.

A tabela fica em [`machine.json`](../../../projects/state-machines/order-state-machine/machine.json), e as duas implementações leem esse mesmo arquivo.

## Regras como dados, mecanismo como código

A implementação em TypeScript separa duas coisas:

- **As regras** são dados. `machine.json` é validado com Zod ao ser carregado: apenas estados e eventos conhecidos, e no máximo um destino para cada par (estado, evento). Essa última verificação é o que torna a máquina determinística.
- **O mecanismo** é uma única função genérica, `transition(state, event)`, que consulta o par. Ela nunca menciona um estado pelo nome. Devolve `{ ok: true, state }` ou `{ ok: false, reason }`, então quem chama não consegue usar o novo estado sem conferir se ele existe, e um evento rejeitado não altera nada.

Conduzir um pedido por n eventos custa n consultas, qualquer que seja o número de estados. É assim que um autômato finito determinístico executa.

Estados e eventos também são tipos fechados do TypeScript. `labels.ts` tem um `switch` sobre os estados que termina em uma verificação de exaustividade: acrescentar um estado à lista e esquecê-lo ali é um erro de compilação, e não uma surpresa em produção.

## A mesma tabela em Elixir

A lição muda em Elixir, e por isso o mini-projeto tem uma segunda linguagem. O módulo lê `machine.json` em tempo de compilação e escreve uma cláusula de função por linha:

```elixir
def transition(:created, :pay), do: {:ok, :paid}
def transition(:created, :cancel), do: {:ok, :cancelled}
# ...uma cláusula por linha da tabela...
def transition(state, event), do: {:error, {:invalid_transition, state, event}}
```

A consulta é feita por casamento de padrões: as cláusulas são testadas de cima para baixo, e a cláusula genérica no fim transforma qualquer outro par em um erro explícito. A ordem das cláusulas importa. O texto digitado na linha de comando é comparado com os nomes de evento conhecidos e nunca é convertido em um átomo novo.

## Testes gerados a partir da tabela

O teste principal não é uma lista de casos escritos à mão. É um laço sobre todos os pares (estado, evento):

- os 6 pares da tabela devem dar certo e chegar ao destino da tabela;
- os outros 24 devem ser rejeitados e deixar o pedido no mesmo estado.

Um estado novo ou um evento novo acrescenta seus casos positivos e negativos sem que ninguém os escreva. Um teste extra fixa os números 30, 6 e 24, para que uma mudança acidental na tabela apareça na revisão.

## O diagrama não fica desatualizado

[`diagram.md`](../../../projects/state-machines/order-state-machine/diagram.md) contém um diagrama de estados em Mermaid e a tabela acima. Ele é gerado a partir de `machine.json` por um comando e versionado, para poder ser lido no GitHub. Um teste compara o arquivo versionado com o que o gerador produz e falha quando eles diferem.

A implementação em Elixir renderiza o mesmo texto por conta própria e tem o mesmo teste. Se as duas linguagens discordassem sobre a tabela, um dos dois testes falharia, então o arquivo também prova que ambas implementam a mesma máquina.

## Como rodar

```sh
./setup-unix-order-state-machine.sh        # Linux e macOS
./setup-windows-order-state-machine.ps1    # Windows
```

O único requisito é o Docker. O script constrói as imagens, roda os testes e roda a demonstração: um pedido completo (`pay`, `ship`, `deliver`) e um pedido em que `deliver` chega antes de `ship` e é rejeitado.

```sh
docker compose run --rm ts-demo bun run order pay pay       # um pagamento duplicado é rejeitado
docker compose run --rm elixir-demo mix order pay refund    # pago, depois reembolsado (terminal)
docker compose run --rm ts-diagram                          # regenera diagram.md
```

## O que fica de fora

A máquina é uma função pura. Um sistema real também precisa gravar o estado e sobreviver a concorrência e a falhas: duas requisições que leem o mesmo estado precisam de uma atualização condicional atômica, e uma transição com efeito externo, como cobrar um cartão, precisa que esse efeito seja idempotente. Guardas, ações de entrada e de saída e estados hierárquicos também não são usados. Esses assuntos são cobertos pelo quiz.

## Quiz

O mini-projeto é referenciado pelas questões da área `state-machines` que ele demonstra, nos tópicos `states-transitions-events-actions`, `deterministic-finite-automata` e `state-machines-in-software`.
