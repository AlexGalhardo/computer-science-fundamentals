# isolation-levels

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Qual anomalia cada nível de isolamento permite? Este mini-projeto responde por experimento. Um harness de duas sessões conduz duas transações contra um PostgreSQL local em uma ordem fixa e registrada, reproduz cinco anomalias (leitura suja, leitura não repetível, fantasma, atualização perdida, write skew) em cada um dos quatro níveis de isolamento e escreve a matriz de resultados abaixo.

Código: MP-TX-1. Explicação completa: [docs/pt/transactions/isolation-levels.md](../../../docs/pt/transactions/isolation-levels.md).

## Matriz de resultados

Gerada pelos testes. Não edite à mão: `docker compose run --rm ts-test` reescreve tudo que está entre os marcadores.

<!-- matrix:start -->
| Anomalia | READ UNCOMMITTED | READ COMMITTED | REPEATABLE READ | SERIALIZABLE |
| --- | --- | --- | --- | --- |
| Leitura suja | evitada | evitada | evitada | evitada |
| Leitura não repetível | **ocorre** | **ocorre** | evitada | evitada |
| Leitura fantasma | **ocorre** | **ocorre** | evitada | evitada |
| Atualização perdida | **ocorre** | **ocorre** | evitada (erro 40001) | evitada (erro 40001) |
| Write skew | **ocorre** | **ocorre** | **ocorre** | evitada (erro 40001) |
<!-- matrix:end -->

Como ler:

- **ocorre**: a anomalia foi observada naquele nível.
- **evitada**: a transação continuou lendo o seu próprio snapshot, sem erro.
- **evitada (erro 40001)**: o PostgreSQL abortou uma transação com falha de serialização, e a aplicação precisa executá-la de novo.

Isto é o PostgreSQL, não o padrão SQL. O padrão permite leitura suja em `READ UNCOMMITTED` e fantasmas em `REPEATABLE READ`. O PostgreSQL trata `READ UNCOMMITTED` como `READ COMMITTED`, então **não tem nível que mostre leitura suja**, e o seu `REPEATABLE READ` é snapshot isolation, que não mostra fantasmas mas ainda permite write skew.

O log de timestamps de cada intercalação está em [results/timeline.md](results/timeline.md).

## Tópicos do quiz que ele demonstra

- `transactions` / `isolation-levels-anomalies`: as cinco anomalias e o nível que barra cada uma
- `transactions` / `mvcc`: snapshots, e por que um leitor nunca bloqueia um escritor
- `transactions` / `locking`: o bloqueio de linha que faz o segundo escritor esperar
- `transactions` / `acid-properties`: o que o I de ACID promete e o que não promete

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-isolation-levels.sh        # Linux e macOS
./setup-windows-isolation-levels.ps1    # Windows
```

O script constrói a imagem, roda os testes contra um contêiner PostgreSQL em uma rede interna e remove os contêineres no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

Mostra a matriz e, para cada anomalia, o log passo a passo com timestamps no nível em que ela ocorre e no nível em que ela para.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v
```

O contêiner roda a checagem de tipos do TypeScript e depois `bun test`. Os testes provam que os passos rodaram na ordem planejada (pelos timestamps), que cada anomalia ocorre no nível mais forte que a permite e é evitada no seguinte, e regeneram `results/` e a matriz acima.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/harness.ts` | O harness de duas sessões: ordem fixa, detecção de espera por bloqueio, log de timestamps |
| `ts/src/anomalies.ts` | As cinco anomalias como roteiros de passos |
| `ts/src/matrix.ts` | Roda anomalia contra nível, gera a matriz e as linhas do tempo |
| `ts/src/demo.ts` | A demo de linha de comando |
| `ts/tests/` | Testes do harness e da matriz |
| `results/` | Matriz e log de timestamps da última execução |

## Versões

| Componente | Versão |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
