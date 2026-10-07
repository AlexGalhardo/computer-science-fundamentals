# Prisma, Drizzle e SQL puro (MP-TX-3)

> English version: [docs/en/transactions/orm-vs-sql.md](../../en/transactions/orm-vs-sql.md)

Mini-projeto: [`projects/transactions/orm-vs-sql`](../../../projects/transactions/orm-vs-sql/README.pt-BR.md). Tópico do quiz: `acid-properties` (transações por meio de um ORM).

## A pergunta

Um ORM deixa você escrever `post.findMany(...)` em vez de SQL. Isso poupa digitação e dá tipos, e também esconde duas coisas que você continua precisando saber: **qual SQL é enviado** e **quantos comandos são enviados**. Este mini-projeto torna as duas visíveis.

## Três níveis de abstração

| Abordagem | Você escreve | Você recebe |
| --- | --- | --- |
| SQL puro (`pg`) | O texto SQL, com parâmetros `$1` | Controle total. Nenhuma checagem de tipos entre o SQL e o código: os tipos das linhas são uma promessa sua |
| Drizzle | Um construtor de consultas que espelha o SQL (`select().from().innerJoin()`) | Tipos derivados do schema, e um SQL que é quase exatamente o que você escreveu |
| Prisma | O que você quer (`select`, `where`, relações) | O nível mais alto. O Prisma decide como buscar, então o SQL pode surpreender |

O schema é criado uma vez, por `ts/sql/schema.sql`. Prisma e Drizzle só descrevem as tabelas existentes, então a comparação é sobre consultar.

## O que o SQL capturado mostra

Os testes gravam todo comando que cada abordagem envia e o escrevem ao lado da consulta (`ts/src/queries/*.captured.sql`). Vale abrir:

- **As três passam parâmetros separados** (`$1`, `$2`). Nenhuma escreve o valor dentro do texto SQL, e essa é a defesa contra injeção de SQL.
- **`posts-with-author`**: SQL puro e Drizzle enviam um `JOIN`. O Prisma envia **dois comandos**: os posts, depois `SELECT ... FROM authors WHERE id IN (...)`, e junta as linhas na aplicação. Mesmas linhas, plano diferente, e o motivo de esta consulta ter a maior distância na tabela de latência.
- **`add-post-with-comment`**: os dois inserts viajam entre um `BEGIN` e um `COMMIT` nas três. O log de consultas do Prisma mostra o `COMMIT` mas não o `BEGIN`, um lembrete de que o log de um ORM nem sempre é a conversa inteira.
- **`n-plus-one-naive`**: 151 comandos quase idênticos. Vê-los em um arquivo convence mais do que qualquer explicação.

## Transações por meio de um ORM

`add-post-with-comment` insere um post e um comentário de forma atômica. A regra é a mesma nas três abordagens: dentro da transação, **todo comando passa pelo identificador da transação** (`tx`), que está preso a uma conexão. Um comando enviado pelo cliente global roda em outra conexão, fora da transação, e sobrevive a um rollback. Os testes forçam o segundo insert a falhar (um `CHECK` no tamanho do comentário) e exigem que o post tenha sumido nas três.

## N+1

Para listar N autores com seus posts, o código ingênuo roda 1 consulta para os autores e 1 consulta por autor: N + 1 idas e voltas. Cada uma é rápida. A soma não é. A correção é buscar todos os posts em um comando (`WHERE author_id = ANY(...)` ou `IN (...)`), 2 comandos no total, e agrupá-los em memória. No Prisma a correção é pedir a relação na mesma chamada.

Na execução medida, 150 autores custaram 151 comandos contra 2, e a correção foi cerca de 25 a 33 vezes mais rápida, **com o banco na mesma máquina**. Com uma rede de verdade entre aplicação e banco, cada ida e volta custa muito mais, e o N+1 também.

## Como ler a tabela de latência

Os números versionados estão no [README](../../../projects/transactions/orm-vs-sql/README.pt-BR.md#latência-por-abordagem) e em `results/results.md`.

- O Drizzle ficou de 15 a 22% acima do SQL puro, e o Prisma de 29 a 89% acima, nesta execução.
- A diferença absoluta é uma fração de milissegundo por consulta. Ela importa em um caminho quente que roda milhares de vezes, e é irrelevante perto de um N+1 evitável.
- O banco é local, então a consulta em si é barata e o custo da biblioteca fica o mais visível possível. Em uma rede real a diferença relativa encolhe.
- Isto é uma máquina, um tamanho de dados (200 autores, cerca de 800 posts) e uma versão de cada biblioteca. Não é um ranking de ferramentas.

O runner de benchmark do repositório (`bun run bench`, hyperfine) mede processos inteiros sem rede, então não serve para um benchmark que precisa de banco de dados. Este mede dentro do processo, com aquecimento descartado, várias rodadas e a dispersão informada, e registra máquina, versões e comando.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-TX-3.1 as três abordagens devolvem linhas idênticas | `tests/queries.test.ts`, "the same five queries in the three approaches" |
| MP-TX-3.2 SQL gerado versionado ao lado de cada consulta | `tests/queries.test.ts`, "captured SQL", que grava `ts/src/queries/*.captured.sql` |
| MP-TX-3.3 tabela de latência, N+1 acima de 100 comandos, correção com 2 | `docker compose run --rm bench` grava as tabelas. `tests/queries.test.ts`, "N+1", exige 151 e 2 |

## Como rodar

```sh
cd projects/transactions/orm-vs-sql
./setup-unix-orm-vs-sql.sh        # ou ./setup-windows-orm-vs-sql.ps1
docker compose run --rm bench && docker compose down -v
```
