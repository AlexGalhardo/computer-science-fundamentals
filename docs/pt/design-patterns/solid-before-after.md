# SOLID antes e depois

> English version: [docs/en/design-patterns/solid-before-after.md](../../en/design-patterns/solid-before-after.md)

Mini-projeto MP-PAT-2, em [`projects/design-patterns/solid-before-after`](../../../projects/design-patterns/solid-before-after). Ensina o que cada princípio SOLID evita, medindo o custo de um requisito novo em um módulo que quebra o princípio e na sua refatoração.

## O método

Princípios são fáceis de recitar e difíceis de sentir. Este projeto torna cada um observável em três passos:

1. **Um módulo com a violação**, pequeno o bastante para ser lido em um minuto, com testes que documentam o que ele faz.
2. **Uma refatoração** que segue o princípio. Os testes do passo 1 rodam contra ela sem alteração, que é a definição de refatoração: a forma do código muda e o comportamento não.
3. **Um requisito novo**, e o diff que ele exige em cada versão. O princípio é a diferença entre os dois diffs.

Os mesmos cinco módulos existem em TypeScript (`ts/`) e em Java (`java/`).

## Os cinco módulos

### Responsabilidade única: uma nota

`before` é uma função que calcula o imposto, escreve o recibo e monta o registro a gravar. Três assuntos, três grupos de pessoas que podem pedir uma mudança, um lugar só para editar. `after` tem `calculateTotals`, `formatReceipt` e `toRecord`, e um `issueInvoice` que só chama as três em ordem.

O que evita: uma mudança no layout do recibo que quebra o imposto, porque os dois vivem entre as mesmas variáveis locais.

### Aberto-fechado: um desconto

`before` é uma sequência de `if` sobre o tipo de cliente. `after` é uma lista de objetos `DiscountRule` e uma calculadora que percorre a lista que recebeu. Um teste acrescenta uma regra `student` de fora, sem editar `src/`.

O que evita: reabrir código testado a cada caso novo. Repare no limite: a lista de regras padrão ainda é editada em algum lugar quando a aplicação é montada. O princípio não elimina a mudança, ele escolhe onde a mudança cai.

### Substituição de Liskov: contas bancárias

`before` modela uma conta a prazo fixo como subclasse de `Account` cujo `withdraw` lança exceção. Daí em diante nenhum cliente pode confiar em um `Account`, e os dois clientes testam `instanceof FixedTermAccount`. `after` tem dois tipos: todo `Account` tem saldo, e só um `Withdrawable` permite saque. Uma conta a prazo fixo simplesmente não é um `Withdrawable`. A fábrica separa cada conta uma única vez, e os clientes recebem listas cujos tipos já dizem o que pode ser feito.

O que evita: um subtipo que quebra código escrito para o seu tipo base, e os testes de `instanceof` que se espalham para compensar. Um teste lê o código-fonte e os conta: dois em `before`, nenhum em `after`.

### Segregação de interfaces: um catálogo de produtos

`before` tem um único `ProductCatalog` com `find`, `list`, `save` e `remove`. Um catálogo montado sobre o arquivo CSV de um fornecedor não consegue gravar, então seus `save` e `remove` lançam exceção. Um relatório que só lista ainda depende dos quatro métodos, e entregar o catálogo CSV a `increasePrices` compila e falha quando roda. `after` tem `ProductReader` e `ProductWriter`. O catálogo CSV é um leitor, o relatório pede um leitor, e `increasePrices` pede os dois, então o erro vira um erro de compilação.

O que evita: implementadores obrigados a escrever métodos que não conseguem honrar, e clientes que dependem de métodos que nunca chamam. Os dublês de teste mostram isso: quatro métodos para o relatório em `before`, dois em `after`.

### Inversão de dependência: um checkout

`before` tem um `CheckoutService` que cria um cliente SMTP e uma tabela SQL pelo nome. Em `after` o serviço declara do que precisa com suas próprias palavras, `OrderStore` e `CustomerNotifier`, e os recebe pelo construtor. `createCheckout` é a raiz de composição: o único lugar que cita os detalhes concretos e os encaixa nessas interfaces.

O que evita: uma regra de negócio que não pode ser testada nem reaproveitada sem a sua infraestrutura, e que muda quando a infraestrutura muda. As interfaces pertencem à regra, não aos detalhes: essa posse é o que "inversão" quer dizer.

## Custo da mudança

| Princípio | Requisito novo | `before` | `after` |
| --- | --- | --- | --- |
| SRP | o recibo também em HTML | 4 edições dentro da função que guarda a regra de imposto | 1 função nova, nada editado |
| OCP | estudantes ganham 15% | a função já testada é editada | 1 regra nova, nada editado |
| LSP | uma conta em custódia que não permite saque | 1 classe nova, a fábrica e todos os clientes | 1 classe nova e a fábrica |
| ISP | o catálogo pode arquivar um produto | a interface, os dois implementadores, todo dublê de teste | a interface de escrita e a classe que grava |
| DIP | confirmar por uma fila de mensagens | a regra de negócio e os testes dela | a raiz de composição |

Os diffs estão no [README](../../../projects/design-patterns/solid-before-after/README.pt-BR.md#custo-da-mudança). São ilustrações e não estão aplicados no repositório, exceto o do aberto-fechado, que um teste executa.

Uma leitura justa da tabela: `after` tem mais tipos e mais linhas do que `before` em todos os módulos. Esse é o preço. Ele se paga onde requisitos como esses realmente chegam, e é desperdício onde nunca chegam.

## O que muda em Java

- **Um método recusado.** `FixedTermAccount.withdraw` lança `UnsupportedOperationException`, a mesma exceção que uma `List` não modificável lança em `add`. As coleções do JDK são um exemplo conhecido dessa concessão.
- **Leitor e escritor.** O TypeScript escreve o parâmetro como `ProductReader & ProductWriter`. Java não tem esse tipo para um parâmetro, e usa um limite genérico: `<C extends ProductReader & ProductWriter> void increasePrices(C catalog, int percent)`. Não é preciso uma terceira interface.
- **Raiz de composição.** Referências a métodos e lambdas (`table::insert`) fazem o papel dos objetos literais da versão em TypeScript.
- **Testes.** Não há biblioteca de testes: `SolidTest` tem um `main`, e `Check` é um arcabouço de 30 linhas. Cada suíte é um método que recebe o módulo como função e é chamado duas vezes.

## Como rodar

```sh
cd projects/design-patterns/solid-before-after
docker compose run --rm ts-test      # testes em TypeScript
docker compose run --rm java-test    # testes em Java
docker compose run --rm ts-demo      # mesma chamada nas duas versões, respostas comparadas
```

Construir a imagem Java executa `gradle spotlessCheck testClasses`: Spotless 8.10.3 com google-java-format, e `javac -Xlint:all -Werror`. Esse passo precisa de rede uma vez, para baixar o plugin. Todo contêiner roda com `network_mode: none`.

## Critérios de aceite

| Item | Critério | Onde é verificado |
| --- | --- | --- |
| MP-PAT-2.1 | um módulo com a violação por princípio, com testes que documentam o comportamento atual | blocos `before` de `ts/tests/*.test.ts`, linhas `* before` de `SolidTest` |
| MP-PAT-2.2 | os mesmos testes passam depois de cada refatoração | a mesma função chamada com `after` em cada arquivo |
| MP-PAT-2.3 | o README mostra, por princípio, o diff exigido por um requisito novo antes e depois | seção "Custo da mudança" dos dois READMEs |

## Tópicos do quiz relacionados

`design-patterns` / `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion`.
