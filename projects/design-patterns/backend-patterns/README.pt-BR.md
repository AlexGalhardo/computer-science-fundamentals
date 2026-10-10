# backend-patterns

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Dez padrões de projeto em situações de back-end nas quais eles se pagam. Cada padrão tem uma pasta com **o desenho com defeito** (`before.ts`), **a versão com o padrão** (`after.ts`) e testes que rodam os dois, para que o problema apareça antes da solução. Ensina **qual dor cada padrão remove** e, no caso do Singleton, por que o padrão é a dor.

Explicação completa: [docs/pt/design-patterns/backend-patterns.md](../../../docs/pt/design-patterns/backend-patterns.md).

## Tópicos do quiz que ele demonstra

- `design-patterns` / `creational-patterns`: Factory, Builder, Singleton e seu estado compartilhado escondido.
- `design-patterns` / `structural-patterns`: Adapter e Decorator (ordem de empilhamento, o contrato que um decorador precisa manter).
- `design-patterns` / `behavioural-patterns`: Strategy, Observer, Command e State.
- `design-patterns` / `repository-dependency-injection`: Repository, injeção pelo construtor e a raiz de composição.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-backend-patterns.sh        # Linux e macOS
./setup-windows-backend-patterns.ps1    # Windows
```

O script constrói a imagem, roda os testes e roda a demo.

## Estrutura

| Caminho | Desenho com defeito (`before.ts`) | Versão com o padrão (`after.ts`) |
| --- | --- | --- |
| `ts/src/strategy/` | uma função com um ramo por modalidade de frete | um objeto por modalidade, escolhido de fora |
| `ts/src/observer/` | o pedido chama todas as reações ao pagamento | um barramento de eventos: as reações se inscrevem |
| `ts/src/factory/` | a decisão de criação copiada em duas funções, uma delas desatualizada | uma tabela tipada decide a classe |
| `ts/src/adapter/` | a regra chama o SDK do fornecedor e devolve os tipos dele | um `PaymentGateway` e um adaptador por fornecedor |
| `ts/src/decorator/` | uma subclasse por combinação de recursos | embrulhos `Logged` e `Cached`, empilhados em qualquer ordem |
| `ts/src/repository/` | o caso de uso escreve SQL | uma interface `UserRepository` e uma implementação em memória |
| `ts/src/command/` | operações como métodos, desfeitas por um `switch` | objetos de comando com `execute` e `undo`, e um histórico com refazer |
| `ts/src/state/` | um campo de status testado em todo método | um objeto de estado por status |
| `ts/src/builder/` | um construtor com sete parâmetros posicionais | etapas com nome e um `build` que valida |
| `ts/src/singleton/` | **o próprio Singleton**: `getInstance()` e estado compartilhado escondido | uma classe comum, injetada, ligada em uma raiz de composição |

`ts/src/demo.ts` é a demo, e `ts/tests/` tem um arquivo de teste por padrão.

TypeScript na imagem fixada `oven/bun:1.4.2`, sem nenhuma dependência: o Bun é o runtime e o executor de testes.

## Testes

```sh
docker compose run --rm ts-test
```

Cada arquivo de teste tem um bloco `before` e um bloco `after`. O bloco `before` prova que o desenho com defeito funciona **e** registra o seu defeito: uma modalidade de frete que não pode ser acrescentada de fora, uma cópia esquecida de uma decisão de criação, uma requisição POST criada sem corpo. O bloco `after` mostra o mesmo comportamento sem o defeito. Onde os dois desenhos precisam se comportar de forma idêntica (State, Decorator), um mesmo contrato roda contra os dois.

O arquivo `tests/singleton.test.ts` é especial: seus dois testes `before` dependem da ordem em que rodam. Isso é proposital. É o estado compartilhado escondido, mostrado por um teste.

## Demo

```sh
docker compose run --rm ts-demo
```

Mostra um cenário por padrão, executado nos dois desenhos:

```text
strategy
  before: throws "unknown shipping kind: drone"
  after:  drone shipping added from outside: total 15300 cents
...
singleton
  before: after 3 logins, the first search is allowed: false
  after:  after 3 logins, the first search is allowed: true
```

Não há dashboard: a lição está no código e nos testes, e a demo é um passeio por eles na linha de comando.
