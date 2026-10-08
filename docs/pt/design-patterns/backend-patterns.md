# Padrões de projeto no back-end

> English version: [docs/en/design-patterns/backend-patterns.md](../../en/design-patterns/backend-patterns.md)

Mini-projeto MP-PAT-1, em [`projects/design-patterns/backend-patterns`](../../../projects/design-patterns/backend-patterns). Ensina qual dor cada um de dez padrões de projeto remove, mostrando primeiro o desenho com defeito.

## Como ler

Um padrão é uma resposta com nome para um problema que sempre volta. Aprender a resposta sem o problema produz código cheio de padrões de que ninguém precisava. Por isso cada pasta de `ts/src/` tem dois arquivos:

- `before.ts`: um desenho que funciona e dói. O comentário do cabeçalho diz onde dói.
- `after.ts`: o mesmo comportamento, com o padrão.

Os testes em `ts/tests/` rodam os dois. O bloco `before` de cada arquivo registra o defeito com uma asserção, então o defeito é um fato e não uma opinião.

## Os dez padrões

| Padrão | Tipo | A dor em `before.ts` | O que `after.ts` muda |
| --- | --- | --- | --- |
| Strategy | comportamental | um ramo por modalidade de frete; uma modalidade nova exige editar a função | cada modalidade é um objeto com a mesma interface, e uma nova é escrita em qualquer lugar |
| Observer | comportamental | o pedido chama todas as reações ao próprio pagamento | o pedido publica um evento; as reações se inscrevem |
| Command | comportamental | cada operação fica dividida entre um método e um ramo de `undo` | cada operação é um objeto que sabe se executar e se reverter |
| State | comportamental | o status é testado em todo método | cada status é um objeto que responde a todas as operações |
| Factory | criacional | a decisão de qual classe criar está copiada, e uma cópia está desatualizada | uma tabela toma a decisão, e o compilador confere se ela está completa |
| Builder | criacional | sete parâmetros posicionais, sem validação entre campos | etapas com nome, e `build` recusa uma requisição incoerente |
| Singleton | criacional | **ele é o desenho com defeito** | uma classe comum, injetada |
| Adapter | estrutural | a regra de negócio fala o vocabulário do fornecedor | a regra é dona de um contrato, e uma classe pequena por fornecedor traduz |
| Decorator | estrutural | uma subclasse por combinação de recursos | um embrulho por recurso, combinados na montagem |
| Repository | arquitetural | o caso de uso escreve SQL | o caso de uso enxerga uma coleção, e o armazenamento fica atrás de uma interface |

## Detalhes que os testes mostram

**Strategy.** O teste acrescenta uma estratégia `drone` dentro do arquivo de teste. Nada em `src/` muda: é o princípio aberto-fechado visto de fora.

**Observer.** O barramento publica sobre uma fotografia da sua lista. Um ouvinte que cancela a própria inscrição durante a entrega não faz o seguinte ser pulado, e um ouvinte inscrito durante a entrega espera o próximo evento. Cada ouvinte fica isolado, então um que lança exceção não interrompe os outros, e o erro volta para quem publicou. Inscrever devolve a função que cancela, porque um ouvinte que vive menos que o barramento nunca seria coletado de outra forma.

**Factory.** No desenho com defeito, `welcome` aceita o canal push e `orderShipped` não. A versão com fábrica tipa sua tabela como `Record<Channel, ...>`, então acrescentar um canal à lista sem um criador é um erro de compilação.

**Adapter.** Dois fornecedores inventados fazem o mesmo trabalho com nomes de método, unidades (unidades de moeda contra centavos) e respostas diferentes. A regra é testada com os dois adaptadores e com um objeto simples, sem fornecedor nenhum.

**Decorator.** Com dois recursos, a herança já pede três classes e repete o código do cache; com n recursos pede 2ⁿ − 1. A ordem dos embrulhos faz parte do comportamento: `Logged` por fora registra toda chamada, `Cached` por fora registra só as chamadas que chegam ao armazenamento. Um decorador é um subtipo do que embrulha, então o mesmo contrato (uma leitura depois de uma escrita devolve o que foi escrito) roda contra todas as combinações.

**Repository.** O dublê de teste do desenho com defeito precisa reconhecer três textos SQL exatos. A versão com o padrão testa a mesma regra com um `Map` atrás de uma interface.

**Command.** O histórico tem duas pilhas. Desfazer reverte primeiro o comando mais recente, e executar um comando novo esvazia a pilha de refazer. O teste acrescenta um comando `DoubleQuantity` sem editar o carrinho nem o histórico.

**State.** Uma tabela de transições é escrita no teste, e os dois desenhos precisam obedecê-la: 12 casos cada (4 status × 3 operações). Um último teste lê os dois arquivos-fonte e conta as condicionais sobre o status: três em `before.ts`, nenhuma em `after.ts`.

**Builder.** `build` é a única porta: um POST sem corpo, um GET com corpo e um tempo limite não positivo são recusados ali. O produto é congelado e seus cabeçalhos são uma cópia, então um builder que continua em uso não consegue alterar uma requisição já entregue.

## Singleton, e por que evitá-lo

Um Singleton une duas decisões: existe uma única instância, e ela é alcançável de qualquer lugar. A primeira costuma ser legítima. A segunda é uma variável global.

Em `singleton/before.ts`, `RateLimiter` tem um construtor que recebe só um limite. Parece independente. Dentro de `allow` ele chama `RequestCounter.getInstance()`, e assim dois limitadores que nunca foram apresentados um ao outro contam sobre os mesmos números. Os testes mostram isso duas vezes:

1. Três chamadas pelo limitador `login` fazem a primeira chamada por um limitador `search` recém-criado ser recusada.
2. O teste seguinte cria um limitador novo e é recusado de imediato, porque o estado sobreviveu do teste anterior. Esse teste só passa quando roda depois do primeiro.

`singleton/after.ts` mantém a classe e descarta o padrão. `RequestCounter` é uma classe comum, e o limitador a recebe pelo construtor. Limitadores com contadores próprios são independentes, um contador novo começa do zero em cada teste, e "uma única instância" continua disponível como decisão visível: `createApp`, a raiz de composição, entrega o mesmo contador a `login` e a `passwordReset` de propósito.

## Como rodar

```sh
cd projects/design-patterns/backend-patterns
docker compose run --rm ts-test    # testes
docker compose run --rm ts-demo    # um cenário por padrão, nos dois desenhos
```

Não há dependência nem rede: a imagem é `oven/bun:1.4.2` e os dois serviços rodam com `network_mode: none`.

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-PAT-1.1 | Strategy, Observer, Factory, Adapter e Decorator têm, cada um, a versão com defeito, a versão com o padrão e testes | `ts/src/<padrão>/before.ts`, `after.ts`, `ts/tests/<padrão>.test.ts` |
| MP-PAT-1.2 | Repository, Command, State e Builder têm a mesma estrutura | mesmos caminhos |
| MP-PAT-1.3 | um teste mostra o estado compartilhado escondido, e a versão injetada o remove | `ts/tests/singleton.test.ts` |

## Tópicos do quiz relacionados

`design-patterns` / `creational-patterns`, `structural-patterns`, `behavioural-patterns`, `repository-dependency-injection`.
