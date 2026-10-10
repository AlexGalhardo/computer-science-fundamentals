# pure-functions-properties

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A mesma pequena base de código em TypeScript e Elixir. Ensina **por que código puro é fácil de testar e o que os testes baseados em propriedades encontram**: uma regra escrita de forma impura e de forma pura, uma propriedade que pega um erro que os testes com exemplos deixam passar e o reduz à menor entrada, e um pipeline montado pela composição de funções puras.

Explicação completa: [docs/pt/functional-programming/pure-functions-properties.md](../../../docs/pt/functional-programming/pure-functions-properties.md).

## As três lições

1. **Versões impura e pura da mesma regra** (`checkout`). A versão impura lê o relógio e mantém um contador oculto, então o mesmo pedido dá respostas diferentes. A versão pura recebe o instante como argumento e é testada com valores comuns, sem mock.
2. **Propriedades** (`prop`, `codec`, `normalize`). Uma propriedade é uma regra que precisa valer para toda entrada, verificada com centenas de entradas geradas: ida e volta (`decode(encode(x)) == x`), idempotência (`normalize(normalize(x)) == normalize(x)`) e invariantes (`0 <= desconto <= subtotal`). A biblioteca de testes de propriedades é escrita aqui, em cerca de 150 linhas por linguagem, sem dependência.
3. **Composição e pipelines** (`pipeline`). Um relatório de vendas em cinco pequenas etapas, unidas com uma função `pipe` em TypeScript e com o operador `|>` em Elixir.

## O erro plantado e o contraexemplo reduzido

`decodeBuggy` (`decode_buggy` em Elixir) lê o comprimento da sequência com `\d` em vez de `\d+`, então entende só um dígito. Os cinco testes com exemplos de [`cases.json`](cases.json) passam nele, porque nenhum exemplo tem uma sequência de 10 ou mais caracteres iguais.

A propriedade de ida e volta falha nele. Com a semente padrão (42), as duas linguagens informam a mesma coisa:

```text
round trip, buggy decoder: FAILED on run 1 (seed 42)
  original counterexample: "aaaaaaaaaccccccccbbbbbbbbbb"
  shrunk in 6 steps to:   "aaaaaaaaaa"
  encode -> "10a", buggy decode -> ""
```

O contraexemplo reduzido é **`"aaaaaaaaaa"`**: dez vezes a letra `a`. É a menor entrada que mostra o erro. Nove caracteres são codificados como `9a` e decodificados corretamente; dez são codificados como `10a`, o decodificador com erro lê o par `0a`, e o texto desaparece. O texto de 27 caracteres que o gerador achou primeiro diz "há algo errado"; o de 10 caracteres diz o quê.

## Tópicos do quiz que ele demonstra

- `functional-programming` / `pure-functions`: pureza, entradas e saídas ocultas, por que uma função pura não precisa de mock, por que um teste de propriedades precisa de uma função pura.
- `functional-programming` / `higher-order-functions`: `map`, `filter` e `reduce` como as etapas do pipeline e dos geradores.
- `functional-programming` / `composition-currying`: `pipe`, o operador `|>`, etapas em forma curried como `onlyStatus("paid")`, os tipos das etapas precisando encaixar.
- `functional-programming` / `side-effects`: núcleo funcional e casca imperativa, o relógio como argumento, o gerador aleatório com estado explícito (a semente).
- `functional-programming` / `elixir-typescript-style`: o mesmo pipeline nos dois estilos.

## Executar

O único requisito é o Docker.

```sh
./setup-unix-pure-functions-properties.sh        # Linux e macOS
./setup-windows-pure-functions-properties.ps1    # Windows
```

O script constrói as duas imagens, roda os testes das duas linguagens e roda a demo das duas.

## Demo

```sh
docker compose run --rm ts-demo
docker compose run --rm elixir-demo
```

Cada demo imprime o checkout impuro e o puro lado a lado, a propriedade encontrando o erro plantado com o contraexemplo original e o reduzido, e o relatório de vendas.

## Testes

```sh
docker compose run --rm ts-test        # 30 testes
docker compose run --rm elixir-test    # verificação de formato e 19 testes
```

As contagens diferem só porque o Bun informa cada exemplo compartilhado como um teste e a suíte em Elixir percorre os exemplos dentro de um teste. As duas suítes leem os exemplos e os resultados esperados do mesmo [`cases.json`](cases.json) e têm as mesmas propriedades. O TypeScript tem um teste a mais, "the input is not modified", que não tem sentido em Elixir, onde os dados não podem ser modificados.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `cases.json` | Exemplos e resultados esperados compartilhados pelas duas linguagens |
| `ts/src/prop.ts`, `elixir/lib/pure_functions_properties/prop.ex` | A biblioteca de testes de propriedades: gerador aleatório puro, geradores com redução, `check` |
| `ts/src/codec.ts`, `elixir/lib/pure_functions_properties/codec.ex` | Codec run-length, com o decodificador correto e o que tem o erro plantado |
| `ts/src/checkout.ts`, `elixir/lib/pure_functions_properties/checkout.ex` | A versão impura, a versão pura e a casca imperativa da mesma regra |
| `ts/src/normalize.ts`, `elixir/lib/pure_functions_properties/normalize.ex` | Um normalizador idempotente |
| `ts/src/pipeline.ts`, `elixir/lib/pure_functions_properties/pipeline.ex` | O pipeline do relatório de vendas |
| `ts/src/cli.ts`, `elixir/lib/mix/tasks/demo.ex` | A demo |

## Observações

- O código marcado como `SEEDED BUG` e `IMPURE` é errado ou impuro de propósito. Ele existe para ser comparado com a versão ao lado.
- Não há dependências. A biblioteca de testes de propriedades é uma versão didática: projetos reais devem usar a fast-check (TypeScript) ou a StreamData (Elixir), que têm muito mais geradores e uma redução melhor.
- As duas linguagens usam a mesma fórmula aleatória e sorteiam na mesma ordem, então a mesma semente dá as mesmas entradas nas duas.
