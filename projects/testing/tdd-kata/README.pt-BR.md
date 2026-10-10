# tdd-kata

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

O kata do dinheiro em várias moedas, feito com desenvolvimento guiado por testes, em que a entrega é o **histórico do git**: 27 commits que alternam um teste que falha (red), a menor mudança que o faz passar (green) e uma limpeza com todos os testes passando (refactor). O código final tem cerca de 90 linhas. O que vale estudar é a ordem em que elas foram escritas.

Código: MP-TEST-2. Explicação completa: [docs/pt/testing/tdd-kata.md](../../../docs/pt/testing/tdd-kata.md).

## Tópicos do quiz que ele demonstra

- `testing` / `tdd-cycle`: red, green, refactor; fake it, triangulação e implementação óbvia; a lista de tarefas; passos pequenos; refatorar só com a barra verde
- `testing` / `unit-tests-isolation`: objetos de valor e igualdade testados pela interface pública

## O problema

Somar valores em moedas diferentes e converter o resultado, dadas as taxas de câmbio: `$5 + 10 CHF = $10` quando 2 CHF compram 1 dólar. O kata é o exemplo clássico da literatura de TDD. O código e os passos daqui foram escritos para este repositório.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-tdd-kata.sh        # Linux e macOS
./setup-windows-tdd-kata.ps1    # Windows
```

O script roda a checagem de tipos e os testes do kata pronto e depois confere o ritmo do histórico do git (veja abaixo).

## Testes

```sh
docker compose run --rm ts-test
```

9 testes do kata, 7 testes do verificador de histórico e 1 teste que confere o retrato versionado do histórico.

## Demo: conferindo o histórico

```sh
git log --reverse --format="%h %s" -- . | docker compose run --rm -T history
```

O git roda no host e o verificador roda no Docker. Ele lê apenas os prefixos dos commits:

| Prefixo | Passo | Regra |
| --- | --- | --- |
| `test(tdd-kata): red - ...` | um teste novo que falha | só com a barra verde: nunca dois testes falhando ao mesmo tempo |
| `feat(tdd-kata): green - ...` | fazê-lo passar | só logo depois de um red: nenhum código de produção sem um teste falhando |
| `refactor(tdd-kata): ...` | limpar | só com a barra verde |

Ele também exige pelo menos 3 ciclos, pelo menos uma refatoração e um histórico que não termine em red. Commits com qualquer outro prefixo (o esqueleto, esta documentação) não são passos e são ignorados.

Os prefixos são uma alegação. Para prová-la, o script de reencenação extrai o código de cada commit de passo e roda os testes em um contêiner descartável: todo commit `red` precisa falhar e todo commit `green` e `refactor` precisa passar.

```sh
./replay-unix-tdd-kata.sh        # ou replay-windows-tdd-kata.ps1
```

Resultado no histórico versionado: `27 steps replayed, 0 wrong`.

Os dois comandos precisam de git e do histórico completo. Em um clone raso (um job de CI com `fetch-depth: 1`) o script de setup pula a checagem ao vivo, e o ritmo ainda é verificado por um teste sobre [`ts/HISTORY.txt`](ts/HISTORY.txt), um retrato do mesmo `git log`.

**Preserve os commits.** Fazer o merge deste branch com squash ou rebase destrói a lição, e um rebase também muda os hashes dos links abaixo.

## Passo a passo

Cada passo aponta para o seu commit. Leia o diff de cada um: nenhum é maior que uma tela.

| # | Passo | O que acontece | Commit |
| --- | --- | --- | --- |
| 1 | red | $5 vezes 2 é $10 | [`350b73b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/350b73b) |
| 2 | green | fake it: times devolve $10 | [`4009c9b`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4009c9b) |
| 3 | red | triangular com $5 vezes 3 | [`37fbac3`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/37fbac3) |
| 4 | green | times multiplica o valor | [`f659df2`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f659df2) |
| 5 | red | dólares são iguais quando os valores são iguais | [`09782c5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/09782c5) |
| 6 | green | implementação óbvia: equals compara os valores | [`c30c7dd`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c30c7dd) |
| 7 | refactor | comparar valores inteiros com equals nos testes | [`e03cb61`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e03cb61) |
| 8 | red | 5 CHF vezes 2 é 10 CHF | [`e81bdce`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e81bdce) |
| 9 | green | copiar Dollar para Franc | [`1c184df`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/1c184df) |
| 10 | refactor | subir o valor e o equals para Money | [`737fdc8`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/737fdc8) |
| 11 | red | 5 CHF não é igual a $5 | [`e236d10`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/e236d10) |
| 12 | green | equals também compara a moeda | [`3726797`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/3726797) |
| 13 | refactor | subir o times para Money | [`15eb25a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/15eb25a) |
| 14 | refactor | criar dinheiro por Money.dollar e Money.franc | [`4253425`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4253425) |
| 15 | refactor | apagar as subclasses vazias Dollar e Franc | [`512f11c`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/512f11c) |
| 16 | red | $5 + $5 é $10 | [`17702bc`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/17702bc) |
| 17 | green | fake it: reduce devolve $10 | [`5de03f7`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5de03f7) |
| 18 | red | triangular com $3 + $4 | [`b46ef1a`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/b46ef1a) |
| 19 | green | reduce devolve a soma que recebeu | [`4d8f892`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/4d8f892) |
| 20 | red | 2 CHF é $1 a uma taxa de 2 | [`214e092`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/214e092) |
| 21 | green | o Bank guarda as taxas e um Money se converte | [`912e09e`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/912e09e) |
| 22 | refactor | dar nome à chave de uma taxa | [`c82506d`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c82506d) |
| 23 | red | $5 + 10 CHF é $10 | [`a671f72`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/a671f72) |
| 24 | green | uma expressão Sum reduz os dois lados antes de somar | [`f7eebe5`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/f7eebe5) |
| 25 | red | uma soma pode ser somada e multiplicada | [`5cc8402`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/5cc8402) |
| 26 | green | plus e times pertencem a toda Expression | [`c4343b1`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/c4343b1) |
| 27 | refactor | agrupar os testes por comportamento | [`326a071`](https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/commit/326a071) |

A lista de tarefas ([`TODO.md`](TODO.md)) muda nos mesmos commits: uma ideia que surge no meio de um passo é anotada e fica para depois.

## O que observar

- **Fake it (passos 2 e 17).** O primeiro verde devolve uma constante. Ele prova que o teste consegue passar e que está ligado corretamente, quase sem custo.
- **Triangulação (passos 3 e 18).** Um segundo exemplo torna a constante impossível, e só então o código de verdade é escrito.
- **Implementação óbvia (passo 6).** Quando o código é claro, ele é digitado direto. Fingir é um jeito de ir mais devagar quando há dúvida, não um ritual.
- **Um pecado deliberado (passo 9).** Franc é uma cópia de Dollar. Chegar rápido ao verde é permitido. Ficar lá não: os passos 10 a 15 removem a cópia.
- **Refatorar acha bugs (passos 10 e 11).** Subir o `equals` fez 5 CHF ser igual a $5. Nenhum teste percebeu, porque nenhum teste perguntava. O red seguinte pergunta.
- **Os testes também mudam em uma refatoração (passos 7, 14 e 27),** mas nunca junto com uma mudança de comportamento.
- **O design chega tarde (passo 24).** `Expression` e `Sum` só existem porque um teste não podia ser satisfeito sem eles.

## Estrutura

```text
ts/src/money.ts            Money, Sum e a interface Expression
ts/src/bank.ts             taxas de câmbio e reduce
ts/tests/money.test.ts     os testes do kata
ts/scripts/history.ts      o verificador dos prefixos dos commits
ts/HISTORY.txt             retrato do git log desta pasta
TODO.md                    a lista de tarefas do kata
```

Dependências, fixadas: `typescript` 7.0.2 e `@types/bun` 1.4.2 para a checagem de tipos, sobre `oven/bun:1.4.2`. O kata usa apenas o executor de testes embutido no Bun.
