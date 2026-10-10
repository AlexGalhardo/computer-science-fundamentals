# Laboratório de testes intermitentes (MP-TEST-4)

> English version: [docs/en/testing/flaky-tests.md](../../en/testing/flaky-tests.md) · Versión en español: [docs/es/testing/flaky-tests.md](../../es/testing/flaky-tests.md)

Mini-projeto: [`projects/testing/flaky-tests`](../../../projects/testing/flaky-tests/README.pt-BR.md). Tópicos do quiz: `flaky-tests`, `test-doubles`, `unit-tests-isolation`.

## O conceito

Um **teste intermitente (flaky)** passa e falha no mesmo código. Nada foi alterado entre a execução verde e a vermelha. O resultado depende de algo que o teste não controla.

Isso é pior do que um teste que sempre falha. Um teste vermelho que pode ser "só aquele intermitente" ensina o time a apertar o botão de tentar de novo, e a partir desse dia uma falha real fica igual a ruído. O valor de uma suíte é que vermelho significa "algo quebrou". Um teste intermitente tira esse significado.

Taxas pequenas se somam. Se cada um de `n` testes falha de forma independente com probabilidade `p`, a suíte tem ao menos uma falha com probabilidade `1 - (1 - p)^n`:

| Testes intermitentes na suíte | Taxa de falha de cada um | Execuções vermelhas sem bug real |
| --- | --- | --- |
| 1 | 2% | 2% |
| 10 | 2% | 18% |
| 50 | 2% | 64% |

## As quatro causas no laboratório

Toda causa é uma entrada escondida: algo que afeta o resultado e não está escrito no teste.

### 1. Tempo

```ts
const session = createSession("ana");                        // lê o relógio lá dentro
expect(session.expiresAt).toBe(Date.now() + SESSION_TTL_MS); // lê de novo
```

Duas leituras de um relógio que anda. Elas só concordam quando caem no mesmo milissegundo. Outras formas da mesma causa: testes que falham perto da meia-noite, no fim do mês, em outro fuso horário, ou em uma máquina lenta por causa de um `sleep` fixo.

**Correção: um relógio falso.** O relógio vira um parâmetro (`Clock = () => number`). A produção usa `Date.now`. O teste usa um `FakeClock` que fica parado até `advance(ms)` ser chamado, então "30 minutos depois" não leva tempo real e o limite da regra é testado no milissegundo.

### 2. Dependência de ordem

```ts
await Promise.all(ids.map(async (id) => { prices.push(await lookup(id)); }));
```

Trabalho concorrente termina em uma ordem que depende do tempo. Código que coleta os resultados conforme chegam devolve uma ordem diferente a cada execução. A mesma causa aparece com coleções sem ordem, linhas de banco sem `ORDER BY` e arquivos listados de um diretório.

**Correção: uma ordem determinística.** Se quem chama precisa de uma ordem, o código tem de garanti-la (o `Promise.all` devolve os resultados na ordem dos pedidos). Se não precisa, o teste não deve afirmar nenhuma: compare o conteúdo ordenado.

### 3. Estado compartilhado

Três testes usam um registro de módulo. Cada um depende do que o anterior deixou. Na ordem escrita eles passam. Com `bun test --randomize` só 1 das 6 ordens passa. O mesmo acontece com um banco compartilhado, um arquivo em disco, uma variável global ou uma variável de ambiente.

**Correção: isolamento.** Cada teste recebe uma fixture nova no `beforeEach` e não deixa nada para trás. Testes que passam em qualquer ordem também podem rodar em paralelo.

### 4. Rede real

O teste chama um serviço por HTTP e o serviço tem momentos ruins. Uma falha não diz nada sobre o nosso código.

**Correção: um stub.** A função HTTP é um parâmetro e o teste passa uma que devolve uma `Response` preparada. O caminho de erro, que um serviço saudável não mostraria sob encomenda, ganha o seu próprio teste. O stub não diz se o serviço real ainda responde naquele formato. Um teste de contrato ou de integração separado faz essa pergunta, de propósito e fora da suíte unitária.

No laboratório a "rede real" é um serviço local em uma rede interna do docker-compose. As falhas dele são simuladas, e nada alcança um host de terceiros.

## O que o laboratório mede

| Causa | Teste intermitente, 50 execuções | Teste corrigido, 500 execuções |
| --- | --- | --- |
| Tempo | 11 falhas | 0 falhas |
| Dependência de ordem | 37 falhas | 0 falhas |
| Estado compartilhado | 42 falhas | 0 falhas |
| Rede real | 11 falhas | 0 falhas |

Uma execução, a do README. O `src/repeat.ts` inicia um processo novo de `bun test --randomize` a cada execução, então nada é carregado entre elas, e quebra o build se um teste intermitente nunca falhar ou se um teste corrigido falhar uma vez.

"Ao menos uma vez em 50" é uma probabilidade, não uma garantia: para o teste menos intermitente (cerca de 20%) a chance de 50 execuções verdes é `0,8^50`, cerca de 1 em 70 000.

## O que não é correção

- **Tentar de novo até ficar verde.** Esconde o sintoma e mantém a causa. Uma retentativa é aceitável como quarentena temporária com um ticket, nunca como resposta.
- **Um `sleep` maior.** Torna a corrida menos provável e a suíte mais lenta. Espere por uma condição.
- **Apagar ou pular o teste** sem entendê-lo. Às vezes o teste está certo e o produto tem uma corrida de verdade.
- **Fixar a ordem dos testes** para que o estado compartilhado continue "funcionando". A dependência continua lá, e impede execuções em paralelo.

## Como rodar

```sh
./setup-unix-flaky-tests.sh        # Linux e macOS
./setup-windows-flaky-tests.ps1    # Windows
```
