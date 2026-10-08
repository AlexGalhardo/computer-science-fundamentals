# clean-architecture-app

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A note-taking application built in the four circles of the Clean Architecture, plus a composition root. It teaches one idea: **source-code dependencies point only inward**, so the business rules know nothing about the web framework, the terminal or the database. The same use cases are reached through HTTP (ElysiaJS) and through a command line, and stored in memory or in PostgreSQL, and three things are checked by a program and not by a diagram: no inner layer imports an outer one, the use cases are tested with no database and no HTTP server, and replacing the repository changes only the composition root.

Code: MP-ARCH-1. Full explanation: [docs/en/software-architecture/clean-architecture-app.md](../../../docs/en/software-architecture/clean-architecture-app.md).

## Quiz topics it demonstrates

- `software-architecture` / `clean-architecture-dependency-rule`: the circles, the direction of the imports against the direction of the calls, dependency inversion, the rule enforced by an automated check
- `software-architecture` / `entities-use-cases`: domain rules against application rules, self-validating value objects, ports owned by the use cases, use cases tested without infrastructure
- `software-architecture` / `interface-adapters`: controllers and presenters that do not import the framework, DTOs at the boundary, mapping of errors to status codes and exit codes, shape validation at the edge
- `software-architecture` / `frameworks-drivers-composition-root`: the framework and the database as details, constructor injection, the composition root, the swap of a detail
- `software-architecture` / `layered-hexagonal`: ports and adapters, driving adapters (HTTP, terminal) and driven adapters (repositories), several adapters for one port
- `software-architecture` / `domain-driven-design`: value object against entity, the repository as a collection of domain objects

## Run

The only requirement is Docker.

```sh
./setup-unix-clean-architecture-app.sh        # Linux and macOS
./setup-windows-clean-architecture-app.ps1    # Windows
```

The script builds one image, runs the unit tests in a container with no network, runs the integration tests against a PostgreSQL container, runs the demo, and removes the containers at the end. The compose network is internal and no port is published on the host.

## The layers

```
ts/src/
  entities/     Note, Title, domain errors, Result        imports nothing but itself
  use-cases/    CreateNote, ListNotes, UpdateNote,         imports entities
                RemoveNote, and the ports they need
  adapters/     HTTP controller, CLI controller and        imports use-cases, entities, and Zod
                presenter, in-memory repository
  drivers/      Elysia server, PostgreSQL repository,      imports adapters, use-cases, entities,
                system clock, ids, terminal output         and any library
  main/         configuration, composition root,           imports everything; nothing imports it
                the two entry points
```

| Path | What it is |
| --- | --- |
| `ts/src/entities/note.ts`, `title.ts` | The entity and its value object. The constructors are private, so an invalid note cannot be built |
| `ts/src/use-cases/ports.ts` | `NoteRepository`, `Clock`, `IdGenerator`: what the use cases need, declared by them |
| `ts/src/use-cases/create-note.ts` | A use case, with the application rule "no two notes with the same title" |
| `ts/src/adapters/note-http-controller.ts` | Plain `HttpRequest` and `HttpResponse`, Zod validation, errors mapped to status codes |
| `ts/src/adapters/note-cli-controller.ts` | The same use cases for a terminal: words in, lines and an exit code out |
| `ts/src/adapters/in-memory-note-repository.ts` | The port implemented with a `Map` |
| `ts/src/drivers/elysia-server.ts` | The only file that imports the web framework |
| `ts/src/drivers/postgres-note-repository.ts` | The only file that contains SQL |
| `ts/src/main/composition.ts` | The composition root: the only file that names a concrete repository |
| `ts/tools/dependency-rule.ts` | The automated check of the dependency rule |

## 1. The dependency rule, checked by a program

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

The check reads every import of `ts/src/`, including `import type`, re-exports and dynamic imports. A file may import from its own layer and from the layers inside it. The two inner layers may import no package at all, the adapters only Zod. The command exits with code 1 on the first outward import, and it is part of the default command of the test container, so such an import fails the build. Try it: add `import type { HttpResponse } from "../adapters/note-http-controller";` to `ts/src/use-cases/create-note.ts` and run the tests again.

```
FAIL use-cases  6 files, 1 violations
use-cases/create-note.ts:1 imports "../adapters/note-http-controller": "use-cases" is an inner layer and cannot import from "adapters"

dependency rule broken: 1 violation(s)
```

`ts/tests/unit/dependency-rule.test.ts` does exactly this on a temporary copy of the source, and also feeds the check nine kinds of violation one by one.

The check is a didactic scanner built on regular expressions, not a TypeScript parser. A real project would use a lint rule or a tool built on the compiler.

## 2. Use cases with no database and no HTTP server

```sh
docker compose run --rm ts-test
docker compose down -v
```

The `ts-test` service has `network_mode: "none"`. It runs the type check, the dependency-rule check and 50 unit tests, among them every rule of every use case (`ts/tests/unit/use-cases.test.ts`), with an in-memory repository, a fixed clock and sequential ids. No socket is opened: even the Elysia routes are exercised through `app.handle(request)`, in memory.

The 7 integration tests are the only ones that need PostgreSQL:

```sh
docker compose run --rm ts-integration
docker compose down -v
```

They run the same repository contract (`ts/tests/repository-contract.ts`) that the in-memory adapter passes, now against the PostgreSQL adapter.

## 3. Swap experiment

The application was first written with the in-memory repository only. The PostgreSQL adapter (`ts/src/drivers/postgres-note-repository.ts`, one new file implementing the existing port) was then plugged in. This is the complete diff of the files that already existed, taken with `diff -ru` between the two versions of `ts/src/`:

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

Nine added lines and one changed line, all in `ts/src/main/`. Nothing in `entities/`, `use-cases/` or `adapters/` was touched, and the 10 use-case tests passed before and after without an edit. `ts/tests/unit/swap.test.ts` keeps it that way: it fails if any file other than `main/composition.ts` names `InMemoryNoteRepository` or `PostgresNoteRepository`.

What the experiment does not show: a migration of existing data, and the differences a port cannot hide, such as transactions spanning several calls or two requests racing on the same title. Isolating the database makes the swap cheap in code. It does not make it free.

## Demo

```sh
docker compose run --rm demo
docker compose down -v
```

One command: it starts PostgreSQL and the HTTP API, then creates a note in the terminal, reads it over HTTP, creates another over HTTP, lists both in the terminal, and shows the same rule answered in two vocabularies:

```
== 4. One rule, two vocabularies: a repeated title is 409 over HTTP and exit code 1 in the terminal
$ POST /notes {"title":"Written over HTTP"}
409 {"error":"duplicate-title","message":"a note titled \"Written over HTTP\" already exists"}
$ NOTES_REPOSITORY=postgres cli "add" "Written over HTTP"
error (duplicate-title): a note titled "Written over HTTP" already exists
(exit code 1)
```

The demo only calls the `api` service of this compose file and refuses any other host.

## Using it by hand

```sh
docker compose run --rm ts-integration bun run cli add "Buy milk" "two litres"
docker compose run --rm ts-integration bun run cli list
docker compose run --rm ts-test bun run cli list     # memory: a new, empty repository per process
docker compose down -v
```

| HTTP route | Terminal command | Use case |
| --- | --- | --- |
| `POST /notes` with `{ "title", "body" }` | `add <title> [body]` | `CreateNote` |
| `GET /notes` | `list` | `ListNotes` |
| `PUT /notes/:id` with `{ "title"?, "body"? }` | `edit <id> <title> [body]` | `UpdateNote` |
| `DELETE /notes/:id` | `remove <id>` | `RemoveNote` |

## Decisions and limits

- The request body is validated with Zod in the controller, not with Elysia's own schema, so the validation belongs to the adapter and survives a change of framework.
- The in-memory repository sits in `adapters/` and the PostgreSQL one in `drivers/`, because the second talks directly to a database driver. An adapter that imports `pg` is reported by the check.
- `Result` lives in `entities/` because every layer may import the innermost one.
- The credentials in `docker-compose.yml` are fake and only reachable inside the internal network.
