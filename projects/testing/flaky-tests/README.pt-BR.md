# flaky-tests

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um laboratório de testes intermitentes. Quatro testes falham parte das vezes sem nenhuma mudança no código, cada um por um dos motivos de sempre: o relógio real, a ordem de resultados concorrentes, estado compartilhado entre testes e uma chamada de rede real. Ao lado de cada um está a versão corrigida: um relógio falso, uma ordem determinística, isolamento, uma rede com stub. Cada teste intermitente é rodado 50 vezes e falha ao menos uma. Cada teste corrigido é rodado 500 vezes e nunca falha.

Código: MP-TEST-4. Explicação completa: [docs/pt/testing/flaky-tests.md](../../../docs/pt/testing/flaky-tests.md).

> **Intermitente de propósito.** Os arquivos em `ts/tests/flaky/` são intermitentes por projeto e nunca fazem parte da execução normal dos testes. Eles só são rodados pelo serviço `flaky`, que espera que falhem.

## Tópicos do quiz que ele demonstra

- `testing` / `flaky-tests`: o que é um teste intermitente, as causas de sempre, a correção de cada uma, por que uma retentativa esconde o problema
- `testing` / `test-doubles`: um relógio falso como dublê do tempo, um stub no lugar de uma chamada HTTP
- `testing` / `unit-tests-isolation`: uma fixture nova por teste, testes que não dependem da ordem

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-flaky-tests.sh        # Linux e macOS
./setup-windows-flaky-tests.ps1    # Windows
```

O script roda os testes determinísticos, depois as duas execuções repetidas abaixo, e remove os contêineres no fim. Leva cerca de meio minuto depois do build.

## Testes

```sh
docker compose run --rm ts-test
```

Checagem de tipos mais os 16 testes determinísticos (os corrigidos e os unitários), em ordem aleatória, em um contêiner sem rede.

## Demo: repetir até aparecer

```sh
docker compose run --rm flaky    # cada teste intermitente 50 vezes: cada um precisa falhar ao menos uma vez
docker compose run --rm fixed    # cada teste corrigido 500 vezes: nenhum pode falhar
docker compose down -v --remove-orphans
```

Cada execução é um processo novo de `bun test --randomize`. Os relatórios são gravados em [`results/flaky-runs.md`](results/flaky-runs.md) e [`results/fixed-runs.md`](results/fixed-runs.md). Última execução:

| Causa | Teste intermitente, 50 execuções | Correção | Teste corrigido, 500 execuções |
| --- | --- | --- | --- |
| Tempo | 11 falhas (22%) | relógio falso | 0 falhas |
| Dependência de ordem | 37 falhas (74%) | ordem determinística | 0 falhas |
| Estado compartilhado | 42 falhas (84%) | isolamento | 0 falhas |
| Rede real | 11 falhas (22%) | rede com stub | 0 falhas |

A contagem de falhas dos testes intermitentes muda a cada execução. Esse é o ponto.

## As quatro causas

| Causa | O que dá errado | Onde | A correção |
| --- | --- | --- | --- |
| Tempo | O teste lê o relógio real uma segunda vez e espera o mesmo milissegundo que o código viu. Quando o relógio avança no meio, os valores diferem em 1 | `src/session.ts`, `tests/flaky/time.test.ts` | O relógio é um parâmetro. O teste passa um `FakeClock` e o move à mão |
| Dependência de ordem | Consultas concorrentes terminam em ordem variável, o código as devolve na ordem de chegada e o teste espera uma ordem | `src/prices.ts`, `tests/flaky/order.test.ts` | O código mantém a ordem do pedido (`Promise.all`), ou o teste compara o conteúdo ordenado quando a ordem não importa |
| Estado compartilhado | Três testes usam um registro de módulo e só passam na ordem em que foram escritos (1 de 6 ordens) | `src/invoices.ts`, `tests/flaky/shared-state.test.ts` | O `beforeEach` monta um registro novo para cada teste |
| Rede real | O teste chama um serviço HTTP real que falha uma requisição em cada quatro | `src/rates.ts`, `tests/flaky/network.test.ts` | A função HTTP é um parâmetro. O teste passa um stub, e o caminho de erro passa a ser testável sob encomenda |

Nas quatro a correção tem a mesma forma: o teste deixa de depender de algo que não controla, e esse algo vira uma entrada explícita.

## "Ao menos uma vez em 50" é garantido?

Não, e não tem como ser: é uma probabilidade. Com uma taxa de falha `p` por execução, a chance de 50 execuções verdes seguidas é `(1 - p)^50`. Para o teste menos intermitente daqui (cerca de 20%) isso dá `0,8^50`, cerca de 1 em 70 000. A mesma conta mostra por que um teste intermitente machuca: a 2% por execução, uma suíte com 50 testes assim fica vermelha em 64% das execuções.

## Segurança

A "rede real" é o serviço `unstable-api` deste arquivo compose, em uma rede `internal`, sem porta publicada. As falhas dele são simuladas com um número aleatório. O `rates.ts` recusa qualquer endereço que não seja `localhost`, `127.0.0.1` ou `unstable-api`. Os serviços `fixed` e `ts-test` não têm rede nenhuma.

## Estrutura

```text
ts/src/session.ts          tempo: sessões, Clock, FakeClock
ts/src/prices.ts           ordem: ordem de chegada contra ordem do pedido
ts/src/invoices.ts         estado compartilhado: um registro, a fábrica dele e um singleton
ts/src/rates.ts            rede: um cliente HTTP com transporte injetável
ts/src/unstable-api.ts     o serviço local que falha uma requisição em cada quatro
ts/src/repeat.ts           roda cada arquivo de teste N vezes e conta as falhas
ts/tests/flaky/            os quatro testes intermitentes
ts/tests/fixed/            as quatro correções
ts/tests/unit/             testes do serviço e do plano de repetição
```

Dependências, fixadas: `zod` 4.6.5 (validação do corpo HTTP e do argumento do script), `typescript` 7.0.2 e `@types/bun` 1.4.2, sobre `oven/bun:1.4.2`.
