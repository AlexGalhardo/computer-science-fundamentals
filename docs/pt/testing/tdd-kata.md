# Kata de TDD com histórico de commits (MP-TEST-2)

> English version: [docs/en/testing/tdd-kata.md](../../en/testing/tdd-kata.md)

Mini-projeto: [`projects/testing/tdd-kata`](../../../projects/testing/tdd-kata/README.pt-BR.md). Tópicos do quiz: `tdd-cycle`, `unit-tests-isolation`.

## O conceito

Desenvolvimento guiado por testes é um ritmo de três passos, sempre na mesma ordem:

```
   +-----------+   escrever o menor código   +-----------+
   |    RED    | --------------------------> |   GREEN   |
   | um teste  |                             | todos os  |
   | que falha | <-------------------------- |  testes   |
   +-----------+    próximo item da lista    |  passam   |
                                             +-----------+
                                               |       ^
                                               v       |
                                             +-----------+
                                             | REFACTOR  |  remover duplicação,
                                             | tudo ainda|  comportamento igual
                                             |  passando |
                                             +-----------+
```

- **Red.** Escreva um teste para um comportamento que ainda não existe e veja-o falhar. Um teste que nunca foi visto falhando não mostrou que consegue detectar alguma coisa.
- **Green.** Escreva o mínimo de código que o faz passar. Feio é permitido: uma constante, uma cópia de outra classe.
- **Refactor.** Com todos os testes passando, remova a bagunça feita no passo anterior. Nenhum comportamento novo aqui.

Duas regras decorrem disso: nenhum código de produção sem um teste falhando que o peça, e nenhuma limpeza enquanto um teste estiver falhando.

## O mini-projeto

A entrega é o histórico do git da pasta: 27 commits de passo (10 red, 10 green, 7 refactor) que resolvem o problema do dinheiro em várias moedas, `$5 + 10 CHF = $10` a uma taxa de 2. O [README](../../../projects/testing/tdd-kata/README.pt-BR.md) traz o passo a passo, uma linha e um link por commit.

O prefixo do commit carrega o passo:

| Prefixo | Passo |
| --- | --- |
| `test(tdd-kata): red - ...` | um teste novo que falha |
| `feat(tdd-kata): green - ...` | a mudança que o faz passar |
| `refactor(tdd-kata): ...` | uma limpeza com a barra verde |

## Três jeitos de chegar ao verde

| Estratégia | Quando | No kata |
| --- | --- | --- |
| Fake it | Você não tem certeza do código. Devolva uma constante e deixe o próximo passo forçar o código real | `times` devolve `$10`; `reduce` devolve `$10` |
| Triangulação | Há um valor fingido no lugar. Um segundo exemplo, com outro valor, torna a constante impossível | `$5 vezes 3`; `$3 + $4` |
| Implementação óbvia | O código está claro na cabeça. Digite-o | `equals` compara os valores |

São marchas, não um ritual. Uma surpresa (um red inesperado) é o sinal para reduzir a marcha e dar passos menores.

## Como o design apareceu

Nada foi desenhado antes do primeiro teste. O design veio de remover duplicação:

1. `Dollar` sozinho, depois `Franc` como uma cópia descarada para deixar um teste verde.
2. A cópia é removida em refatorações pequenas: o `equals` sobe para `Money`, depois o `times`, depois as subclasses ficam vazias e são apagadas.
3. Subir o `equals` fez 5 CHF ser igual a $5. Nenhum teste reclamou, porque nenhum perguntava. O teste red seguinte perguntou, e a moeda entrou na comparação.
4. `$5 + 10 CHF` não podia ser respondido com um `Money`, porque o resultado depende de uma taxa. Foi esse teste que criou o `Sum` e a interface `Expression`.

## Como o histórico é conferido

- **Prefixos** (`ts/scripts/history.ts`, no Docker): uma máquina de estados sobre os assuntos dos commits. Red só com a barra verde, green só logo depois de um red, refactor só com a barra verde, nenhum histórico terminando em red, pelo menos 3 ciclos e uma refatoração. O verificador tem os seus próprios testes, um para cada jeito de quebrar o ritmo.
- **Reencenação** (`replay-unix-tdd-kata.sh`): os prefixos são uma alegação, então o script extrai o código de cada commit de passo e roda os testes em um contêiner descartável. Todo commit red falha e todo commit green e refactor passa: `27 steps replayed, 0 wrong`.
- **Retrato** (`ts/HISTORY.txt`): uma cópia do `git log` da pasta, conferida por um teste, para os lugares onde o histórico não existe (um clone raso de CI).

Como a lição é o histórico, o merge do branch precisa ser feito sem squash e sem rebase.

## Limites

- O histórico mostra a ordem dos passos, não o raciocínio entre eles. A lista de tarefas (`TODO.md`) registra parte disso.
- Um histórico tão arrumado é um recurso didático. O trabalho real tem tentativas erradas. O que importa é a direção: teste primeiro, passos pequenos, limpeza no verde.
- O TDD produz uma suíte de regressão e um design fácil de testar. Ele não substitui os testes de integração, e é difícil de aplicar a interfaces de usuário e a código cujo resultado não é conhecido de antemão.

## Como rodar

```sh
./setup-unix-tdd-kata.sh        # Linux e macOS
./setup-windows-tdd-kata.ps1    # Windows
```
