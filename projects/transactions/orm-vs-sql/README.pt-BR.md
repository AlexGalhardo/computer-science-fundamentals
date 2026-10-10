# orm-vs-sql

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Quanto custa um ORM, e que SQL ele realmente envia? Este mini-projeto escreve as mesmas cinco consultas três vezes, com SQL puro (node-postgres), Prisma e Drizzle, sobre um único schema PostgreSQL. Os testes provam que as três devolvem linhas idênticas, capturam o SQL que cada uma gera e o versionam ao lado da consulta, e um benchmark mede a latência de cada abordagem e o custo do padrão N+1.

Código: MP-TX-3. Explicação completa: [docs/pt/transactions/orm-vs-sql.md](../../../docs/pt/transactions/orm-vs-sql.md).

## As cinco consultas

| Consulta | O que exercita | Código | SQL capturado |
| --- | --- | --- | --- |
| `author-by-id` | Busca pela chave primária | [ts](ts/src/queries/author-by-id.ts) | [sql](ts/src/queries/author-by-id.captured.sql) |
| `top-posts` | Filtro, ordenação, limite | [ts](ts/src/queries/top-posts.ts) | [sql](ts/src/queries/top-posts.captured.sql) |
| `posts-with-author` | Junção | [ts](ts/src/queries/posts-with-author.ts) | [sql](ts/src/queries/posts-with-author.captured.sql) |
| `post-count-by-author` | Agregação com `GROUP BY` | [ts](ts/src/queries/post-count-by-author.ts) | [sql](ts/src/queries/post-count-by-author.captured.sql) |
| `add-post-with-comment` | Transação com dois inserts | [ts](ts/src/queries/add-post-with-comment.ts) | [sql](ts/src/queries/add-post-with-comment.captured.sql) |

O exemplo de N+1 e a sua correção estão em [n-plus-one.ts](ts/src/queries/n-plus-one.ts), com o SQL capturado da versão [ingênua](ts/src/queries/n-plus-one-naive.captured.sql) e da [corrigida](ts/src/queries/n-plus-one-fixed.captured.sql).

## Latência por abordagem

Gerada pelo benchmark. Não edite à mão.

<!-- latency:start -->
| Consulta | Abordagem | Média (ms) | ± entre rodadas | p50 (ms) | p95 (ms) | Vezes o SQL puro |
| --- | --- | --- | --- | --- | --- | --- |
| `author-by-id` | raw | 0.307 | 0.018 | 0.292 | 0.373 | 1.00x |
| `author-by-id` | prisma | 0.426 | 0.032 | 0.405 | 0.528 | 1.39x |
| `author-by-id` | drizzle | 0.365 | 0.017 | 0.346 | 0.445 | 1.19x |
| `top-posts` | raw | 0.352 | 0.026 | 0.325 | 0.449 | 1.00x |
| `top-posts` | prisma | 0.453 | 0.028 | 0.421 | 0.573 | 1.29x |
| `top-posts` | drizzle | 0.426 | 0.028 | 0.393 | 0.545 | 1.21x |
| `posts-with-author` | raw | 0.586 | 0.061 | 0.550 | 0.804 | 1.00x |
| `posts-with-author` | prisma | 1.107 | 0.083 | 1.049 | 1.431 | 1.89x |
| `posts-with-author` | drizzle | 0.712 | 0.053 | 0.660 | 0.956 | 1.22x |
| `post-count-by-author` | raw | 0.867 | 0.095 | 0.780 | 1.187 | 1.00x |
| `post-count-by-author` | prisma | 1.225 | 0.129 | 1.097 | 1.665 | 1.41x |
| `post-count-by-author` | drizzle | 1.001 | 0.104 | 0.909 | 1.347 | 1.15x |
<!-- latency:end -->

## N+1 e a sua correção

Listando 150 autores com seus posts. Gerada pelo benchmark.

<!-- n-plus-one:start -->
| Abordagem | Comandos, N+1 | Comandos, correção | Tempo, N+1 (ms) | Tempo, correção (ms) | Ganho |
| --- | --- | --- | --- | --- | --- |
| raw | 151 | 2 | 51.8 | 1.6 | 32.8x |
| prisma | 151 | 2 | 67.3 | 2.8 | 24.5x |
| drizzle | 151 | 2 | 49.5 | 1.7 | 28.8x |
<!-- n-plus-one:end -->

Máquina, versões e método estão em [results/results.md](results/results.md).

## Tópicos do quiz que ele demonstra

- `transactions` / `acid-properties`: atomicidade de uma transação com vários comandos, e por que todo comando precisa passar pelo identificador da transação (`tx`)

As outras lições deste mini-projeto (SQL gerado, N+1, custo de uma abstração) pertencem às áreas `databases` e `performance` do quiz.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-orm-vs-sql.sh        # Linux e macOS
./setup-windows-orm-vs-sql.ps1    # Windows
```

O script constrói a imagem, roda os testes contra um contêiner PostgreSQL em uma rede interna e remove os contêineres no fim. Os testes reescrevem os arquivos `*.captured.sql`.

## Benchmark (a demo)

```sh
docker compose run --rm bench
docker compose down -v
```

Reescreve `results/` e as duas tabelas acima.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v
```

O contêiner roda a checagem de tipos do TypeScript e depois `bun test`.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/sql/schema.sql` | O schema e os dados iniciais, compartilhados pelas três abordagens |
| `ts/prisma/schema.prisma`, `ts/src/drizzle-schema.ts` | Como Prisma e Drizzle descrevem as mesmas tabelas |
| `ts/src/context.ts` | Os três clientes, cada um com um gravador do SQL que envia |
| `ts/src/queries/` | Um arquivo por consulta com as três implementações, e o SQL capturado ao lado |
| `ts/src/bench.ts` | O benchmark |
| `results/` | Os resultados versionados |

## Versões

| Componente | Versão |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| pg (node-postgres) | 8.23.1 |
| Prisma (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) | 7.10.0 |
| Drizzle ORM | 0.45.3 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
