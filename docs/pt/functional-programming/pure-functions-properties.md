# Funções puras e testes baseados em propriedades

> English version: [docs/en/functional-programming/pure-functions-properties.md](../../en/functional-programming/pure-functions-properties.md) · Versión en español: [docs/es/functional-programming/pure-functions-properties.md](../../es/functional-programming/pure-functions-properties.md)

Mini-projeto MP-FP-1, em [`projects/functional-programming/pure-functions-properties`](../../../projects/functional-programming/pure-functions-properties). Ensina por que código puro é fácil de testar e o que os testes baseados em propriedades encontram. Linguagens: TypeScript e Elixir.

## Duas versões de uma regra

A regra: somar os itens de um pedido e aplicar o cupom se ele não tiver vencido.

A versão impura pergunta ao sistema que horas são e mantém um contador de recibos fora da função. Ela tem uma **entrada oculta** (o relógio) e uma **saída oculta** (o contador). O mesmo pedido, precificado duas vezes, dá dois resultados diferentes, e um teste de "cupom vencido não dá desconto" teria de substituir o relógio.

A versão pura recebe o instante como segundo argumento:

```ts
priceOrder(order, now) // { subtotalCents, discountCents, totalCents }
```

Tudo de que ela precisa entra pelos argumentos e tudo o que ela faz está no valor devolvido. Os testes dela constroem valores, chamam a função e comparam, sem mock. A leitura do relógio real vai para `checkoutNow`, uma função de três linhas na borda do programa: a casca imperativa em volta de um núcleo funcional.

Em Elixir o contador oculto fica no dicionário do processo, o mais próximo que a linguagem tem de uma global mutável. A versão pura usa duas cláusulas de função e uma guarda no lugar de um `if`: uma cláusula casa com um cupom ainda válido, a outra pega todo o resto, inclusive a ausência de cupom.

## O que é uma propriedade

Um teste com exemplo diz "para esta entrada, espero esta saída". Uma propriedade diz "para toda entrada, esta regra vale", e uma ferramenta a verifica com centenas de entradas geradas. Três tipos de regra aparecem aqui:

| Tipo | Regra | Onde |
| --- | --- | --- |
| Ida e volta | `decode(encode(text)) == text` | `codec` |
| Idempotência | `normalize(normalize(name)) == normalize(name)` | `normalize` |
| Invariante | `0 <= desconto <= subtotal` e `total == subtotal - desconto` | `checkout` |
| Invariante | o relatório completo soma o mesmo que as linhas pagas | `pipeline` |

Nenhuma dessas regras exige conhecer de antemão a saída esperada. É isso que permite que as entradas sejam aleatórias.

## A biblioteca, em três partes

A stack do repositório não tem biblioteca de testes de propriedades, então o mini-projeto escreve uma pequena (`prop.ts`, `prop.ex`). Ela é curta o bastante para ser lida de uma vez.

**Um gerador aleatório puro.** O estado do gerador é um número de 32 bits, a semente. `randomInt(seed, min, max)` devolve o número e a próxima semente. Nada fica guardado em lugar algum, então a mesma semente repete exatamente a mesma execução. É a forma padrão de manter a aleatoriedade fora da parte impura de um programa.

**Geradores que sabem reduzir.** Um gerador são duas funções: `generate(seed)` produz um valor, e `shrink(value)` lista versões mais simples dele, a mais simples primeiro. Inteiros são reduzidos em direção a zero cortando a distância pela metade. Listas são reduzidas removendo metades, depois elementos, depois reduzindo um elemento. Tuplas são reduzidas uma posição por vez.

**O laço `check`.** Ele gera valores até que um torne a propriedade falsa. Então reduz: pega o primeiro candidato mais simples que ainda falha e recomeça a partir dele, até nenhum candidato falhar. O que sobra é um mínimo local, em geral a menor entrada que uma pessoa teria escrito.

A redução executa a propriedade muitas outras vezes, em entradas escolhidas depois da falha. Só funciona porque a propriedade é pura: uma segunda execução com a mesma entrada não pode dar outra resposta.

## O erro plantado

O codec é a codificação run-length: `aaabcc` vira `3a1b2c`. O decodificador com erro lê a contagem com `\d` em vez de `\d+`.

Os cinco exemplos passam no decodificador com erro. São os exemplos que uma pessoa escreve: textos curtos, um único caractere, o texto vazio, nove caracteres iguais. Nenhum tem uma sequência de dez.

A propriedade de ida e volta falha:

```text
original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
shrunk in 6 steps to:   "aaaaaaaaaa"
encode -> "10a", buggy decode -> ""
```

O contraexemplo reduzido, dez vezes `a`, aponta direto para a causa: algo dá errado quando a contagem precisa de dois dígitos.

### O gerador importa

Um texto de letras aleatórias quase nunca contém dez letras iguais seguidas. Com um alfabeto de três letras, a chance em uma dada posição é de cerca de 1 em 20.000. Uma propriedade alimentada com textos assim passaria e não provaria nada.

O gerador usado aqui, `runString`, monta um texto a partir de sequências: sorteia uma letra e um comprimento de 1 a 12, várias vezes. Sequências longas passam a ser comuns. Escolher o que o gerador produz faz parte de escrever a propriedade, do mesmo modo que escolher os exemplos faz parte de escrever um teste com exemplos.

## Composição e o pipeline

O relatório de vendas tem cinco etapas: manter os pedidos pagos, calcular o total de cada linha, somar os totais por categoria, classificá-los, pegar os três primeiros.

Em Elixir o operador pipe as escreve na ordem em que acontecem:

```elixir
orders
|> only_status("paid")
|> line_totals()
|> totals_by_category()
|> ranked()
|> Enum.take(top)
```

TypeScript não tem operador pipe, então o mini-projeto define uma função `pipe`, que é uma redução sobre uma lista de funções:

```ts
pipe(onlyStatus("paid"), lineTotals, totalsByCategory, ranked, take(top))
```

`onlyStatus("paid")` e `take(top)` estão em forma curried: a primeira chamada fixa uma configuração e devolve a função de um argumento que encaixa na cadeia. O tipo de `pipe` exige que a saída de cada etapa seja a entrada da seguinte, então uma etapa no lugar errado é um erro de compilação.

As duas implementações leem os mesmos pedidos e o mesmo relatório esperado de `cases.json`. Duas categorias empatam em 6000 centavos, e a classificação desempata pelo nome para que o resultado não dependa da ordem da entrada.

## O que experimentar

- Troque `\d` por `\d+` no decodificador com erro e rode a demo de novo: a propriedade passa.
- Troque `runString("abc", 6, 12)` por `runString("abc", 1, 9)`, uma única sequência de no máximo 9 caracteres: a propriedade passa no decodificador com erro, porque o gerador não consegue mais montar a entrada que falha.
- Remova o desempate de `ranked` e veja qual teste percebe.
- Rode `check` com outra semente e compare o contraexemplo original e o reduzido.

## Limites

A biblioteca é uma versão didática. Ela não tem um parâmetro de tamanho que cresce com a execução, nem combinadores de geradores como `map` e `filter` com redução através deles, e a redução de textos tem um candidato escrito para este codec (trocar todas as ocorrências de uma letra pela primeira letra do alfabeto). Projetos reais devem usar a fast-check em TypeScript ou a StreamData em Elixir.

## Tópicos do quiz relacionados

Área `functional-programming`: `pure-functions`, `higher-order-functions`, `composition-currying`, `side-effects`, `elixir-typescript-style`.
