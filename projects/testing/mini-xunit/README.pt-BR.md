# mini-xunit

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um framework de testes construído do nada, duas vezes: uma em Python e uma em TypeScript. Caso de teste, suíte, resultado, set-up e tear-down, descoberta de arquivos de teste, um relatório e um código de saída, em cerca de 300 linhas por linguagem, comentários incluídos. Nenhuma biblioteca de testes é usada em nenhuma das duas (nem pytest, nem unittest, nem `bun:test`): o framework é testado por ele mesmo. Depois de lê-lo, `setUp`, "fixture nova" e "a execução saiu com 1" deixam de ser mágica.

Código: MP-TEST-5. Explicação completa: [docs/pt/testing/mini-xunit.md](../../../docs/pt/testing/mini-xunit.md).

## Tópicos do quiz que ele demonstra

- `testing` / `unit-tests-isolation`: fixtures, set-up e tear-down, uma fixture nova por teste, como um executor coleta os resultados, por que um teste que falha não para os outros

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-mini-xunit.sh        # Linux e macOS
./setup-windows-mini-xunit.ps1    # Windows
```

O script roda os autotestes das duas linguagens e depois as duas demos, conferindo que cada demo sai com um código diferente de zero.

## Testes: o framework testa a si mesmo

```sh
docker compose run --rm python-test    # ruff + bootstrap + python -m mini_xunit selftest
docker compose run --rm ts-test        # tsc + bootstrap + bun run src/cli.ts selftest
```

Cada um imprime `bootstrap: ok` e `24 run, 0 failed`. Os 24 testes de cada linguagem são casos de teste escritos com o framework e encontrados pela descoberta dele.

Um framework que testa a si mesmo tem um problema de bootstrap: se ele engolisse as falhas, os próprios testes pareceriam todos verdes. Então cada linguagem roda antes um arquivo `bootstrap`, que confere as promessas mais básicas com `if` puro (um teste que falha é relatado como falha, um que passa não é, todo teste é contado). Só depois os autotestes são rodados.

## Demo: um teste que falha

```sh
docker compose run --rm python-demo; echo "exit code: $?"
docker compose run --rm ts-demo; echo "exit code: $?"
```

Cada uma roda o framework em `examples/failing`, onde um teste tem uma expectativa errada de propósito. O relatório traz o nome do teste, a mensagem e o local, e o processo sai com 1:

```text
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:28
2 run, 1 failed
exit code: 1
```

```text
FAIL CartTest.testTotalWithDiscount
     expected 100 but got 90
     at examples/failing/cart.xunit.ts:28
2 run, 1 failed
exit code: 1
```

| Código de saída | Significado |
| --- | --- |
| 0 | todos os testes passaram |
| 1 | pelo menos um teste falhou |
| 2 | nenhum teste foi encontrado, ou o comando foi usado errado |

## As partes

| Parte | Papel | Python | TypeScript |
| --- | --- | --- | --- |
| `TestCase` | Um teste: roda o `set_up`, o método nomeado no construtor e depois o `tear_down` em um `finally`. Captura a exceção e a entrega ao resultado | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestResult` | Conta os testes que rodaram e guarda nome, mensagem e local de cada falha | `mini_xunit/core.py` | `src/xunit.ts` |
| `TestSuite` | Uma lista de testes ou de outras suítes. O `from_class` cria uma instância nova por método de teste | `mini_xunit/core.py` | `src/xunit.ts` |
| Asserções | `assert_equal`, `assert_true`, `assert_raises`: um `if` que lança | `mini_xunit/core.py` | `src/xunit.ts` |
| Descoberta | Importa todo `*_xtest.py` ou `*.xunit.ts` de uma pasta e coleta as subclasses de `TestCase` | `mini_xunit/discovery.py` | `src/discovery.ts` |
| Relatório e CLI | Imprime as falhas e o resumo, e transforma o resultado em um código de saída | `mini_xunit/reporter.py`, `__main__.py` | `src/cli.ts` |

## Por que duas linguagens

O design é o mesmo. O que muda é como cada linguagem acha um método pelo nome e onde uma falha aconteceu:

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Chamar um método pelo nome | `getattr(self, name)` | `Reflect.get(this, name)` |
| Listar os métodos de teste de uma classe | `dir(cls)`, que já inclui os métodos herdados | percorrer a cadeia de protótipos com `Object.getOwnPropertyNames` |
| Local de uma falha | `traceback.extract_tb`, uma lista de quadros | interpretar o texto de `error.stack` |
| Testes assíncronos | não suportados: tudo é síncrono | todo passo é aguardado com `await`, então um teste pode ser `async` |
| Carregar um arquivo de teste | `importlib` com uma especificação de módulo | `import()` dinâmico |

## Estrutura

```text
python/mini_xunit/          o framework (núcleo, descoberta, relatório, linha de comando)
python/selftest/            bootstrap, fixtures e os testes escritos com o framework
python/examples/            um carrinho com uma pasta que passa e uma que falha
ts/src/                     o framework (xunit, discovery, cli)
ts/selftest/                bootstrap, fixtures e os testes escritos com o framework
ts/examples/                o mesmo carrinho, passando e falhando
```

Fixados: `python:3.14.8-slim-trixie` com `ruff` 0.16.10 (só lint e formatação), e `oven/bun:1.4.2` com `typescript` 7.0.2 e `@types/bun` 1.4.2 (só checagem de tipos). Nenhuma das implementações tem dependência de execução.

## Limites

É um objeto de estudo. Não tem filtro de testes, execução em paralelo, tempo limite, testes pulados, diferença entre falha e erro, nem diff de valores grandes. Cada um desses é um bom exercício para acrescentar, com um autoteste antes.
