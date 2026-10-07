# Níveis de isolamento no PostgreSQL (MP-TX-1)

> English version: [docs/en/transactions/isolation-levels.md](../../en/transactions/isolation-levels.md)

Mini-projeto: [`projects/transactions/isolation-levels`](../../../projects/transactions/isolation-levels/README.pt-BR.md). Tópicos do quiz: `isolation-levels-anomalies`, `mvcc`, `locking`, `acid-properties`.

## A pergunta

Isolamento é o I de ACID: transações concorrentes não deveriam atrapalhar umas às outras. Isolamento total é caro, então os bancos oferecem níveis, e cada nível deixa passar algumas anomalias. A tabela usual de nível contra anomalia é decorada e raramente testada. Este mini-projeto a testa.

## As cinco anomalias

| Anomalia | O que dá errado |
| --- | --- |
| Leitura suja | B lê um valor que A escreveu e ainda não confirmou. Se A desfizer, B usou um dado que nunca existiu |
| Leitura não repetível | A lê a mesma linha duas vezes e recebe dois valores, porque B confirmou uma atualização no meio |
| Fantasma | A roda a mesma busca duas vezes e aparece uma linha nova, inserida e confirmada por B |
| Atualização perdida | A e B leem o mesmo valor, cada uma calcula um novo na aplicação e grava. A última escrita apaga a outra |
| Write skew | A e B conferem a mesma regra e depois escrevem linhas **diferentes**. Cada escrita é válida sozinha, juntas elas quebram a regra |

## Padrão contra PostgreSQL

O padrão SQL define os níveis pelos três fenômenos que ele proíbe:

| Nível (padrão SQL) | Leitura suja | Leitura não repetível | Fantasma |
| --- | --- | --- | --- |
| READ UNCOMMITTED | possível | possível | possível |
| READ COMMITTED | não possível | possível | possível |
| REPEATABLE READ | não possível | não possível | possível |
| SERIALIZABLE | não possível | não possível | não possível |

"Possível" é uma permissão, não uma obrigação, e o PostgreSQL é mais rígido que o padrão:

- `READ UNCOMMITTED` se comporta como `READ COMMITTED`. Não existe nível que mostre leitura suja.
- `REPEATABLE READ` é snapshot isolation: a transação enxerga o banco como ele estava no seu primeiro comando, então fantasmas também não aparecem.
- `SERIALIZABLE` é serializable snapshot isolation (SSI): o snapshot, mais o rastreamento das dependências de leitura e escrita entre transações.

A tabela do padrão não diz nada sobre atualização perdida e write skew. A matriz medida, gerada pelos testes, está no [README](../../../projects/transactions/isolation-levels/README.pt-BR.md#matriz-de-resultados).

## O que a matriz ensina

- **READ COMMITTED** (o padrão do PostgreSQL) tira um snapshot novo a cada comando. Dois comandos da mesma transação podem ver dados diferentes: leitura não repetível, fantasma e atualização perdida acontecem.
- **REPEATABLE READ** mantém um snapshot para a transação inteira. As leituras ficam estáveis. Uma escrita em uma linha que mudou depois do snapshot falha com SQLSTATE `40001` ("could not serialize access due to concurrent update"), e é isso que barra a atualização perdida. O write skew passa, porque as duas transações escrevem linhas diferentes.
- **SERIALIZABLE** também detecta o padrão perigoso "cada uma leu o que a outra escreveu" e aborta uma delas com `40001`. É o único nível que barra o write skew.

Na matriz aparecem dois jeitos de evitar uma anomalia: em silêncio (o snapshot esconde a mudança) ou com erro. Um erro `40001` não é um bug. É o contrato desses níveis: **a aplicação precisa repetir a transação**.

## Como o harness funciona

Uma corrida normalmente depende de tempo. O harness tira o tempo da jogada:

1. Três conexões são abertas: as sessões A e B, e um observador fora das duas transações.
2. Um cenário é uma lista de passos. Cada passo diz a sua sessão. O harness envia um passo e espera ele terminar antes de enviar o próximo.
3. Alguns passos não conseguem terminar: um `UPDATE` em uma linha bloqueada pela outra sessão fica esperando. O harness não chuta com um sleep. O observador lê `pg_stat_activity` até o servidor informar `wait_event_type = 'Lock'` para aquela sessão, registra o instante e segue para o passo que libera o bloqueio.
4. Todo passo é registrado com a hora do relógio e com os tempos monotônicos de início, bloqueio e fim. Os testes conferem que cada passo começou depois de o anterior terminar ou ser confirmado como bloqueado.

O log da última execução está em `results/timeline.md`.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-TX-1.1 ordem fixa, provada por um log de timestamps | `tests/harness.test.ts` e `results/timeline.md` |
| MP-TX-1.2 cada anomalia reproduzida no nível mais fraco que a permite e barrada no seguinte | `tests/matrix.test.ts`, "each anomaly is reproduced at the strongest level that allows it and blocked at the next" |
| MP-TX-1.3 matriz do README gerada pelos testes | `tests/matrix.test.ts`, "result matrix" |

Uma parte do MP-TX-1.2 não pode ser cumprida no PostgreSQL: a leitura suja não é reproduzível em nenhum nível. O teste prova o contrário, que `READ UNCOMMITTED` não mostra dado não confirmado.

## Como rodar

```sh
cd projects/transactions/isolation-levels
./setup-unix-isolation-levels.sh        # ou ./setup-windows-isolation-levels.ps1
docker compose run --rm demo && docker compose down -v
```
