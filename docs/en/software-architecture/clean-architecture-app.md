# Clean architecture application (MP-ARCH-1)

> Versão em português: [docs/pt/software-architecture/clean-architecture-app.md](../../pt/software-architecture/clean-architecture-app.md) · Versión en español: [docs/es/software-architecture/clean-architecture-app.md](../../es/software-architecture/clean-architecture-app.md)

Mini-project: [`projects/software-architecture/clean-architecture-app`](../../../projects/software-architecture/clean-architecture-app/README.md). Quiz topics: `clean-architecture-dependency-rule`, `entities-use-cases`, `interface-adapters`, `frameworks-drivers-composition-root`, `layered-hexagonal`, `domain-driven-design`.

## The problem

In a typical small application the business rule ends up inside the route handler, next to the SQL:

```text
route handler:  read the JSON body -> check the title -> SELECT ... -> INSERT ... -> build the JSON response
```

It works, and three things become expensive. Testing the rule "no two notes with the same title" needs a running web server and a database. Offering the same feature in a terminal means copying the rule. Upgrading the framework or replacing the database means reading every handler, because the rule and the detail are in the same lines.

## The idea: imports point inward

The Clean Architecture, as described by Robert Martin and worked through in TypeScript by Otávio Lemos, arranges the code in concentric layers and states one rule about them, the **dependency rule**: a file may import only from its own layer or from a layer further in.

```text
            main (composition root)           knows everything, nothing imports it
   +--------------------------------------+
   |  drivers: Elysia, pg, clock, terminal |
   |  +--------------------------------+  |
   |  | adapters: controllers,         |  |
   |  | presenter, in-memory repository|  |
   |  |  +--------------------------+  |  |
   |  |  | use cases + their ports  |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  |   |     entities     |   |  |  |
   |  |  |   +------------------+   |  |  |
   |  |  +--------------------------+  |  |
   |  +--------------------------------+  |
   +--------------------------------------+
        every import arrow points toward the centre
```

| Layer | Holds | Changes when |
| --- | --- | --- |
| Entities | What is true of a note whatever the application: it has a valid title, a limited body, consistent dates | The business itself changes |
| Use cases | What this application does with notes, step by step, and the ports it needs | A feature of the application changes |
| Interface adapters | Translation between the outside format and the use-case format: controllers, presenters, simple repositories | The shape of a request or of a screen changes |
| Frameworks and drivers | The web framework, the database driver, the clock, the terminal | A tool is upgraded or replaced |
| Main | Configuration and the composition root | A different detail is chosen |

The layers further in are the ones that change least and that everything else depends on. The volatile things, frameworks and databases, sit at the edge where nothing depends on them.

## Calls go both ways, imports do not

The rule is about source code, not about run time. When a note is created over HTTP, control goes in and comes back out:

```text
Elysia route -> NoteHttpController -> CreateNote -> NoteRepository.save() -> PostgresNoteRepository -> pg
   (driver)        (adapter)          (use case)        (port)                  (driver)
```

The use case calls the database, yet `create-note.ts` does not import `postgres-note-repository.ts`. It imports `ports.ts`, an interface declared in its own layer, and `PostgresNoteRepository` implements that interface from the outside. This is **dependency inversion**: at the boundary, the import arrow runs against the direction of the call. **Dependency injection** is only the mechanism that delivers the implementation, here a constructor parameter. No container is used.

## Entities and use cases

`Title` is a value object and `Note` is an entity. Both have private constructors and a `create` factory that returns a `Result`, so an invalid note cannot be built, and whoever receives a `Note` does not validate it again. Expected failures are return values (`invalid-title`, `duplicate-title`, `note-not-found`). Exceptions are kept for what nobody expected.

Two rules that look alike live in different layers:

- "A title is not empty and has at most 80 characters" is true of any note: entity.
- "No two notes have the same title" is a choice of this application and needs to look at the other notes: use case, through the repository.

Where a rule goes is a design decision. The test is to ask whether the rule would hold in another application built on the same concept.

A use case returns a `NoteData` DTO, not the entity, and knows no status code, no exit code and no `console`. The clock and the id generator are ports as well, which is what lets a test compare a whole result with an exact expected value.

## Adapters, drivers and the composition root

`NoteHttpController` declares its own `HttpRequest` and `HttpResponse` types, so it never imports Elysia. It checks the shape of the input with Zod, calls a use case, and maps the result: `duplicate-title` becomes 409 here, and exit code 1 in `NoteCliController`. The two controllers are the proof that the use cases are independent of the delivery mechanism: the second one was added without touching `use-cases/`.

In hexagonal terms the controllers are driving adapters (they call the application) and the repositories are driven adapters (the application calls them through a port). One port has two adapters, a `Map` and PostgreSQL, and one contract test file runs against both.

Following Lemos, an adapter that talks directly to an external library belongs to the outermost layer. That is why the PostgreSQL repository is in `drivers/`, and why the automated check allows `adapters/` to import only Zod.

`main/composition.ts` is the only file that names a concrete repository. It builds the object graph once and hands it to the entry points. Environment variables are read and validated in `main/config.ts` and travel inward as plain values.

## Three claims, three checks

| Claim | How it is checked |
| --- | --- |
| No inner layer imports an outer one | `bun run check:layers`, part of the default command of the test container. `tests/unit/dependency-rule.test.ts` adds one forbidden `import type` to a copy of the source and expects exit code 1 |
| Use cases are tested without database or HTTP server | The `ts-test` container has `network_mode: "none"` and runs every use-case test |
| Replacing the repository changes only the composition root | The diff in the README touches only `src/main/`. `tests/unit/swap.test.ts` fails if another file names a concrete repository |

The import check counts `import type` too. A type-only import vanishes at run time, but the inner file can no longer be compiled or understood without the outer one, and that is the dependency the rule forbids.

## What it costs, and when not to use it

- More files and more indirection. A feature touches an entity, a use case, a controller and maybe a repository. For a program of a few hundred lines this is overhead with no return.
- Interfaces pay off at the boundaries between layers. An interface for every class inside a layer is overengineering.
- The port hides the storage technology, not its semantics. A `Map` and PostgreSQL differ in durability, in transactions and in what happens when two requests check the same title at once. Here the `UNIQUE` constraint is the last line of defence for that race.
- Replacing a database still means migrating data. The architecture reduces the code that changes, not the operational work.
- The dependency check of this project is a didactic scanner based on regular expressions. Use a lint rule or a compiler-based tool in production code.

## Try it

1. Add `import type { HttpResponse } from "../adapters/note-http-controller";` to a use case and run `docker compose run --rm ts-test`.
2. Add a `count` command to the terminal only. Which layers did you edit?
3. Write a third repository that stores the notes in a JSON file, make it pass `describeNoteRepositoryContract`, and plug it in. Compare your diff with the one in the README.
4. Move the duplicate-title rule into the entity. What does the entity now need that it did not need before?

## Sources

- Otávio Lemos, *Arquitetura Limpa na Prática*: chapters 3 (the layers and the dependency rule), 6 (entities), 7 (use cases), 8 (interface adapters), 9 (frameworks and drivers) and 10 (main and configuration). Summary in `references/summaries/books/arquitetura-limpa-na-pratica-otavio-lemos.md`.
- Sommerville, *Software Engineering*, 9th edition, chapter 6 (architectural design, the layered pattern).
