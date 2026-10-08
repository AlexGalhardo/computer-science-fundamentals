# oop-vs-functional

> English version: [README.md](README.md)

Um carrinho de compras, com descontos, cupons e impostos, escrito quatro vezes: com objetos em Java e em TypeScript, e com funções sobre dados imutáveis em TypeScript e em Elixir. Ele ensina **o que muda quando as mesmas regras são escritas com objetos ou com funções**: onde fica o estado, como uma regra é escolhida (despacho dinâmico ou casamento de padrões), como um valor inválido é recusado (exceção ou valor) e que tipo de mudança é barata em cada estilo.

As quatro implementações leem o mesmo arquivo, [`scenarios.txt`](scenarios.txt), e precisam imprimir os mesmos recibos.

Explicação completa: [docs/pt/oop/oop-vs-functional.md](../../../docs/pt/oop/oop-vs-functional.md).

## O domínio

Os valores são centavos inteiros. Um carrinho tem linhas (produto, preço unitário, quantidade), uma lista ordenada de regras de desconto e uma política de imposto.

| Regra | Exemplo em `scenarios.txt` | Desconta |
| --- | --- | --- |
| Cupom percentual | `rule percent-coupon WELCOME10 10` | 10% do que ainda falta pagar |
| Cupom de valor fixo | `rule fixed-coupon FIVE 500` | 5,00, nunca mais do que ainda falta pagar |
| Desconto por volume | `rule bulk PEN 10 20` | 20% das linhas de PEN com 10 unidades ou mais |
| Leve e pague | `rule take-pay TEE 3 2` | uma TEE grátis a cada grupo completo de 3 |

As regras são aplicadas na ordem em que foram adicionadas, cada uma sobre o que as anteriores deixaram, então a ordem muda o total. O imposto (`tax flat 825` é 8,25%) é cobrado depois dos descontos e arredonda meio centavo para cima.

## Tópicos do quiz que ele demonstra

- `oop` / `classes-objects-encapsulation`: estado privado, um getter que entrega uma cópia, objetos válidos desde o construtor, "tell, don't ask", valores imutáveis.
- `oop` / `polymorphism-dynamic-dispatch`: uma lista de regras atrás de uma interface, cada objeto respondendo à mesma chamada do seu jeito.
- `oop` / `abstraction-interfaces-abstract-classes`: a interface como contrato, e depender de uma abstração em vez de uma classe concreta.
- `oop` / `composition-vs-inheritance`: o carrinho tem uma política de imposto e pode trocá-la em um objeto vivo.
- `oop` / `oop-across-languages`: tipagem estrutural em TypeScript, e o mesmo polimorfismo por casamento de padrões em Elixir (o problema da expressão).

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-oop-vs-functional.sh        # Linux e macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

O script constrói as três imagens, roda os testes das três linguagens, imprime o recibo de cada cenário e imprime a tabela de comparação.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `scenarios.txt` | os cenários de aceitação compartilhados: 10 recibos e 5 recusas |
| `java/src/cart/` | objetos em Java: `Cart`, `CartLine`, a interface `DiscountRule` com quatro classes, a interface `TaxPolicy` com duas |
| `ts/src/oop/` | o mesmo projeto em TypeScript, uma regra por arquivo em `rules/` |
| `ts/src/functional/cart.ts` | funções em TypeScript: tipos somente leitura, uma união de variantes de regra, funções puras |
| `elixir/lib/cart.ex` | funções em Elixir: mapas, tuplas etiquetadas, uma cláusula de função por variante |
| `ts/src/run.ts` | o código cliente das duas versões em TypeScript, lado a lado |
| `ts/src/compare.ts`, `results/comparison.md` | a medição por trás da tabela abaixo |
| `java/src/support/`, `ts/src/scenarios.ts`, `elixir/lib/scenarios.ex` | leitores de `scenarios.txt`, testes e demos (não medidos) |

Imagens: `gradle:9.8.0-jdk25` (Spotless 8.10.3 com google-java-format, usado só para conferir o formato), `oven/bun:1.4.2` e `elixir:1.20.4-otp-28-slim`. Nenhuma implementação depende de biblioteca.

## Testes

```sh
docker compose run --rm java-test
docker compose run --rm elixir-test
docker compose run --rm ts-test
```

- **Cenários compartilhados.** Cada linguagem roda os 15 cenários de `scenarios.txt`. Em TypeScript cada cenário roda duas vezes, uma por estilo.
- **Nenhuma entrada é alterada.** Em TypeScript a versão funcional recebe a entrada profundamente congelada (`Object.freeze` em todos os níveis, então qualquer escrita lançaria exceção) e os argumentos são comparados com uma cópia tirada antes das chamadas. Em Elixir a imutabilidade é da linguagem; o teste mostra o mesmo nome ainda ligado ao mesmo valor depois que quatro funções o "alteraram".
- **O contraste.** Uma segunda referência ao carrinho com objetos enxerga a linha adicionada. O carrinho funcional guardado antes da adição, não.
- **Encapsulamento e polimorfismo.** A lista devolvida pelo carrinho não serve para alterá-lo, e o carrinho aceita uma regra que nunca viu.
- **A tabela está atual.** Um teste falha quando `results/comparison.md` deixa de bater com o código.

A construção da imagem Java também roda `spotlessCheck` e compila com `-Xlint:all -Werror`. A execução em Elixir também confere `mix format --check-formatted`.

## Demo

```sh
docker compose run --rm ts-demo       # todos os recibos, e se os dois estilos concordam
docker compose run --rm java-demo     # os mesmos recibos, pelo Java
docker compose run --rm elixir-demo   # os mesmos recibos, pelo Elixir
```

```
== everything together
  subtotal 160.00
  - 6.00  bulk PEN: 20% off from 10 units
  - 30.00  TEE: take 3, pay 2
  - 12.40  coupon WELCOME10: 10% off
  - 5.00  coupon FIVE: 5.00 off
  tax 8.79
  total 115.39
  objects and functions agree: yes
```

## Comparação

Medida por `docker compose run --rm compare` apenas sobre o código de produção do carrinho: sem testes, sem leitor de cenários, sem comentários, sem linhas em branco. A cópia conferida é [`results/comparison.md`](results/comparison.md).

| Implementação | Arquivos | Linhas de código | Tipos nomeados |
| --- | --- | --- | --- |
| Java, objetos | 13 | 196 | 13 |
| TypeScript, objetos | 8 | 196 | 14 |
| TypeScript, funções | 1 | 136 | 9 |
| Elixir, funções | 1 | 116 | 7 |

Os números descrevem este código, não os paradigmas em geral. O que eles mostram: as versões com objetos gastam suas linhas a mais dando nome às coisas (uma classe e um arquivo por regra, campos privados, construtores), e as versões funcionais mantêm todas as regras de uma operação em um só lugar.

| Pergunta | Objetos (Java, TypeScript) | Funções (TypeScript, Elixir) |
| --- | --- | --- |
| Onde fica o estado? | Dentro do carrinho, privado. `add` altera o objeto | No valor que circula. `addLine` devolve um carrinho novo |
| Como a regra é escolhida? | Despacho dinâmico pela classe do objeto de regra | `switch` sobre `kind` (TypeScript), cláusula de função pela etiqueta (Elixir) |
| Como um valor inválido é recusado? | O construtor lança exceção: o objeto inválido nunca existe | `price` devolve um valor de erro que quem chama precisa conferir |
| **Como se adiciona uma regra nova?** | **Um arquivo novo. Nenhum arquivo de produção existente é editado** | **Nenhum arquivo novo. Um arquivo existente é editado em quatro pontos** |
| Como se adiciona uma operação nova sobre as regras? | A interface e todas as classes de regra são editadas | Uma função nova. Nenhuma função existente é editada |
| Quem acha um caso esquecido? | O compilador: a classe nova não compila sem os dois métodos | TypeScript: a verificação com `never` em cada `switch`. Elixir: um teste, em tempo de execução |

### Adicionar uma regra, medido

"Leve e pague" foi a última regra adicionada. Estas são as mudanças que ela exigiu no código de produção.

Com objetos, um arquivo novo, [`TakePayDiscount.java`](java/src/cart/TakePayDiscount.java) (e [`take-pay-discount.ts`](ts/src/oop/rules/take-pay-discount.ts)), e mais nada:

```diff
+ public final class TakePayDiscount implements DiscountRule {
+   public TakePayDiscount(String sku, int take, int pay) { ... }
+   @Override public int discountCents(List<CartLine> lines, int runningCents) { ... }
+   @Override public String describe() { ... }
+ }
```

Com funções, quatro edições dentro do [`cart.ts`](ts/src/functional/cart.ts) existente (e as mesmas quatro em [`cart.ex`](elixir/lib/cart.ex)):

```diff
  export type Rule =
  	| Readonly<{ kind: "bulk"; sku: string; minQuantity: number; percent: number }>
+ 	| Readonly<{ kind: "take-pay"; sku: string; take: number; pay: number }>;

  function ruleError(rule: Rule): CartErrorCode | undefined {
+ 		case "take-pay":
+ 			return isCount(rule.take, 1) && isCount(rule.pay, 1) && rule.pay < rule.take ? undefined : "invalid-rule";

  export function discountCents(rule: Rule, lines: readonly Line[], runningCents: number): number {
+ 		case "take-pay":
+ 			return lines.filter(...).reduce(...);

  export function describe(rule: Rule): string {
+ 		case "take-pay":
+ 			return `${rule.sku}: take ${rule.take}, pay ${rule.pay}`;
```

Nos dois estilos é preciso mais uma linha onde a regra é criada a partir do arquivo de cenários, que é código de apoio.

A mudança oposta tem o custo oposto. Uma terceira operação sobre as regras, por exemplo `explain`, seria uma função nova nas versões funcionais, e um método novo na interface mais um em cada uma das quatro classes nas versões com objetos. Essa troca é conhecida como o problema da expressão.
