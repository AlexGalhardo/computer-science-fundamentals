# clean-architecture-app

> English version: [README.md](README.md)

Um aplicativo de notas construído nos quatro círculos da Arquitetura Limpa, mais uma raiz de composição. Ele ensina uma ideia: **as dependências de código-fonte apontam só para dentro**, então as regras de negócio não sabem nada sobre o framework web, o terminal ou o banco. Os mesmos casos de uso são alcançados por HTTP (ElysiaJS) e por linha de comando, e guardados em memória ou no PostgreSQL, e três coisas são conferidas por um programa e não por um diagrama: nenhuma camada interna importa uma externa, os casos de uso são testados sem banco e sem servidor HTTP, e trocar o repositório muda apenas a raiz de composição.

Código: MP-ARCH-1. Explicação completa: [docs/pt/software-architecture/clean-architecture-app.md](../../../docs/pt/software-architecture/clean-architecture-app.md).

## Tópicos do quiz que ele demonstra

- `software-architecture` / `clean-architecture-dependency-rule`: os círculos, a direção dos imports contra a direção das chamadas, inversão de dependência, a regra aplicada por uma verificação automática
- `software-architecture` / `entities-use-cases`: regras de domínio contra regras de aplicação, objetos de valor que se validam, portas que pertencem aos casos de uso, casos de uso testados sem infraestrutura
- `software-architecture` / `interface-adapters`: controllers e presenters que não importam o framework, DTOs na fronteira, mapeamento de erros para códigos de status e códigos de saída, validação de formato na borda
- `software-architecture` / `frameworks-drivers-composition-root`: o framework e o banco como detalhes, injeção pelo construtor, a raiz de composição, a troca de um detalhe
- `software-architecture` / `layered-hexagonal`: portas e adaptadores, adaptadores condutores (HTTP, terminal) e conduzidos (repositórios), vários adaptadores para uma porta
- `software-architecture` / `domain-driven-design`: objeto de valor contra entidade, o repositório como uma coleção de objetos de domínio

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-clean-architecture-app.sh        # Linux e macOS
./setup-windows-clean-architecture-app.ps1    # Windows
```

O script constrói uma imagem, roda os testes de unidade em um contêiner sem rede, roda os testes de integração contra um contêiner do PostgreSQL, roda a demonstração, e remove os contêineres no fim. A rede do compose é interna e nenhuma porta é publicada no host.

## As camadas

```
ts/src/
  entities/     Note, Title, erros de domínio, Result      não importa nada além de si mesma
  use-cases/    CreateNote, ListNotes, UpdateNote,         importa entities
                RemoveNote, e as portas de que precisam
  adapters/     controller HTTP, controller e presenter    importa use-cases, entities, e o Zod
                de terminal, repositório em memória
  drivers/      servidor Elysia, repositório PostgreSQL,   importa adapters, use-cases, entities,
                relógio do sistema, ids, saída no terminal e qualquer biblioteca
  main/         configuração, raiz de composição,          importa tudo; nada a importa
                os dois pontos de entrada
```

| Caminho | O que é |
| --- | --- |
| `ts/src/entities/note.ts`, `title.ts` | A entidade e o seu objeto de valor. Os construtores são privados, então uma nota inválida não pode ser construída |
| `ts/src/use-cases/ports.ts` | `NoteRepository`, `Clock`, `IdGenerator`: o que os casos de uso precisam, declarado por eles |
| `ts/src/use-cases/create-note.ts` | Um caso de uso, com a regra de aplicação "não há duas notas com o mesmo título" |
| `ts/src/adapters/note-http-controller.ts` | `HttpRequest` e `HttpResponse` simples, validação com Zod, erros mapeados para códigos de status |
| `ts/src/adapters/note-cli-controller.ts` | Os mesmos casos de uso para um terminal: palavras entram, linhas e um código de saída saem |
| `ts/src/adapters/in-memory-note-repository.ts` | A porta implementada com um `Map` |
| `ts/src/drivers/elysia-server.ts` | O único arquivo que importa o framework web |
| `ts/src/drivers/postgres-note-repository.ts` | O único arquivo que contém SQL |
| `ts/src/main/composition.ts` | A raiz de composição: o único arquivo que cita um repositório concreto |
| `ts/tools/dependency-rule.ts` | A verificação automática da regra de dependência |

## 1. A regra de dependência, conferida por um programa

```sh
docker compose run --rm ts-test bun run check:layers
```

```
ok   entities   4 files, 0 violations
ok   use-cases  6 files, 0 violations
ok   adapters   3 files, 0 violations
ok   drivers    3 files, 0 violations
ok   main       4 files, 0 violations

dependency rule holds: every import points inward
```

A verificação lê todos os imports de `ts/src/`, incluindo `import type`, reexportações e imports dinâmicos. Um arquivo pode importar da própria camada e das camadas que estão dentro dela. As duas camadas internas não podem importar pacote nenhum, e os adaptadores só o Zod. O comando termina com código 1 no primeiro import para fora, e faz parte do comando padrão do contêiner de teste, então um import desses quebra o build. Experimente: acrescente `import type { HttpResponse } from "../adapters/note-http-controller";` em `ts/src/use-cases/create-note.ts` e rode os testes de novo.

```
FAIL use-cases  6 files, 1 violations
use-cases/create-note.ts:1 imports "../adapters/note-http-controller": "use-cases" is an inner layer and cannot import from "adapters"

dependency rule broken: 1 violation(s)
```

`ts/tests/unit/dependency-rule.test.ts` faz exatamente isso em uma cópia temporária do código, e também entrega à verificação nove tipos de violação, um por um.

A verificação é um leitor didático feito com expressões regulares, não um parser de TypeScript. Um projeto real usaria uma regra de lint ou uma ferramenta construída sobre o compilador.

## 2. Casos de uso sem banco e sem servidor HTTP

```sh
docker compose run --rm ts-test
docker compose down -v
```

O serviço `ts-test` tem `network_mode: "none"`. Ele roda a checagem de tipos, a verificação da regra de dependência e 50 testes de unidade, entre eles todas as regras de todos os casos de uso (`ts/tests/unit/use-cases.test.ts`), com um repositório em memória, um relógio fixo e ids sequenciais. Nenhum socket é aberto: até as rotas do Elysia são exercitadas por `app.handle(request)`, em memória.

Os 7 testes de integração são os únicos que precisam do PostgreSQL:

```sh
docker compose run --rm ts-integration
docker compose down -v
```

Eles rodam o mesmo contrato de repositório (`ts/tests/repository-contract.ts`) pelo qual o adaptador em memória passa, agora contra o adaptador PostgreSQL.

## 3. Experimento de troca

O aplicativo foi escrito primeiro só com o repositório em memória. Depois o adaptador PostgreSQL (`ts/src/drivers/postgres-note-repository.ts`, um arquivo novo que implementa a porta que já existia) foi plugado. Este é o diff completo dos arquivos que já existiam, tirado com `diff -ru` entre as duas versões de `ts/src/`:

```diff
--- a/src/main/composition.ts
+++ b/src/main/composition.ts
@@ -12,6 +12,7 @@
 import { InMemoryNoteRepository } from "../adapters/in-memory-note-repository";
 import { NoteCliController } from "../adapters/note-cli-controller";
 import { NoteHttpController } from "../adapters/note-http-controller";
+import { PostgresNoteRepository } from "../drivers/postgres-note-repository";
 import { SystemClock, UuidIdGenerator } from "../drivers/system";
 import type { NoteUseCases } from "../use-cases";
 import { CreateNote } from "../use-cases/create-note";
@@ -27,7 +28,11 @@
 
 // EN: The swap experiment happens in this function. See "Swap experiment" in the README.
 // PT: O experimento de troca acontece nesta função. Veja "Experimento de troca" no README.
-async function createRepository(_config: Config): Promise<RepositoryHandle> {
+async function createRepository(config: Config): Promise<RepositoryHandle> {
+	if (config.NOTES_REPOSITORY === "postgres") {
+		const repository = await PostgresNoteRepository.connect(config.DATABASE_URL);
+		return { repository, close: () => repository.close() };
+	}
 	return { repository: new InMemoryNoteRepository(), close: async () => {} };
 }
 
--- a/src/main/config.ts
+++ b/src/main/config.ts
@@ -6,6 +6,8 @@
 //     viajam para dentro como valores simples e tipados. Nenhum caso de uso lê `process.env`.
 const envSchema = z.object({
 	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
+	NOTES_REPOSITORY: z.enum(["memory", "postgres"]).default("memory"),
+	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
 });
 
 export type Config = z.infer<typeof envSchema>;
@@ -13,5 +15,7 @@
 export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
 	return envSchema.parse({
 		PORT: env.PORT,
+		NOTES_REPOSITORY: env.NOTES_REPOSITORY,
+		DATABASE_URL: env.DATABASE_URL,
 	});
 }
```

Nove linhas acrescentadas e uma alterada, todas em `ts/src/main/`. Nada em `entities/`, `use-cases/` ou `adapters/` foi tocado, e os 10 testes dos casos de uso passaram antes e depois sem nenhuma edição. `ts/tests/unit/swap.test.ts` mantém isso assim: ele falha se qualquer arquivo além de `main/composition.ts` citar `InMemoryNoteRepository` ou `PostgresNoteRepository`.

O que o experimento não mostra: a migração de dados já existentes, e as diferenças que uma porta não consegue esconder, como transações que abrangem várias chamadas ou duas requisições disputando o mesmo título. Isolar o banco torna a troca barata em código. Não a torna gratuita.

## Demonstração

```sh
docker compose run --rm demo
docker compose down -v
```

Um comando: ele sobe o PostgreSQL e a API HTTP, depois cria uma nota no terminal, lê essa nota por HTTP, cria outra por HTTP, lista as duas no terminal, e mostra a mesma regra respondida em dois vocabulários:

```
== 4. One rule, two vocabularies: a repeated title is 409 over HTTP and exit code 1 in the terminal
$ POST /notes {"title":"Written over HTTP"}
409 {"error":"duplicate-title","message":"a note titled \"Written over HTTP\" already exists"}
$ NOTES_REPOSITORY=postgres cli "add" "Written over HTTP"
error (duplicate-title): a note titled "Written over HTTP" already exists
(exit code 1)
```

A demonstração só chama o serviço `api` deste arquivo compose e recusa qualquer outro host.

## Usando à mão

```sh
docker compose run --rm ts-integration bun run cli add "Comprar leite" "dois litros"
docker compose run --rm ts-integration bun run cli list
docker compose run --rm ts-test bun run cli list     # memória: um repositório novo e vazio por processo
docker compose down -v
```

| Rota HTTP | Comando de terminal | Caso de uso |
| --- | --- | --- |
| `POST /notes` com `{ "title", "body" }` | `add <title> [body]` | `CreateNote` |
| `GET /notes` | `list` | `ListNotes` |
| `PUT /notes/:id` com `{ "title"?, "body"? }` | `edit <id> <title> [body]` | `UpdateNote` |
| `DELETE /notes/:id` | `remove <id>` | `RemoveNote` |

## Decisões e limites

- O corpo da requisição é validado com Zod no controller, não com o schema do próprio Elysia, então a validação pertence ao adaptador e sobrevive a uma troca de framework.
- O repositório em memória fica em `adapters/` e o do PostgreSQL em `drivers/`, porque o segundo fala diretamente com um driver de banco. Um adaptador que importe `pg` é apontado pela verificação.
- `Result` mora em `entities/` porque toda camada pode importar a mais interna.
- As credenciais em `docker-compose.yml` são falsas e só alcançáveis dentro da rede interna.
