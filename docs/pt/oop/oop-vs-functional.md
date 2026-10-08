# O mesmo domínio com objetos e com funções

> English version: [docs/en/oop/oop-vs-functional.md](../../en/oop/oop-vs-functional.md)

Mini-projeto MP-OOP-1, em [`projects/oop/oop-vs-functional`](../../../projects/oop/oop-vs-functional). Ele ensina o que muda quando as mesmas regras são escritas com objetos ou com funções. Linguagens: Java, TypeScript e Elixir.

## Um problema, quatro programas

Um carrinho de compras tem linhas, uma lista ordenada de regras de desconto (cupom percentual, cupom de valor fixo, desconto por volume, leve e pague) e uma política de imposto. As regras estão no README do mini-projeto. O carrinho é escrito quatro vezes:

| Estilo | Linguagem | Onde |
| --- | --- | --- |
| Objetos | Java | `java/src/cart/` |
| Objetos | TypeScript | `ts/src/oop/` |
| Funções | TypeScript | `ts/src/functional/cart.ts` |
| Funções | Elixir | `elixir/lib/cart.ex` |

O TypeScript aparece duas vezes de propósito: com a linguagem fixa, toda diferença entre `ts/src/oop` e `ts/src/functional` vem do estilo. O Java mostra o estilo com objetos em uma linguagem construída em torno dele, com tipos nominais, records e modificadores de acesso verificados. O Elixir mostra o estilo funcional em uma linguagem em que ele é o único: não há classe nem forma de alterar um valor no lugar.

As quatro leem [`scenarios.txt`](../../../projects/oop/oop-vs-functional/scenarios.txt), um arquivo de texto simples com 15 cenários, e precisam produzir os mesmos recibos. É esse arquivo que faz de "as mesmas regras" uma afirmação conferida, e não uma intenção.

## Onde fica o estado

Com objetos, o carrinho é uma coisa com identidade. Suas linhas são um campo privado, `add` altera o objeto, e toda variável que se refere ao carrinho enxerga a linha nova. O encapsulamento é o que mantém isso seguro: ninguém de fora da classe consegue tocar na lista, e `lines()` entrega uma cópia (TypeScript) ou uma visão somente leitura (Java).

Com funções, o carrinho é um valor. `addLine(cart, line)` monta um carrinho novo e deixa como estava o que recebeu. Não há o que proteger, porque não há o que possa ser alterado. Montar um carrinho é uma cadeia: cada passo recebe o valor que o passo anterior devolveu.

```ts
// objetos                                  // funções
const cart = new Cart();                    const cart = addLine(emptyCart, line);
cart.add(new CartLine("PEN", 250, 4));      // emptyCart continua vazio
```

Os testes tornam a diferença observável. A versão funcional em TypeScript roda sobre uma entrada profundamente congelada, então uma única escrita em qualquer ponto lançaria exceção. Em Elixir a garantia vem da linguagem, e o teste apenas a mostra.

## Como uma regra é escolhida

Com objetos, cada regra é uma classe que implementa `DiscountRule`. O carrinho percorre a lista e chama `discountCents` e `describe`. Qual código roda é decidido em tempo de execução pela classe de cada objeto: despacho dinâmico. O carrinho nunca cita uma regra concreta.

Com funções, uma regra é um dado com uma etiqueta: `{ kind: "bulk", ... }` em TypeScript, `{:bulk, sku, min, percent}` em Elixir. A função `discountCents` olha a etiqueta e escolhe o ramo: um `switch` em TypeScript, uma cláusula de função por formato em Elixir. Isso é casamento de padrões, e ele faz o trabalho do despacho dinâmico pelo outro lado: a função conhece todas as variantes, em vez de cada variante conhecer o seu código.

## Como um valor inválido é recusado

Com objetos, o construtor valida e lança exceção. `new CartLine("PEN", 250, 0)` nunca retorna, então nenhuma linha inválida existe e nenhuma outra classe confere de novo.

Com funções, dado é só dado, então uma linha inválida pode ser escrita. `price` valida e devolve `{ ok: true, receipt }` ou `{ ok: false, error }` (`{:ok, recibo}` ou `{:error, código}` em Elixir). O erro é um valor, e o tipo obriga quem chama a olhar qual dos dois voltou.

## Qual mudança é barata

"Leve e pague" foi adicionada por último, para medir isso. Com objetos ela é um arquivo novo e nenhuma edição no código de produção existente: o princípio aberto-fechado em ação. Com funções são quatro edições dentro de um arquivo existente: o tipo, a validação, `discountCents` e `describe`.

A mudança oposta tem o custo oposto. Uma operação nova sobre todas as regras é uma função nova nas versões funcionais, e uma edição na interface e nas quatro classes nas versões com objetos. Objetos agrupam o código por variante, funções agrupam o código por operação, e cada um torna barata uma direção de crescimento. Esse é o problema da expressão. A pergunta a fazer a um projeto é qual direção deve crescer.

Quando um caso é esquecido, as versões com objetos não compilam (falta um método na classe). A versão funcional em TypeScript também não compila, graças a uma verificação de exaustividade em cada `switch`. Em Elixir a falha aparece em tempo de execução, então os testes carregam esse peso.

## Comparação medida

`docker compose run --rm compare` conta arquivos, linhas de código e tipos nomeados do código de produção de cada versão e imprime a tabela versionada em `results/comparison.md`. Um teste falha se a tabela e o código discordarem. Os números atuais e a leitura deles estão no [README](../../../projects/oop/oop-vs-functional/README.pt-BR.md#comparação).

Leia os números com cuidado: eles descrevem quatro programas pequenos, não dois paradigmas. As versões com objetos são mais longas principalmente porque dão nome a mais coisas, e nomes também são o que orienta quem lê um sistema grande.

## Como rodar

```sh
./setup-unix-oop-vs-functional.sh        # Linux e macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

Só o Docker é necessário. O script roda os testes das três linguagens, a demo e a comparação.

## Tópicos relacionados do quiz

`oop`: `classes-objects-encapsulation`, `polymorphism-dynamic-dispatch`, `abstraction-interfaces-abstract-classes`, `composition-vs-inheritance`, `oop-across-languages`.
