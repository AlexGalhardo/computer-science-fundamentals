# Mini xUnit do zero (MP-TEST-5)

> English version: [docs/en/testing/mini-xunit.md](../../en/testing/mini-xunit.md)

Mini-projeto: [`projects/testing/mini-xunit`](../../../projects/testing/mini-xunit/README.pt-BR.md). Tópico do quiz: `unit-tests-isolation`.

## O conceito

Quase todo framework de testes em uso (JUnit, pytest, NUnit, o executor do Bun) descende de um design pequeno, chamado xUnit. Ele tem quatro partes:

```
                      +--------------+
   descoberta ----->  |  TestSuite   |  uma lista de coisas que sabem rodar
                      +--------------+
                        | run(result)          para cada teste:
                        v
                      +--------------+        1. result.test_started()
                      |  TestCase    |        2. set_up()            monta a fixture
                      |  (um teste)  |        3. o método de teste   pode lançar
                      +--------------+        4. tear_down()         sempre, em um finally
                        | registra               5. em exceção: result.test_failed(...)
                        v
                      +--------------+
                      |  TestResult  |  -> relatório -> código de saída
                      +--------------+
```

O mini-projeto constrói isso em Python e em TypeScript sem nenhuma biblioteca de testes, e testa o resultado com ele mesmo.

## Três ideias que valem o projeto inteiro

**1. Um teste é um objeto, e o nome dele é o nome de um método.** `WasRun("test_method")` é um teste. O `run` procura o método pelo nome em tempo de execução (`getattr` em Python, `Reflect.get` em TypeScript) e o chama. É por isso que uma classe pode guardar vários testes, e que um framework consegue listá-los: ele pede à classe todos os métodos cujo nome começa com `test`.

**2. A ordem set-up, teste, tear-down é fixada pelo framework, não pelo teste.** O `run` é um template method:

```python
result.test_started()
try:
    self.set_up()
    try:
        method()
    finally:
        self.tear_down()
except Exception as error:
    result.test_failed(self.label(), error)
```

Cada linha tem uma consequência:

- O `tear_down` fica em um `finally`, então a limpeza acontece mesmo quando o teste falha.
- O `tear_down` fica dentro do `try` que começa depois do `set_up`, então ele não roda quando o próprio `set_up` falhou: não há o que limpar.
- A exceção é capturada e registrada, nunca relançada. Um teste que falha não consegue parar os que vêm depois.

**3. Uma fixture nova por teste.** O `TestSuite.from_class` cria **uma instância nova para cada método de teste**. Atributos definidos por um teste não existem no seguinte. É daí que vem o isolamento entre testes, e é por isso que estado guardado em variáveis de classe ou de módulo o quebra.

## Asserções, local e código de saída

Uma asserção é um `if` que lança uma exceção com uma mensagem que diz o que era esperado e o que chegou.

O **local** de uma falha é tirado da pilha: o quadro mais profundo que não está dentro do framework. Sem esse filtro toda asserção que falha apontaria para a linha do próprio `assert_equal`.

O **código de saída** é o que scripts e CI leem: 0 para verde, 1 para vermelho, e 2 quando nenhum teste foi encontrado, porque uma execução com zero testes não pode parecer sucesso.

```
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:25
2 run, 1 failed
```

## Como um framework consegue testar a si mesmo

Os autotestes são casos de teste do framework, sobre o framework. O objeto de cada teste é **outro caso de teste**, rodado à mão com o seu próprio `TestResult`:

```python
def test_failing_test_is_counted_as_failed(self) -> None:
    WasRun("test_broken_method").run(self.result)   # o teste de dentro falha, de propósito
    self.assert_equal(self.result.summary(), "1 run, 1 failed")
```

A falha de dentro fica em `self.result` e não chega à execução de verdade. O `WasRun` escreve o que aconteceu com ele em uma string `log`, então a ordem `set_up test_method tear_down` pode ser afirmada.

Há uma armadilha. Se o framework engolisse as falhas, todos os testes dele ficariam verdes. Então um arquivo `bootstrap` roda antes e confere, com `if` puro e sem framework nenhum, que um teste que falha é relatado como falha, que um que passa não é, e que os testes são contados. Só depois disso os autotestes merecem confiança.

Os exemplos e as fixtures mostram um segundo detalhe da descoberta: só arquivos que seguem a convenção de nomes são carregados como testes, e só as classes definidas neles. O `WasRun` mora em `fixtures`, fora da convenção, porque o teste quebrado dele não pode ser rodado como um teste de verdade.

## Python e TypeScript lado a lado

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Chamar um método pelo nome | `getattr(self, name)` | `Reflect.get(this, name)` |
| Métodos de teste de uma classe | `dir(cls)` | cadeia de protótipos e `Object.getOwnPropertyNames` |
| Local de uma falha | `traceback.extract_tb` dá quadros estruturados | `error.stack` é texto e precisa ser interpretado |
| Testes assíncronos | não suportados | todo passo é aguardado com `await` |
| Arquivos de teste | `*_xtest.py`, carregados com `importlib` | `*.xunit.ts`, carregados com `import()` |

## Como rodar

```sh
./setup-unix-mini-xunit.sh        # Linux e macOS
./setup-windows-mini-xunit.ps1    # Windows
```

Os autotestes: `docker compose run --rm python-test` e `ts-test`. A execução vermelha: `python-demo` e `ts-demo`, que saem com 1 por projeto.
