# PLAN

Main roadmap of the repository. It is built in two stages:

- **Stage 1 (this version):** the outline of every part, with the foundation, the quiz app, the first wave of quiz content and the first wave of mini-projects detailed down to micro-tasks.
- **Stage 2:** the remaining 26 areas detailed to the same level, after the owner reviews the format of Stage 1.

The decisions behind this plan are in [docs/en/decisions.md](docs/en/decisions.md), the quiz design in [docs/en/quiz.md](docs/en/quiz.md), the backlog in [docs/en/mini-project-catalog.md](docs/en/mini-project-catalog.md) and the brainstorming record in [docs/en/brainstorming.md](docs/en/brainstorming.md).

## Phases

- [x] Phase 0: repository setup
- [x] Phase 1: import content from the previous repositories and external skills
- [x] Phase 2: brainstorming and documented decisions
- [ ] Phase 3: full PLAN.md
	- [x] Stage 1: outline, foundation, quiz app, first waves
	- [ ] Stage 2: remaining 26 areas detailed
- [ ] Phase 4: parallel development (up to 5 git worktrees, one work item each)

## How to read this plan

- Every item has an ID. `F` is foundation, `QZ` the quiz app, `QC-<AREA>` the quiz content of an area, `MP-<AREA>-<n>` a mini-project.
- Levels: **task** (`F-1`), **sub-task** (`F-1.1`), **micro-task** (`F-1.1.a`).
- **Accept:** is the acceptance criterion. It is a command or an observable fact, never an opinion. A box is ticked only after the criterion was actually checked.
- Work items of the same wave are independent, so each can run in its own worktree.

### Definition of done: mini-project

A mini-project is done when all of these hold:

- [ ] Lives in `projects/<area>/<mini-project>/`, one subfolder per language.
- [ ] `README.md` (English) and `README.pt-BR.md` (Portuguese) explain what it teaches.
- [ ] `setup-unix-<project>.sh` and `setup-windows-<project>.ps1` bring it up needing only Docker.
- [ ] Demo or benchmark runs with one documented command.
- [ ] Automated tests pass inside Docker.
- [ ] Linter and formatter of each language pass with no warnings.
- [ ] Bilingual didactic comments, one block per concept.
- [ ] Documented in `docs/en/<area>/` and `docs/pt/<area>/`.
- [ ] Docker images and dependencies pinned to exact stable versions.
- [ ] `CHANGELOG.md` entry added.

### Definition of done: quiz area

A quiz area is done when all of these hold:

- [ ] Coverage map committed in `quiz/content/<area>/coverage.json` (topics, source chapters, target count per topic).
- [ ] At least 100 questions, and every topic of the coverage map reaches its target.
- [ ] Difficulty split close to 40 basic, 40 intermediate, 20 advanced.
- [ ] Every question has 5 alternatives, one correct, an explanation for each alternative, a `source`, and texts in PT and EN.
- [ ] `bun run quiz:validate` passes for the area.
- [ ] Independent reviewer answered the whole area without the answer key, and every disagreement was resolved and logged in `quiz/content/<area>/review.md`.
- [ ] No sentence copied from a book.

## Area index

31 areas. "Quiz wave" is the wave in which the area gets its 100 questions.

| Code | Area | Quiz wave | Mini-projects planned |
| --- | --- | --- | --- |
| BIGO | Big O and algorithm analysis | 1 | 3 |
| DS | Data structures | 1 | 5 |
| OS | Operating systems | 1 | 4 |
| NET | Networks | 1 | 3 |
| DB | Databases (theory) | 1 | 2 |
| ALG | Algorithms | 2 | 4 |
| CONC | Concurrency | 2 | 3 |
| PAR | Parallelism | 2 | 1 |
| TX | Transactions | 2 | 4 |
| SEC | Security | 2 | 8 |
| COMP | Compilers | 3 | 4 |
| FSM | State machines | 3 | 1 |
| INFO | Information theory | 3 | 2 |
| DL | Digital logic | 3 | 2 |
| ELEC | Electronics | 3 | 1 |
| OOP | Object-oriented programming | 4 | 2 |
| FP | Functional programming | 4 | 1 |
| PAT | Design patterns and SOLID | 4 | 2 |
| ARCH | Software architecture | 4 | 1 |
| TEST | Testing | 4 | 5 |
| PROTO | Protocols | 5 | 3 |
| MSG | Messaging | 5 | 3 |
| LB | Load balancing | 5 | 2 |
| PERF | Performance | 5 | 3 |
| CACHE | Cache | 5 | 1 |
| RL | Rate limiting | 6 | 1 |
| FS | File systems | 6 | 2 |
| OBS | Observability | 6 | 4 |
| CHAIN | Blockchain | 6 | 1 |
| CI | Continuous integration | 6 | 1 |
| SE | Software engineering | 6 | 1 |

---

## Part F: Foundation

Shared tooling that every other part depends on. Done before any wave starts.

### F-1 Repository tooling

- [ ] **F-1.1** Root JS/TS workspace
	- [ ] F-1.1.a Root `package.json` with Bun workspaces for `quiz` and `tools/*`.
	- [ ] F-1.1.b Biome v2 config at the root (tabs, width 4), pinned exactly.
	- **Accept:** `bun install` and `bunx biome check .` exit 0 on a fresh clone.
- [ ] **F-1.2** Formatter configuration for the other ecosystems
	- [ ] F-1.2.a `ruff.toml`, `rustfmt.toml`, `.clang-format`, `.golangci.yml`, `.formatter.exs`, spotless config.
	- **Accept:** each file exists and its tool runs against an empty sample project without error.
- [ ] **F-1.3** Pinned Docker base images
	- [ ] F-1.3.a `docker/` with one Dockerfile per language, each on a fixed version tag.
	- [ ] F-1.3.b `docs/en/environment.md` and `docs/pt/environment.md` listing image and version per language.
	- **Accept:** `docker build` succeeds for the 7 images and none uses `latest`.

### F-2 Benchmark harness

- [ ] **F-2.1** Benchmark contract
	- [ ] F-2.1.a JSON schema in `tools/bench/schema.json`: `n`, `elapsedMs`, `memoryKb`, `language`, `implementation`.
	- [ ] F-2.1.b Documented in `docs/en/benchmarks.md` and `docs/pt/benchmarks.md`.
	- **Accept:** a valid and an invalid sample file are accepted and rejected by the validator test.
- [ ] **F-2.2** Runner
	- [ ] F-2.2.a `tools/bench` (TypeScript) runs hyperfine inside Docker for each implementation and collects the JSON files.
	- [ ] F-2.2.b Writes a Markdown table and a `results.json` for the static dashboard.
	- [ ] F-2.2.c Records machine, runtime versions and the exact command.
	- **Accept:** `bun run bench -- --project <sample>` produces both files, and running it twice gives the same row set.

### F-3 Mini-project template

- [ ] **F-3.1** Scaffold command
	- [ ] F-3.1.a `bun run new:project <area> <name> --langs ts,go` creates the folder, both READMEs, both setup scripts and a docker-compose file.
	- [ ] F-3.1.b Static dashboard template (HTML + Tailwind CSS v4) reading `results.json`.
	- **Accept:** a generated sample project passes its own setup script and its placeholder test on a machine with only Docker.

### F-4 Continuous integration

- [ ] **F-4.1** GitHub Actions workflow
	- [ ] F-4.1.a Lint and format check for every ecosystem.
	- [ ] F-4.1.b Quiz validation and quiz tests.
	- [ ] F-4.1.c Tests of each mini-project, run only when its folder changes.
	- **Accept:** a pull request with a formatting error fails, and the same pull request fixed passes.

---

## Part QZ: Quiz app

The main product. Design in [docs/en/quiz.md](docs/en/quiz.md).

### QZ-1 Scaffold

- [ ] **QZ-1.1** Next.js app in `quiz/` with static export and Tailwind CSS v4, versions pinned.
	- **Accept:** `bun run build` in `quiz/` produces `out/` and serving that folder shows the home page.
- [ ] **QZ-1.2** Docker image and setup scripts `setup-unix-quiz.sh` and `setup-windows-quiz.ps1`.
	- **Accept:** on a machine with only Docker, the script ends with the quiz reachable on `localhost`.

### QZ-2 Content model

- [ ] **QZ-2.1** Question schema
	- [ ] QZ-2.1.a Typed schema: `id`, `area`, `topic`, `difficulty`, `answer`, `source`, `miniProject`, `pt`, `en`.
	- [ ] QZ-2.1.b Each language block: statement, 5 alternatives, 5 explanations, concept, optional example.
	- **Accept:** unit tests reject a question with 4 alternatives, with two correct answers, with a missing explanation and with a missing language.
- [ ] **QZ-2.2** Coverage map schema (`coverage.json`): topic, source chapter, target count.
	- **Accept:** validator reports, per topic, target against actual count.
- [ ] **QZ-2.3** `bun run quiz:validate`
	- [ ] QZ-2.3.a Validates every file under `quiz/content/`.
	- [ ] QZ-2.3.b Fails on duplicate `id`, unknown `area`, and a `miniProject` path that does not exist.
	- **Accept:** exits 0 on the sample content and non-zero on each broken fixture.

### QZ-3 Question screen

- [ ] **QZ-3.1** Two-column grid: statement and 5 alternatives on the left, explanation on the right.
	- [ ] QZ-3.1.a Right column empty until an alternative is chosen.
	- [ ] QZ-3.1.b After answering: right and wrong marked, alternatives locked, "Next" enabled.
	- [ ] QZ-3.1.c Columns stack below 768 px.
	- **Accept:** Playwright test answers a question and sees the explanation appear only after the click, at desktop and phone widths.
- [ ] **QZ-3.2** Explanation panel
	- [ ] QZ-3.2.a Concept and why the correct alternative is correct.
	- [ ] QZ-3.2.b One line per wrong alternative.
	- [ ] QZ-3.2.c Optional code example with syntax highlighting, or diagram.
	- [ ] QZ-3.2.d Links to the mini-project and to the source.
	- **Accept:** a fixture question with all fields renders the four parts, and one without example and mini-project renders without empty blocks.
- [ ] **QZ-3.3** Keyboard and accessibility: keys 1 to 5 or A to E choose, Enter goes to the next, focus is visible, colour is not the only signal.
	- **Accept:** Playwright completes a 3-question run using only the keyboard, and an automated accessibility check reports no violation.

### QZ-4 Navigation

- [ ] **QZ-4.1** Home page listing the areas with question count and progress.
- [ ] **QZ-4.2** Area page: start, filter by difficulty, review wrong answers.
- [ ] **QZ-4.3** Result page at the end of a run: score and list of wrong questions.
	- **Accept:** Playwright goes home, area, run of 3 questions, result, and the score matches the answers given.

### QZ-5 Features

- [ ] **QZ-5.1** Progress saved in the browser (`localStorage`), per area, with a reset button.
	- **Accept:** answers survive a page reload, and reset clears them.
- [ ] **QZ-5.2** "Review only the ones I got wrong" mode: a question leaves the list when answered correctly.
	- **Accept:** test with 2 wrong answers shows exactly those 2, and 0 after both are answered correctly.
- [ ] **QZ-5.3** Difficulty filter (basic, intermediate, advanced).
	- **Accept:** each filter shows only questions of that level.
- [ ] **QZ-5.4** Shuffle of questions and of alternatives on every attempt, keeping the answer key correct.
	- **Accept:** unit test with a fixed seed proves the correct alternative is still marked correct after shuffling.

### QZ-6 Languages

- [ ] **QZ-6.1** PT and EN selector, for interface and content, remembered in the browser.
	- **Accept:** switching language in the middle of a question keeps the question and the chosen answer.

### QZ-7 Content pipeline

- [ ] **QZ-7.1** Authoring guide in `docs/en/quiz-authoring.md` and `docs/pt/quiz-authoring.md`: how to write a question, how wrong alternatives encode real misconceptions, the no-copy rule.
- [ ] **QZ-7.2** Reviewer procedure: a second agent receives the questions without `answer` and without explanations, answers them, and a script lists the disagreements.
	- [ ] QZ-7.2.a `bun run quiz:blind <area>` exports the blind file.
	- [ ] QZ-7.2.b `bun run quiz:compare <area> <answers>` writes `review.md` with every disagreement.
	- **Accept:** on a fixture with one deliberately wrong answer key, the comparison lists exactly that question.

### QZ-8 Tests and documentation

- [ ] **QZ-8.1** Unit tests for schema, shuffle, progress and scoring.
- [ ] **QZ-8.2** Playwright end-to-end tests for the flows of QZ-3 to QZ-6.
- [ ] **QZ-8.3** `quiz/README.md` and `quiz/README.pt-BR.md`.
	- **Accept:** `bun test` and `bunx playwright test` pass inside Docker.

---

## Part QC: Quiz content

100 questions per area. Each wave has 5 areas (the last one has 6). Every area follows the same four tasks:

1. `coverage.json` written and reviewed.
2. Questions written, topic by topic, in PT and EN.
3. `quiz:validate` passing.
4. Blind review done and disagreements resolved.

### Wave 1 (proposed)

Chosen because these five have the strongest source material (university lectures and the reference textbooks).

#### QC-BIGO Big O and algorithm analysis

Sources: USP Algorithm Analysis lectures (`references/summaries/usp/algorithm-analysis-part-1.md`, `part-2.md`).

| Topic | Questions |
| --- | --- |
| Asymptotic notation: O, Ω, Θ, o, ω | 15 |
| Growth of functions and their ordering | 8 |
| Counting operations in loops and nested loops | 10 |
| Recurrences and the master theorem | 14 |
| Loop invariants and proof of correctness | 8 |
| Best, worst and average case | 8 |
| Amortised analysis | 7 |
| Lower bound of comparison sorting, Ω(n lg n) | 8 |
| Space complexity | 6 |
| P, NP and intractability, at an introductory level | 6 |
| Complexity of common data structure operations | 10 |

- [ ] QC-BIGO.1 Coverage map committed
- [ ] QC-BIGO.2 100 questions written (PT and EN)
- [ ] QC-BIGO.3 Validation passing
- [ ] QC-BIGO.4 Blind review resolved

#### QC-DS Data structures

Sources: USP Data Structures I and II lectures, Caelum and Laureano e-books.

| Topic | Questions |
| --- | --- |
| Abstract data types and encapsulation | 6 |
| Arrays and lists: sequential, linked, doubly linked, circular | 14 |
| Stacks | 8 |
| Queues and deques | 8 |
| Recursion and generalised lists | 5 |
| Binary trees and traversals | 10 |
| Binary search trees | 8 |
| AVL trees | 8 |
| Red-black trees | 6 |
| Heaps and priority queues | 7 |
| Hash tables: collisions, load factor, rehashing | 10 |
| Graphs: representations, BFS and DFS | 10 |

- [ ] QC-DS.1 Coverage map committed
- [ ] QC-DS.2 100 questions written (PT and EN)
- [ ] QC-DS.3 Validation passing
- [ ] QC-DS.4 Blind review resolved

#### QC-OS Operating systems

Sources: Tanenbaum, Modern Operating Systems (4th edition) and the MINIX book.

| Topic (book chapter) | Questions |
| --- | --- |
| Introduction, concepts and system calls (1) | 10 |
| Processes and threads (2) | 14 |
| Interprocess communication and synchronisation (2) | 12 |
| Scheduling (2) | 10 |
| Memory management: paging, TLB, page replacement, segmentation (3) | 16 |
| File systems (4) | 12 |
| Input and output: interrupts, drivers, disks, RAID (5) | 10 |
| Deadlocks (6) | 8 |
| Virtualisation and the cloud (7) | 4 |
| Multiple processor systems (8) | 2 |
| Security (9) | 2 |

- [ ] QC-OS.1 Coverage map committed
- [ ] QC-OS.2 100 questions written (PT and EN)
- [ ] QC-OS.3 Validation passing
- [ ] QC-OS.4 Blind review resolved

#### QC-NET Networks

Source: Tanenbaum, Computer Networks (5th edition).

| Topic (book chapter) | Questions |
| --- | --- |
| Introduction, OSI and TCP/IP reference models (1) | 10 |
| Physical layer (2) | 10 |
| Data link layer: framing, error detection and correction, sliding window (3) | 14 |
| Medium access control: ALOHA, CSMA, Ethernet, wireless, switching (4) | 12 |
| Network layer: routing, congestion, IP, subnets, NAT, IPv6 (5) | 20 |
| Transport layer: UDP, TCP, congestion control (6) | 16 |
| Application layer: DNS, e-mail, the Web, streaming, content delivery (7) | 12 |
| Network security (8) | 6 |

- [ ] QC-NET.1 Coverage map committed
- [ ] QC-NET.2 100 questions written (PT and EN)
- [ ] QC-NET.3 Validation passing
- [ ] QC-NET.4 Blind review resolved

#### QC-DB Databases (theory)

Source: C. J. Date, An Introduction to Database Systems. The summary of this book groups chapters by theme, so the map below is by theme and is refined into chapters in QC-DB.1.

| Topic | Questions |
| --- | --- |
| Overview and architecture of a database system | 8 |
| Relational model: relations, keys, integrity | 14 |
| Relational algebra | 12 |
| Relational calculus and SQL | 12 |
| Functional dependencies and normalisation (1NF to BCNF, 4NF, 5NF) | 16 |
| Semantic modelling and entity-relationship | 8 |
| Transactions and recovery | 10 |
| Concurrency: locking and isolation | 10 |
| Security and integrity | 4 |
| Query optimisation and indexes | 6 |

- [ ] QC-DB.1 Coverage map committed
- [ ] QC-DB.2 100 questions written (PT and EN)
- [ ] QC-DB.3 Validation passing
- [ ] QC-DB.4 Blind review resolved

### Waves 2 to 6 (coverage maps written in Stage 2)

- [ ] **Wave 2:** QC-ALG, QC-CONC, QC-PAR, QC-TX, QC-SEC
- [ ] **Wave 3:** QC-COMP, QC-FSM, QC-INFO, QC-DL, QC-ELEC
- [ ] **Wave 4:** QC-OOP, QC-FP, QC-PAT, QC-ARCH, QC-TEST
- [ ] **Wave 5:** QC-PROTO, QC-MSG, QC-LB, QC-PERF, QC-CACHE
- [ ] **Wave 6:** QC-RL, QC-FS, QC-OBS, QC-CHAIN, QC-CI, QC-SE

---

## Part MP: Mini-projects

### Wave 1 (detailed)

#### MP-ALG-1 Sorting race

Teaches: how the same algorithms behave across languages and input shapes, and how measured time relates to Big O.

- [ ] **MP-ALG-1.1** Algorithms in TypeScript (reference): bubble, insertion, merge, quick, heap, radix
	- [ ] MP-ALG-1.1.a One file per algorithm, pure function, no library sort.
	- [ ] MP-ALG-1.1.b Property test: output is sorted and is a permutation of the input.
	- **Accept:** tests pass for empty, single-element, sorted, reversed, duplicated and random inputs.
- [ ] **MP-ALG-1.2** Same algorithms in C++, Python, Java, Elixir, Rust and Go
	- [ ] MP-ALG-1.2.a Each language reads the shared input file and prints the benchmark contract JSON.
	- [ ] MP-ALG-1.2.b Each language has the same test cases as the reference.
	- **Accept:** all 7 implementations produce the same sorted output for the same input file (checksum equal).
- [ ] **MP-ALG-1.3** Benchmark
	- [ ] MP-ALG-1.3.a Input generator with a fixed seed: random, sorted and reversed, sizes 10^3 to 10^6.
	- [ ] MP-ALG-1.3.b Quadratic algorithms capped at a size documented in the README.
	- **Accept:** `bun run bench -- --project sorting-race` writes the table, and merge sort time grows less than 2.5 times when `n` doubles.
- [ ] **MP-ALG-1.4** Static dashboard: time against `n`, one line per algorithm, selector per language.
	- **Accept:** opening the page with the committed `results.json` shows the chart with no network request.
- [ ] **MP-ALG-1.5** Definition of done for mini-projects met.

#### MP-CONC-1 Counter race condition

Teaches: why unsynchronised shared state loses updates, and four ways to fix it.

- [ ] **MP-CONC-1.1** Buggy version in Go, Rust (with `unsafe` clearly labelled), Java and TypeScript (worker threads with shared memory)
	- **Accept:** a test that increments 1,000,000 times from 8 workers observes a final value below 1,000,000 in at least 9 of 10 runs.
- [ ] **MP-CONC-1.2** Fixes
	- [ ] MP-CONC-1.2.a Mutex.
	- [ ] MP-CONC-1.2.b Atomic operation.
	- [ ] MP-CONC-1.2.c Channel or message passing.
	- [ ] MP-CONC-1.2.d Actor (Elixir process as the owner of the state).
	- **Accept:** every fixed version reaches exactly 1,000,000 in 100 consecutive runs.
- [ ] **MP-CONC-1.3** Race detector: Go `-race` and Java tooling flag the buggy version and are silent on the fixes.
	- **Accept:** the detector output is captured in the test log for both cases.
- [ ] **MP-CONC-1.4** Benchmark of the four fixes: throughput by number of workers.
	- **Accept:** table committed with 1, 2, 4 and 8 workers per fix and per language.
- [ ] **MP-CONC-1.5** Definition of done for mini-projects met.

#### MP-SEC-1 SQL injection lab

Teaches: why string concatenation in queries is exploitable and how parameterised queries prevent it. Local only, per `.claude/rules/security-labs.md`.

- [ ] **MP-SEC-1.1** Environment
	- [ ] MP-SEC-1.1.a docker-compose with an `internal: true` network, app port bound to `127.0.0.1`.
	- [ ] MP-SEC-1.1.b PostgreSQL seeded with obviously fake data.
	- **Accept:** from inside the app container, a request to an external host fails.
- [ ] **MP-SEC-1.2** Vulnerable version (ElysiaJS, raw concatenated SQL), in a folder and files named `vulnerable`.
	- [ ] MP-SEC-1.2.a Login bypass.
	- [ ] MP-SEC-1.2.b Data exposure through a search field.
	- **Accept:** an automated test demonstrates both flaws against the vulnerable version.
- [ ] **MP-SEC-1.3** Fixed version: parameterised queries, input validation, least-privilege database user.
	- **Accept:** the same tests that succeed against the vulnerable version fail to exploit the fixed one, and normal use still works.
- [ ] **MP-SEC-1.4** Documentation: why it happens, how to prevent it, what does not work as a fix (blocklists, escaping by hand).
	- **Accept:** both READMEs have the three sections, and no payload targets anything outside the lab.
- [ ] **MP-SEC-1.5** Definition of done for mini-projects met.

#### MP-COMP-1 Mini language: lexer and parser

Teaches: how source text becomes tokens and then a tree. First step of the compiler track (interpreter and bytecode VM come later).

- [ ] **MP-COMP-1.1** Language definition: numbers, strings, booleans, variables, arithmetic and comparison operators, `if`, `while`, functions.
	- **Accept:** grammar written in the README in EBNF, with one example program per construct.
- [ ] **MP-COMP-1.2** Lexer in TypeScript
	- [ ] MP-COMP-1.2.a Tokens carry type, text, line and column.
	- [ ] MP-COMP-1.2.b Errors report line and column.
	- **Accept:** tests cover every token type, comments, and an unterminated string.
- [ ] **MP-COMP-1.3** Parser in TypeScript (recursive descent, Pratt parsing for expressions)
	- [ ] MP-COMP-1.3.a Operator precedence and associativity.
	- [ ] MP-COMP-1.3.b Syntax errors with position, parser does not stop at the first one.
	- **Accept:** tests prove `1 + 2 * 3` and `(1 + 2) * 3` give different trees, and a file with two errors reports both.
- [ ] **MP-COMP-1.4** Demo: REPL that prints the tokens and the tree of each line.
	- **Accept:** one command starts the REPL in Docker, and a recorded session is in the README.
- [ ] **MP-COMP-1.5** Definition of done for mini-projects met.

#### MP-MSG-1 Queue comparison

Teaches: what changes when the same task runs on BullMQ, RabbitMQ, Kafka and SQS. Rebuilds the legacy `message-queues-pubsub` project.

- [ ] **MP-MSG-1.1** Common task and interface: an "order placed" message that triggers a simulated e-mail, with one producer and one consumer interface.
	- **Accept:** the four adapters implement the same TypeScript interface, checked by the compiler.
- [ ] **MP-MSG-1.2** Adapters
	- [ ] MP-MSG-1.2.a BullMQ on Redis.
	- [ ] MP-MSG-1.2.b RabbitMQ.
	- [ ] MP-MSG-1.2.c Kafka.
	- [ ] MP-MSG-1.2.d SQS on LocalStack.
	- **Accept:** an integration test per adapter sends 1,000 messages and the consumer receives 1,000.
- [ ] **MP-MSG-1.3** Behaviour experiments
	- [ ] MP-MSG-1.3.a Ordering: are messages received in the order sent?
	- [ ] MP-MSG-1.3.b Redelivery: consumer crashes before acknowledging.
	- **Accept:** a table in the README states, per broker, the observed result of each experiment, produced by a test.
- [ ] **MP-MSG-1.4** Throughput benchmark, all brokers local in docker-compose.
	- **Accept:** table with messages per second per broker, with the machine and versions recorded.
- [ ] **MP-MSG-1.5** Definition of done for mini-projects met.

### Remaining mini-projects (detailed in Stage 2)

One checkbox per mini-project. Source of the list: [mini-project catalog](docs/en/mini-project-catalog.md).

**BIGO**
- [ ] MP-BIGO-1 Big O lab: measure a function and fit the curve
- [ ] MP-BIGO-2 Interactive master theorem
- [ ] MP-BIGO-3 The Ω(n lg n) bound with a decision tree

**ALG**
- [ ] MP-ALG-2 Dynamic programming: knapsack, LCS, coin change
- [ ] MP-ALG-3 Travelling salesman: brute force against heuristic
- [ ] MP-ALG-4 Hybrid quicksort: threshold and pivot strategies

**DS**
- [ ] MP-DS-1 Hash map from scratch
- [ ] MP-DS-2 Graphs: Dijkstra, Bellman-Ford, topological sort, spanning tree
- [ ] MP-DS-3 B-tree on disk
- [ ] MP-DS-4 LRU cache, bloom filter and trie
- [ ] MP-DS-5 BST against AVL and red-black trees

**COMP**
- [ ] MP-COMP-2 Tree-walking interpreter
- [ ] MP-COMP-3 Bytecode VM in Rust
- [ ] MP-COMP-4 Regex engine: NFA to DFA

**FSM, INFO**
- [ ] MP-FSM-1 Order state machine
- [ ] MP-INFO-1 Huffman and LZ77
- [ ] MP-INFO-2 Error detection and correction: CRC and Hamming

**CONC, PAR**
- [ ] MP-CONC-2 Deadlock: dining philosophers
- [ ] MP-CONC-3 10 thousand connections
- [ ] MP-PAR-1 Scaling by cores and Amdahl's law

**TX, DB**
- [ ] MP-TX-1 Isolation levels in PostgreSQL
- [ ] MP-TX-2 Overselling at checkout
- [ ] MP-TX-3 Prisma, Drizzle and raw SQL
- [ ] MP-TX-4 Outbox and saga
- [ ] MP-DB-1 Mini relational DBMS with three join algorithms
- [ ] MP-DB-2 Normalisation tool

**LB, PERF, PROTO, CACHE, RL**
- [ ] MP-LB-1 NGINX against Caddy
- [ ] MP-LB-2 Hand-written L7 load balancer
- [ ] MP-PERF-1 Bun against Node, with and without PM2 cluster
- [ ] MP-PERF-2 k6 load, stress, spike and soak scenarios on a local API
- [ ] MP-PERF-3 Naive against blocked matrix multiplication
- [ ] MP-PROTO-1 REST, GraphQL and JSON-RPC on the same API
- [ ] MP-PROTO-2 HTTP/1.1, HTTP/2 and HTTP/3
- [ ] MP-PROTO-3 HTTP server on raw TCP
- [ ] MP-CACHE-1 Cache strategies and stampede
- [ ] MP-RL-1 Rate limiter algorithms

**MSG**
- [ ] MP-MSG-2 Idempotency and dead-letter queue
- [ ] MP-MSG-3 Queue against pub/sub, with backpressure

**OOP, FP, PAT, ARCH**
- [ ] MP-OOP-1 Same domain in OOP and functional style
- [ ] MP-OOP-2 Executable code smell catalogue
- [ ] MP-FP-1 Pure functions with property-based tests
- [ ] MP-PAT-1 About 10 back-end patterns
- [ ] MP-PAT-2 SOLID before and after
- [ ] MP-ARCH-1 The same application in clean architecture layers

**SEC**
- [ ] MP-SEC-2 XSS and CSP
- [ ] MP-SEC-3 CSRF
- [ ] MP-SEC-4 Broken access control (IDOR)
- [ ] MP-SEC-5 SSRF
- [ ] MP-SEC-6 Passwords and sessions
- [ ] MP-SEC-7 Common JWT mistakes
- [ ] MP-SEC-8 Upload and path traversal

**TEST**
- [ ] MP-TEST-1 Full test pyramid on one app
- [ ] MP-TEST-2 TDD kata with commit history (multi-currency money)
- [ ] MP-TEST-3 Mutation testing
- [ ] MP-TEST-4 Flaky test lab
- [ ] MP-TEST-5 Mini xUnit from scratch

**OBS**
- [ ] MP-OBS-1 Three services with traces, metrics and logs
- [ ] MP-OBS-2 Structured logs and correlation id
- [ ] MP-OBS-3 SLO and alert
- [ ] MP-OBS-4 Profiling with a flame graph

**OS, NET, FS**
- [ ] MP-OS-1 CPU scheduling simulator
- [ ] MP-OS-2 Paging and TLB simulator
- [ ] MP-OS-3 Memory allocator
- [ ] MP-OS-4 Deadlock detector, banker's algorithm and mini shell
- [ ] MP-NET-1 Sliding-window protocols and mini TCP over UDP
- [ ] MP-NET-2 ALOHA and CSMA/CD simulator
- [ ] MP-NET-3 DNS resolver and subnet calculator
- [ ] MP-FS-1 File organisation, indexes and compression
- [ ] MP-FS-2 External sorting

**DL, ELEC, CHAIN, CI, SE**
- [ ] MP-DL-1 Logic gates, Karnaugh minimisation and adder
- [ ] MP-DL-2 NAND-only ALU and 4-bit mini CPU
- [ ] MP-ELEC-1 Circuit calculators and simulators
- [ ] MP-CHAIN-1 Didactic blockchain
- [ ] MP-CI-1 CI pipeline for this repository (same work as F-4, documented as a lesson)
- [ ] MP-SE-1 Schedule simulator and estimate tracker

---

## Suggested order of execution

1. Part F (foundation), then Part QZ (quiz app). These unblock everything else.
2. Quiz content wave 1 (5 areas, 5 worktrees).
3. Mini-project wave 1 (5 mini-projects, 5 worktrees).
4. Quiz content waves 2 to 6, alternating with mini-project waves, breadth first: every area gets one mini-project before any area gets its second.
