# Project decisions

> Versão em português: [docs/pt/decisions.md](../pt/decisions.md)

Decisions taken in the Phase 2 brainstorming on 2026-10-07. They are the input for `PLAN.md`. The list of mini-projects per area is in the [mini-project catalog](mini-project-catalog.md), the quiz design in [quiz.md](quiz.md), and the questions asked with the discarded options in the [brainstorming record](brainstorming.md).

## Quiz

The main product of the repository is a **quiz**: one app covering every area, with 5 alternatives per question and the explanation of the concept shown next to the question after the answer. The mini-projects stay in the plan and each explanation links to the mini-project that demonstrates the concept. At least 100 questions per area, in Portuguese and English. Full design in [quiz.md](quiz.md).

## Structure

| Topic | Decision | Reason |
| --- | --- | --- |
| Folder layout | `projects/<area>/<mini-project>/`, with one subfolder per language (`ts/`, `go/`, `rust/`) | The same concept stays together and languages can be compared side by side |
| Languages per mini-project | One reference implementation in TypeScript, plus the languages in which the lesson changes | Implementing everything in all 7 languages multiplies the work without teaching more |
| Environment | Everything runs in Docker, with pinned image versions. Setup scripts require only Docker. A local toolchain is optional | Seven languages on one machine is where "works on my machine" comes from |
| README | Two files per mini-project: `README.md` (English) and `README.pt-BR.md` (Portuguese) | Each reader gets a full document in one language |
| Code comments | Bilingual, one block per concept, not line by line | Didactic without doubling the length of the code |
| Dashboards | One static page per mini-project (HTML + Tailwind CSS v4 reading the results JSON). Next.js only where the concept needs a server | Simple to open and to maintain |

## Benchmarks

- One contract for every implementation: read the same input, print JSON with at least `n`, elapsed time and memory.
- [hyperfine](https://github.com/sharkdp/hyperfine) measures the processes. It is the one benchmark tool added to the stack.
- A runner compares the JSON files and writes the result table. Results are committed as Markdown.
- Load tests keep using k6, and only against local services.

## Scope per area

| Area | Decision |
| --- | --- |
| Compilers | Lexer, parser, AST and tree-walking interpreter in TypeScript, a bytecode VM in Rust, and a regex engine (NFA to DFA) in Go. No WebAssembly or native code generation |
| Design patterns | A selection of about 10 patterns that show up in web back ends: Strategy, Observer, Factory, Adapter, Decorator, Repository, Command, State, Builder, and Singleton with the reasons to avoid it |
| Security | One isolated lab per flaw, each with its own docker-compose on an internal network: vulnerable version, fixed version and a test proving the fix |
| Observability | OpenTelemetry with Prometheus, Grafana, Loki and Tempo, all local in docker-compose. These four tools are added to the stack |

## Legacy projects

`references/projects/load-stress-tests` and `references/projects/message-queues-pubsub` are **rebuilt as new mini-projects**, not ported. The old code stays in `references/` for consultation. In the rebuilt versions the serverless API runs on LocalStack and the load generators become local k6 scenarios.

## Extra areas

Eight areas suggested by the imported material were added to the plan: cache, rate limiter, file systems, digital logic, networks, operating systems, a didactic blockchain, and CI for this repository with GitHub Actions.

Four more came from the books: electronics, software architecture, database theory and software engineering. The plan has 31 areas.

## Images

The 120 images in `references/images/` are not tracked by git. Several are third-party infographics that cannot be redistributed under MIT. The folder is git-ignored and stays only on the owner's machine.

## Order of work

- **Quiz first**: the quiz app and 5 complete areas (100 questions each), then the remaining areas in waves of 5.
- **First wave of mini-projects** (5 mini-projects, one worktree each): sorting race, race-condition lab, SQL injection lab, lexer and parser of the mini language, queue comparison.
- **After that, breadth first**: one mini-project per area until every area has at least one, then go deeper.
