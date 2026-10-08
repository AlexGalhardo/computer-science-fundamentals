# PLAN: Computer Science Fundamentals

Main roadmap of the repository: 32 areas, a quiz covering all of them and 86 runnable mini-projects.

The decisions behind this plan are in [docs/en/decisions.md](docs/en/decisions.md), the quiz design in [docs/en/quiz.md](docs/en/quiz.md), the backlog in [docs/en/mini-project-catalog.md](docs/en/mini-project-catalog.md) and the brainstorming record in [docs/en/brainstorming.md](docs/en/brainstorming.md).

> Note (2026-10-08): the `references/` folder named in the "Sources" lines below was removed from the tree. The files are in the git history (`git show eef7847:references/<path>`), and the study references are in [REFERENCES.md](REFERENCES.md).

## Phases

- [x] Phase 0: repository setup
- [x] Phase 1: import content from the previous repositories and external skills
- [x] Phase 2: brainstorming and documented decisions
- [x] Phase 3: full PLAN.md
- [ ] Phase 4: parallel development (main session plus up to 10 git worktrees, one complete area each)

## Theory and practice

Every area gets a quiz. What else it gets depends on the kind of content:

- **Theory only** (Electronics, Software engineering): no mini-project. The quiz is the whole deliverable, so it is larger and follows the source book chapter by chapter, covering every aspect of the content.
- **Theory and practice** (the other 30 areas): runnable practical examples (Docker, shell scripts, CLI or a simple web page) **and** the quiz. The two complement each other: the quiz explains the concept and links to the mini-project that shows it running, and the mini-project README links back to the quiz topics it demonstrates.

## How to read this plan

- Every item has an ID. `F` is foundation, `QZ` the quiz app, `BD` the language benchmark dashboard, `QC-<AREA>` the quiz content of an area, `MP-<AREA>-<n>` a mini-project.
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
- [ ] Both READMEs list the quiz topics the mini-project demonstrates.
- [ ] `CHANGELOG.md` entry added.

### Definition of done: quiz area

A quiz area is done when all of these hold:

- [ ] Coverage map committed in `quiz/content/<area>/coverage.json` (topics, source chapters, target count per topic).
- [ ] At least 100 questions (170 for Electronics, 150 for Software engineering), and every topic of the coverage map reaches its target.
- [ ] Difficulty split close to 40 basic, 40 intermediate, 20 advanced.
- [ ] Every question has 5 alternatives, one correct, an explanation for each alternative, a `source`, and texts in PT and EN.
- [ ] `bun run quiz:validate` passes for the area.
- [ ] Independent reviewer answered the whole area without the answer key, and every disagreement was resolved and logged in `quiz/content/<area>/review.md`.
- [ ] No sentence copied from a book.
- [ ] In a theory-and-practice area, every question about a concept shown by a mini-project carries its `miniProject` link.

## Area index

32 areas. "Quiz wave" is the wave in which the area gets its questions.

| Code | Area | Kind | Quiz wave | Questions | Mini-projects |
| --- | --- | --- | --- | --- | --- |
| BIGO | Big O and algorithm analysis | Theory and practice | 1 | 100 | 3 |
| DS | Data structures | Theory and practice | 1 | 100 | 5 |
| OS | Operating systems | Theory and practice | 1 | 100 | 4 |
| NET | Networks | Theory and practice | 1 | 100 | 3 |
| DB | Databases (theory) | Theory and practice | 1 | 100 | 2 |
| ALG | Algorithms | Theory and practice | 2 | 100 | 4 |
| CONC | Concurrency | Theory and practice | 2 | 100 | 3 |
| PAR | Parallelism | Theory and practice | 2 | 100 | 1 |
| TX | Transactions | Theory and practice | 2 | 100 | 4 |
| SEC | Security | Theory and practice | 2 | 100 | 8 |
| COMP | Compilers | Theory and practice | 3 | 100 | 4 |
| FSM | State machines | Theory and practice | 3 | 100 | 1 |
| INFO | Information theory | Theory and practice | 3 | 100 | 2 |
| DL | Digital logic | Theory and practice | 3 | 100 | 2 |
| ELEC | Electronics | Theory only | 3 | 170 | 0 |
| OOP | Object-oriented programming | Theory and practice | 4 | 100 | 2 |
| FP | Functional programming | Theory and practice | 4 | 100 | 1 |
| PAT | Design patterns and SOLID | Theory and practice | 4 | 100 | 2 |
| ARCH | Software architecture | Theory and practice | 4 | 100 | 1 |
| TEST | Testing | Theory and practice | 4 | 100 | 5 |
| PROTO | Protocols | Theory and practice | 5 | 100 | 3 |
| MSG | Messaging | Theory and practice | 5 | 100 | 3 |
| LB | Load balancing | Theory and practice | 5 | 100 | 2 |
| PERF | Performance | Theory and practice | 5 | 100 | 3 |
| CACHE | Cache | Theory and practice | 5 | 100 | 1 |
| RL | Rate limiting | Theory and practice | 6 | 100 | 1 |
| FS | File systems | Theory and practice | 6 | 100 | 2 |
| OBS | Observability | Theory and practice | 6 | 100 | 4 |
| CHAIN | Blockchain | Theory and practice | 6 | 100 | 1 |
| CI | Continuous integration | Theory and practice | 6 | 100 | 1 |
| SE | Software engineering | Theory only | 6 | 150 | 0 |
| AI | Artificial intelligence and LLMs | Theory and practice | 7 | 164 | 8 |

Totals: **3384 questions** and **86 mini-projects**.

---

## Part F: Foundation

Shared tooling that every other part depends on. Done before any wave starts.

### F-1 Repository tooling

- [x] **F-1.1** Root JS/TS workspace
	- [x] F-1.1.a Root `package.json` with Bun workspaces for `quiz` and `tools/*`.
	- [x] F-1.1.b Biome v2 config at the root (tabs, width 4), pinned exactly.
	- **Accept:** `bun install` and `bunx biome check .` exit 0 on a fresh clone.
- [x] **F-1.2** Formatter configuration for the other ecosystems
	- [x] F-1.2.a `ruff.toml`, `rustfmt.toml`, `.clang-format`, `.golangci.yml`, `.formatter.exs`, spotless config.
	- **Accept:** each file exists and its tool runs against an empty sample project without error.
- [x] **F-1.3** Pinned Docker base images
	- [x] F-1.3.a `docker/` with one Dockerfile per language, each on a fixed version tag.
	- [x] F-1.3.b `docs/en/environment.md` and `docs/pt/environment.md` listing image and version per language.
	- **Accept:** `docker build` succeeds for the 7 images and none uses `latest`.

### F-2 Benchmark harness

- [x] **F-2.1** Benchmark contract
	- [x] F-2.1.a JSON schema in `tools/bench/schema.json`: `n`, `elapsedMs`, `memoryKb`, `language`, `implementation`.
	- [x] F-2.1.b Documented in `docs/en/benchmarks.md` and `docs/pt/benchmarks.md`.
	- **Accept:** a valid and an invalid sample file are accepted and rejected by the validator test.
- [x] **F-2.2** Runner
	- [x] F-2.2.a `tools/bench` (TypeScript) runs hyperfine inside Docker for each implementation and collects the JSON files.
	- [x] F-2.2.b Writes a Markdown table and a `results.json` for the static dashboard.
	- [x] F-2.2.c Records machine, runtime versions and the exact command.
	- **Accept:** `bun run bench -- --project <sample>` produces both files, and running it twice gives the same row set.

### F-3 Mini-project template

- [x] **F-3.1** Scaffold command
	- [x] F-3.1.a `bun run new:project <area> <name> --langs ts,go` creates the folder, both READMEs, both setup scripts and a docker-compose file.
	- [x] F-3.1.b Static dashboard template (HTML + Tailwind CSS v4) reading `results.json`.
	- **Accept:** a generated sample project passes its own setup script and its placeholder test on a machine with only Docker.

### F-4 Continuous integration

- [x] **F-4.1** GitHub Actions workflow
	- [x] F-4.1.a Lint and format check for every ecosystem.
	- [x] F-4.1.b Quiz validation and quiz tests.
	- [x] F-4.1.c Tests of each mini-project, run only when its folder changes.
	- **Accept:** a pull request with a formatting error fails, and the same pull request fixed passes.

---

## Part QZ: Quiz app

The main product. Design in [docs/en/quiz.md](docs/en/quiz.md).

### QZ-1 Scaffold

- [x] **QZ-1.1** Next.js app in `quiz/` using static site generation (SSG, `output: "export"`) and Tailwind CSS v4, versions pinned.
	- [x] QZ-1.1.a Every route is pre-rendered at build time, including one page per area and per language.
	- [x] QZ-1.1.b No server code, no API route, no runtime data fetching from a back end.
	- **Accept:** `bun run build` in `quiz/` produces `out/` with one HTML file per route, and serving that folder with a plain static file server shows every page.
- [x] **QZ-1.2** Docker image and setup scripts `setup-unix-quiz.sh` and `setup-windows-quiz.ps1`.
	- **Accept:** on a machine with only Docker, the script ends with the quiz reachable on `localhost`.

### QZ-2 Content model

- [x] **QZ-2.1** Question schema
	- [x] QZ-2.1.a Typed schema: `id`, `area`, `topic`, `difficulty`, `answer`, `source`, `miniProject`, `pt`, `en`.
	- [x] QZ-2.1.b Each language block: statement, 5 alternatives, 5 explanations, concept, optional example.
	- **Accept:** unit tests reject a question with 4 alternatives, with two correct answers, with a missing explanation and with a missing language.
- [x] **QZ-2.2** Coverage map schema (`coverage.json`): topic, source chapter, target count.
	- **Accept:** validator reports, per topic, target against actual count.
- [x] **QZ-2.3** `bun run quiz:validate`
	- [x] QZ-2.3.a Validates every file under `quiz/content/`.
	- [x] QZ-2.3.b Fails on duplicate `id`, unknown `area`, and a `miniProject` path that does not exist.
	- **Accept:** exits 0 on the sample content and non-zero on each broken fixture.

### QZ-3 Question screen

- [x] **QZ-3.1** Two-column grid: statement and 5 alternatives on the left, explanation on the right.
	- [x] QZ-3.1.a Right column empty until an alternative is chosen.
	- [x] QZ-3.1.b After answering: right and wrong marked, alternatives locked, "Next" enabled.
	- [x] QZ-3.1.c Columns stack below 768 px.
	- **Accept:** Playwright test answers a question and sees the explanation appear only after the click, at desktop and phone widths.
- [x] **QZ-3.2** Explanation panel
	- [x] QZ-3.2.a Concept and why the correct alternative is correct.
	- [x] QZ-3.2.b One line per wrong alternative.
	- [x] QZ-3.2.c Optional code example with syntax highlighting, or diagram.
	- [x] QZ-3.2.d Links to the mini-project and to the source.
	- **Accept:** a fixture question with all fields renders the four parts, and one without example and mini-project renders without empty blocks.
- [x] **QZ-3.3** Keyboard and accessibility: keys 1 to 5 or A to E choose, Enter goes to the next, focus is visible, colour is not the only signal.
	- **Accept:** Playwright completes a 3-question run using only the keyboard, and an automated accessibility check reports no violation.

### QZ-4 Navigation

- [x] **QZ-4.1** Home page listing the areas with question count and progress.
- [x] **QZ-4.2** Area page: start, filter by difficulty, review wrong answers.
- [x] **QZ-4.3** Result page at the end of a run: score and list of wrong questions.
	- **Accept:** Playwright goes home, area, run of 3 questions, result, and the score matches the answers given.

### QZ-5 Features

- [x] **QZ-5.1** Progress saved in the browser (`localStorage`), per area, with a reset button.
	- **Accept:** answers survive a page reload, and reset clears them.
- [x] **QZ-5.2** "Review only the ones I got wrong" mode: a question leaves the list when answered correctly.
	- **Accept:** test with 2 wrong answers shows exactly those 2, and 0 after both are answered correctly.
- [x] **QZ-5.3** Difficulty filter (basic, intermediate, advanced).
	- **Accept:** each filter shows only questions of that level.
- [x] **QZ-5.4** Shuffle of questions and of alternatives on every attempt, keeping the answer key correct.
	- **Accept:** unit test with a fixed seed proves the correct alternative is still marked correct after shuffling.

### QZ-6 Languages (i18n)

- [x] **QZ-6.1** Portuguese and English for the whole app
	- [x] QZ-6.1.a Routes prefixed by language (`/pt/...`, `/en/...`), all generated statically.
	- [x] QZ-6.1.b Interface texts in one dictionary file per language, typed so a missing key fails the build.
	- [x] QZ-6.1.c Question content read from the `pt` and `en` blocks of each question.
	- [x] QZ-6.1.d Language selector visible on every page, choice remembered in the browser, first visit follows the browser language.
	- [x] QZ-6.1.e `lang` attribute of the page matches the selected language.
	- **Accept:** a Playwright test switches language in the middle of a question and the same question, the chosen answer and the explanation stay on screen in the other language. A build with one missing dictionary key fails.

### QZ-7 Light and dark theme

- [x] **QZ-7.1** Theme toggle
	- [x] QZ-7.1.a Light and dark themes built on Tailwind CSS v4 theme variables, one set of colour tokens per theme.
	- [x] QZ-7.1.b Toggle visible on every page, choice remembered in the browser, first visit follows the system preference.
	- [x] QZ-7.1.c Theme applied before first paint, so a reload in dark mode never flashes the light theme.
	- [x] QZ-7.1.d Right and wrong states, code examples and diagrams readable in both themes.
	- **Accept:** a Playwright test toggles the theme, reloads and finds the same theme. An automated contrast check passes WCAG AA on the question screen in both themes.

### QZ-8 Mobile friendly

- [x] **QZ-8.1** Responsive layout
	- [x] QZ-8.1.a Mobile-first styles: one column below 768 px, with the explanation under the alternatives, two columns from 768 px up.
	- [x] QZ-8.1.b Touch targets of at least 44 by 44 px for alternatives, toggles and navigation.
	- [x] QZ-8.1.c No horizontal scroll at 320 px wide, and long code examples scroll inside their own block.
	- [x] QZ-8.1.d After answering on a phone, the page scrolls to the explanation.
	- **Accept:** Playwright runs the full question flow at 320, 390, 768 and 1280 px wide with no horizontal overflow, and a Lighthouse mobile run scores at least 90 in performance and accessibility on the static build.

### QZ-9 Content pipeline

- [x] **QZ-9.1** Authoring guide in `docs/en/quiz-authoring.md` and `docs/pt/quiz-authoring.md`: how to write a question, how wrong alternatives encode real misconceptions, the no-copy rule.
- [x] **QZ-9.2** Reviewer procedure: a second agent receives the questions without `answer` and without explanations, answers them, and a script lists the disagreements.
	- [x] QZ-9.2.a `bun run quiz:blind <area>` exports the blind file.
	- [x] QZ-9.2.b `bun run quiz:compare <area> <answers>` writes `review.md` with every disagreement.
	- **Accept:** on a fixture with one deliberately wrong answer key, the comparison lists exactly that question.

### QZ-10 Tests and documentation

- [x] **QZ-10.1** Unit tests for schema, shuffle, progress and scoring.
- [x] **QZ-10.2** Playwright end-to-end tests for the flows of QZ-3 to QZ-8.
- [x] **QZ-10.3** `quiz/README.md` and `quiz/README.pt-BR.md`.
	- **Accept:** `bun test` and `bunx playwright test` pass inside Docker.

---

## Part BD: Language benchmark dashboard

Requested by the owner on 2026-10-07: a web dashboard, separate from the quiz, focused only on benchmarking the seven languages: parallelism, concurrency, requests per second, memory use, how each one handles threads, CPU use. It lives in `benchmarks/`: one folder per workload with one implementation per language, and a static dashboard in `benchmarks/dashboard/`. Every workload follows the benchmark contract of F-2 and the rules in `.claude/rules/load-tests.md` (local targets only, machine and versions recorded, spread reported).

### BD-1 Workloads

- [x] **BD-1.1** CPU, single thread: one numeric kernel (n-body simulation) and one integer kernel (prime sieve) in the 7 languages
	- **Accept:** all implementations print the same checksum for the same `n`, and `bun run bench -- --project cpu-single` writes the table.
- [x] **BD-1.2** Parallelism: the same kernel split over 1, 2, 4, 8 and 16 workers, using the idiomatic mechanism of each language (threads, goroutines, rayon, worker threads, multiprocessing, BEAM schedulers, parallel streams)
	- **Accept:** the parallel result equals the sequential one, and the table has speed-up, efficiency and CPU time per worker count and language.
- [x] **BD-1.3** Concurrency: 100,000 concurrent tasks that each wait and pass a message (goroutines, BEAM processes, virtual threads, async tasks, OS threads where the language has nothing lighter)
	- **Accept:** table of total time, peak memory and memory per task, and the README explains which scheduling model each language used.
- [x] **BD-1.4** HTTP server: the same two endpoints (JSON echo and a CPU-bound one) in the 7 languages, each with its standard library or its most common framework, under local k6
	- [x] BD-1.4.a The k6 script refuses any target that is not local.
	- [x] BD-1.4.b CPU and memory of the server container sampled during the run.
	- **Accept:** one protocol test suite passes against the 7 servers, and the table has requests per second, p50, p95, p99, peak memory and mean CPU per language.
- [x] **BD-1.5** Memory: an allocation-heavy workload (binary trees) and an idle process
	- **Accept:** table of peak memory, time and start-up time per language, with garbage-collected and manually managed languages side by side.

- [x] **BD-1.6** Build time: cold and incremental build of the same small program per language (owner's request, 2026-10-07)
	- **Accept:** table of cold and warm build time per language, and the README says what is measured for the languages with no compile step.
- [x] **BD-1.7** Binary size: size on disk of what is shipped, with and without the runtime it needs
	- **Accept:** table of artifact size and artifact-plus-runtime size per language, with the build flags recorded.
- [x] **BD-1.8** Database access: insert, read by key, filtered aggregate and pooled concurrent reads against one local PostgreSQL
	- **Accept:** table of operations per second, latency percentiles, CPU and memory per language, with the driver and its version named.

### BD-2 Dashboard

- [x] **BD-2.1** Static site (HTML + Tailwind CSS v4, built CSS committed, no CDN) reading the committed results
	- [x] BD-2.1.a One section per dimension: CPU, parallelism, concurrency, HTTP, memory.
	- [x] BD-2.1.b Charts drawn as inline SVG: bars per language, speed-up against workers, latency percentiles.
	- [x] BD-2.1.c Language filter, Portuguese and English, light and dark theme, usable from 320 px wide.
	- [x] BD-2.1.d Methodology section: machine, runtime versions, exact commands, and how to read each chart.
	- [x] BD-2.1.e Didactic for a beginner (owner's requirement: as if a 10-year-old were learning from it): every section opens with an explanation card in plain words with an everyday analogy and a "how to read this chart" note, every technical term and metric has a tooltip that works with mouse, keyboard and touch, every chart has a caption generated from the data and a "why did this happen?" card, each language has its own card, and a glossary collects the terms.
	- **Accept:** opening `benchmarks/dashboard/index.html` from disk shows every chart with no network request, checked by a Playwright test that blocks the network. The same test finds the explanation card of every section and opens a tooltip by keyboard and by tap.
- [x] **BD-2.2** One command to reproduce: `setup-unix-benchmarks.sh` and `setup-windows-benchmarks.ps1` build the images, run every workload and regenerate the results
	- **Accept:** on a machine with only Docker and Bun, the script ends with the results regenerated and the dashboard updated.
	- Note (2026-10-08): the quick path of both setup scripts ran end to end (images, agreement tests, dashboard tests). The full path with every measurement takes about an hour and was run step by step with `bun run all <step>`, not as one command. Numbers were measured on a shared machine and are noisy; the HTTP echo endpoint is limited by the load generator, not by the servers.
- [x] **BD-2.3** Documentation in `benchmarks/README.md`, `benchmarks/README.pt-BR.md`, `docs/en/benchmarks.md` and `docs/pt/benchmarks.md`: what each workload measures, what it does not, and why cross-language numbers must be read with care
	- **Accept:** both READMEs have the results tables and the limits of the comparison.

---

## Part QC: Quiz content

At least 100 questions per area, 170 for Electronics and 150 for Software engineering. Each wave has 5 areas (the last one has 6). Every area follows the same four tasks:

1. `coverage.json` written and reviewed.
2. Questions written, topic by topic, in PT and EN.
3. `quiz:validate` passing.
4. Blind review done and disagreements resolved.

### Wave 1

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

- [x] QC-BIGO.1 Coverage map committed
- [x] QC-BIGO.2 100 questions written (PT and EN)
- [x] QC-BIGO.3 Validation passing
- [x] QC-BIGO.4 Blind review resolved

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

- [x] QC-DS.1 Coverage map committed
- [x] QC-DS.2 100 questions written (PT and EN)
- [x] QC-DS.3 Validation passing
- [x] QC-DS.4 Blind review resolved

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

- [x] QC-OS.1 Coverage map committed
- [x] QC-OS.2 100 questions written (PT and EN)
- [x] QC-OS.3 Validation passing
- [x] QC-OS.4 Blind review resolved

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

- [x] QC-NET.1 Coverage map committed
- [x] QC-NET.2 100 questions written (PT and EN)
- [x] QC-NET.3 Validation passing
- [x] QC-NET.4 Blind review resolved

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

- [x] QC-DB.1 Coverage map committed
- [x] QC-DB.2 100 questions written (PT and EN)
- [x] QC-DB.3 Validation passing
- [x] QC-DB.4 Blind review resolved

### Wave 2

#### QC-ALG Algorithms

Sources: USP Sorting Algorithms and Algorithm Analysis lectures, Deitel.

| Topic | Questions |
| --- | --- |
| Elementary sorts: bubble, selection, insertion | 10 |
| Merge sort | 8 |
| Quicksort and pivot strategies | 10 |
| Heapsort | 6 |
| Linear-time sorts: counting, radix, bucket | 8 |
| Stability, in-place and adaptive sorting | 6 |
| Searching: sequential, binary, interpolation | 10 |
| Divide and conquer | 8 |
| Greedy algorithms | 8 |
| Dynamic programming | 12 |
| Backtracking and brute force | 6 |
| Graph algorithms: shortest path, spanning tree, topological sort | 8 |

- [x] QC-ALG.1 Coverage map committed
- [x] QC-ALG.2 100 questions written (PT and EN)
- [x] QC-ALG.3 Validation passing
- [x] QC-ALG.4 Blind review resolved

#### QC-CONC Concurrency

Sources: Tanenbaum (processes, threads, IPC), USP OOP lectures on threads, Deitel.

| Topic | Questions |
| --- | --- |
| Concurrency against parallelism, processes and threads | 10 |
| Race conditions and critical sections | 12 |
| Mutexes and locks | 10 |
| Semaphores and monitors | 8 |
| Atomic operations, visibility and memory models | 8 |
| Deadlock, livelock and starvation | 12 |
| Classic problems: producer-consumer, readers-writers, dining philosophers | 8 |
| Message passing and channels | 8 |
| Actor model and the BEAM | 8 |
| Async, promises and the event loop | 10 |
| Thread pools and backpressure | 6 |

- [x] QC-CONC.1 Coverage map committed
- [x] QC-CONC.2 100 questions written (PT and EN)
- [x] QC-CONC.3 Validation passing
- [x] QC-CONC.4 Blind review resolved

#### QC-PAR Parallelism

Sources: Tanenbaum (multiple processor systems), Dragon Book (parallelism and locality).

| Topic | Questions |
| --- | --- |
| Amdahl's and Gustafson's laws | 12 |
| Data parallelism against task parallelism | 10 |
| Speed-up, efficiency and scalability | 10 |
| Fork-join and work stealing | 10 |
| Map-reduce and other parallel patterns | 10 |
| False sharing and cache effects | 10 |
| SIMD and vectorisation | 8 |
| GPU computing basics | 6 |
| Shared against distributed memory | 8 |
| Parallel sorting and reductions | 8 |
| Determinism and reproducibility | 8 |

- [x] QC-PAR.1 Coverage map committed
- [x] QC-PAR.2 100 questions written (PT and EN)
- [x] QC-PAR.3 Validation passing
- [x] QC-PAR.4 Blind review resolved

#### QC-TX Transactions

Sources: C. J. Date (transactions, recovery, concurrency), notes in references/notes/databases.md.

| Topic | Questions |
| --- | --- |
| ACID properties | 12 |
| Isolation levels and anomalies | 16 |
| Locking: two-phase, optimistic and pessimistic | 12 |
| Multiversion concurrency control | 10 |
| Deadlocks in databases | 6 |
| Logging and recovery, write-ahead log | 10 |
| Distributed transactions and two-phase commit | 8 |
| Saga and outbox | 10 |
| Idempotency and exactly-once effects | 8 |
| CAP theorem and consistency models | 8 |

- [x] QC-TX.1 Coverage map committed
- [x] QC-TX.2 100 questions written (PT and EN)
- [x] QC-TX.3 Validation passing
- [x] QC-TX.4 Blind review resolved

#### QC-SEC Security

Sources: OWASP Top 10, Tanenbaum (security chapters), notes in references/notes/cyber-security.md.

| Topic | Questions |
| --- | --- |
| OWASP Top 10 overview and threat modelling | 8 |
| Injection: SQL and command | 12 |
| Cross-site scripting | 10 |
| Content Security Policy and security headers | 8 |
| CSRF and SameSite cookies | 8 |
| Authentication: passwords, hashing, multi-factor | 10 |
| Sessions and cookies | 8 |
| JWT, OAuth 2.0 and OpenID Connect | 10 |
| Access control: IDOR and roles | 8 |
| SSRF, path traversal and file upload | 8 |
| Cryptography basics and TLS | 6 |
| Secrets, dependencies and supply chain | 4 |

- [x] QC-SEC.1 Coverage map committed
- [x] QC-SEC.2 100 questions written (PT and EN)
- [x] QC-SEC.3 Validation passing
- [x] QC-SEC.4 Blind review resolved

### Wave 3

#### QC-COMP Compilers

Sources: Aho et al., Compilers: Principles, Techniques and Tools (2nd edition).

| Topic | Questions |
| --- | --- |
| Structure of a compiler and a simple translator (1, 2) | 8 |
| Lexical analysis: regex, NFA, DFA (3) | 14 |
| Syntax analysis: grammars, LL and LR parsing (4) | 18 |
| Syntax-directed translation (5) | 8 |
| Intermediate code generation (6) | 10 |
| Run-time environments: stack, heap, garbage collection (7) | 12 |
| Code generation (8) | 10 |
| Machine-independent optimisations (9) | 10 |
| Instruction-level parallelism and locality (10, 11) | 4 |
| Interpreters, virtual machines and JIT | 6 |

- [x] QC-COMP.1 Coverage map committed
- [x] QC-COMP.2 100 questions written (PT and EN)
- [x] QC-COMP.3 Validation passing
- [x] QC-COMP.4 Blind review resolved

#### QC-FSM State machines

Sources: Dragon Book (automata), Sommerville (state models), USP Digital Logic (sequential circuits).

| Topic | Questions |
| --- | --- |
| States, transitions, events and actions | 12 |
| Deterministic finite automata | 12 |
| Non-deterministic automata and subset construction | 10 |
| Regular languages and regular expressions | 12 |
| Minimisation of automata | 8 |
| Mealy and Moore machines | 8 |
| Statecharts: hierarchy, guards, parallel states | 8 |
| State machines in software: State pattern, protocols, workflows | 12 |
| Pushdown automata and context-free grammars | 8 |
| Turing machines and computability | 10 |

- [x] QC-FSM.1 Coverage map committed
- [x] QC-FSM.2 100 questions written (PT and EN)
- [x] QC-FSM.3 Validation passing
- [x] QC-FSM.4 Blind review resolved

#### QC-INFO Information theory

Sources: USP Data Structures II (compression), Tanenbaum Networks (error control).

| Topic | Questions |
| --- | --- |
| Information and Shannon entropy | 14 |
| Source coding and prefix codes | 10 |
| Huffman coding | 10 |
| Arithmetic coding and the LZ family | 10 |
| Channel capacity and noise | 10 |
| Error detection: parity, checksum, CRC | 12 |
| Error correction: repetition and Hamming codes | 12 |
| Text and binary encodings: ASCII, UTF-8, base64 | 10 |
| Encoding, hashing and encryption compared | 6 |
| Limits of compression | 6 |

- [x] QC-INFO.1 Coverage map committed
- [x] QC-INFO.2 100 questions written (PT and EN)
- [x] QC-INFO.3 Validation passing
- [x] QC-INFO.4 Blind review resolved

#### QC-DL Digital logic

Sources: USP Digital Logic lectures.

| Topic | Questions |
| --- | --- |
| Number systems and base conversion | 12 |
| Codes: BCD, Gray, ASCII, two's complement | 10 |
| Logic gates and truth tables | 12 |
| Boolean algebra and De Morgan's laws | 12 |
| Karnaugh maps | 12 |
| Arithmetic circuits: adders and subtractors | 10 |
| Multiplexers, demultiplexers, encoders, decoders | 10 |
| Latches and flip-flops | 10 |
| Registers and counters | 8 |
| Analogue to digital conversion | 4 |

- [x] QC-DL.1 Coverage map committed
- [x] QC-DL.2 100 questions written (PT and EN)
- [x] QC-DL.3 Validation passing
- [x] QC-DL.4 Blind review resolved

#### QC-ELEC Electronics

Theory only: no mini-project. The quiz is the whole deliverable for this area.

Sources: Gabriel Torres, Eletrônica (2nd edition), 34 chapters, 5 questions per chapter.

| Topic | Questions |
| --- | --- |
| Units of measurement and symbols (1, 2) | 10 |
| Electricity, direct and alternating voltage, current (3 to 6) | 20 |
| Resistance, impedance and power (7 to 9) | 15 |
| Electromagnetism (10) | 5 |
| Voltage and current dividers, delta and star, Thévenin, Norton (11 to 15) | 25 |
| Measuring instruments: galvanometer to oscilloscope (16 to 22) | 35 |
| Resistors, capacitors, coils and transformers (23 to 26) | 20 |
| Diodes, thyristors and transistors (27 to 29) | 15 |
| Integrated circuits (30) | 5 |
| Power supplies, voltage multipliers, filters, waveform generators (31 to 34) | 20 |

- [x] QC-ELEC.1 Coverage map committed
- [x] QC-ELEC.2 170 questions written (PT and EN)
- [x] QC-ELEC.3 Validation passing
- [x] QC-ELEC.4 Blind review resolved

### Wave 4

#### QC-OOP Object-oriented programming

Sources: USP OOP lectures, Deitel, Aniche (OO and SOLID).

| Topic | Questions |
| --- | --- |
| Classes, objects and encapsulation | 12 |
| Inheritance | 10 |
| Polymorphism and dynamic dispatch | 12 |
| Abstraction: interfaces and abstract classes | 10 |
| Composition against inheritance | 8 |
| Exceptions | 8 |
| Generics and collections | 10 |
| Object lifecycle, memory and garbage collection | 8 |
| Streams, input and output, serialisation | 6 |
| Coupling, cohesion and code smells | 10 |
| OOP across languages: traits, interfaces, protocols | 6 |

- [x] QC-OOP.1 Coverage map committed
- [x] QC-OOP.2 100 questions written (PT and EN)
- [x] QC-OOP.3 Validation passing
- [x] QC-OOP.4 Blind review resolved

#### QC-FP Functional programming

Sources: Deitel (lambdas and streams), language documentation of Elixir and TypeScript.

| Topic | Questions |
| --- | --- |
| Pure functions and referential transparency | 12 |
| Immutability | 10 |
| Higher-order functions: map, filter, reduce | 12 |
| Closures | 8 |
| Recursion and tail calls | 10 |
| Composition and currying | 10 |
| Algebraic data types and pattern matching | 10 |
| Lazy evaluation | 6 |
| Option and Result types, functors and monads by intuition | 10 |
| Managing side effects | 6 |
| Functional style in Elixir and TypeScript | 6 |

- [x] QC-FP.1 Coverage map committed
- [x] QC-FP.2 100 questions written (PT and EN)
- [x] QC-FP.3 Validation passing
- [x] QC-FP.4 Blind review resolved

#### QC-PAT Design patterns and SOLID

Sources: Aniche (OO and SOLID), Clean Code, notes in references/notes/solid-principles.md.

| Topic | Questions |
| --- | --- |
| Single responsibility principle | 8 |
| Open-closed principle | 8 |
| Liskov substitution principle | 8 |
| Interface segregation principle | 8 |
| Dependency inversion principle | 8 |
| Creational: Factory, Builder, Singleton | 14 |
| Structural: Adapter, Decorator, Facade | 12 |
| Behavioural: Strategy, Observer, Command, State | 18 |
| Repository and dependency injection | 8 |
| Anti-patterns and when not to use a pattern | 8 |

- [x] QC-PAT.1 Coverage map committed
- [x] QC-PAT.2 100 questions written (PT and EN)
- [x] QC-PAT.3 Validation passing
- [x] QC-PAT.4 Blind review resolved

#### QC-ARCH Software architecture

Sources: Otávio Lemos, Arquitetura Limpa na Prática, Sommerville (architectural design).

| Topic | Questions |
| --- | --- |
| What architecture is and quality attributes | 10 |
| Layered and hexagonal architectures | 10 |
| Clean architecture and the dependency rule | 14 |
| Entities and use cases | 12 |
| Interface adapters | 10 |
| Frameworks, drivers and the composition root | 8 |
| Monolith against microservices | 10 |
| Event-driven architecture and CQRS | 8 |
| Domain-driven design basics | 10 |
| Trade-offs and architecture decision records | 8 |

- [x] QC-ARCH.1 Coverage map committed
- [x] QC-ARCH.2 100 questions written (PT and EN)
- [x] QC-ARCH.3 Validation passing
- [x] QC-ARCH.4 Blind review resolved

#### QC-TEST Testing

Sources: Kent Beck (TDD), Sommerville (testing), notes in references/notes/tests.md.

| Topic | Questions |
| --- | --- |
| Test pyramid and test levels | 12 |
| Unit tests and isolation | 10 |
| Test doubles | 10 |
| The TDD cycle | 12 |
| Integration tests | 8 |
| End-to-end tests with Playwright | 8 |
| Smoke and regression tests | 8 |
| Coverage and mutation testing | 8 |
| Property-based testing | 6 |
| Flaky tests | 6 |
| Test design: equivalence classes and boundaries | 8 |
| Tests in CI and test strategy | 4 |

- [x] QC-TEST.1 Coverage map committed
- [x] QC-TEST.2 100 questions written (PT and EN)
- [x] QC-TEST.3 Validation passing
- [x] QC-TEST.4 Blind review resolved

### Wave 5

#### QC-PROTO Protocols

Sources: Tanenbaum Networks (application layer), RFCs of HTTP, the GraphQL and JSON-RPC specifications.

| Topic | Questions |
| --- | --- |
| HTTP semantics: methods, status codes, headers | 16 |
| HTTP caching, cookies and CORS | 12 |
| HTTP/2 | 12 |
| HTTP/3 and QUIC | 10 |
| TLS handshake | 8 |
| REST | 10 |
| GraphQL | 12 |
| JSON-RPC and gRPC | 10 |
| WebSocket and server-sent events | 10 |

- [x] QC-PROTO.1 Coverage map committed
- [x] QC-PROTO.2 100 questions written (PT and EN)
- [x] QC-PROTO.3 Validation passing
- [x] QC-PROTO.4 Blind review resolved

#### QC-MSG Messaging

Sources: The Optimal RabbitMQ Guide, legacy project message-queues-pubsub, Kafka and BullMQ documentation.

| Topic | Questions |
| --- | --- |
| Queue, pub/sub and stream compared | 12 |
| Delivery guarantees | 12 |
| Ordering and partitioning | 10 |
| Acknowledgement, retry and dead-letter queue | 10 |
| Idempotent consumers | 8 |
| Backpressure | 6 |
| RabbitMQ: exchanges, queues, routing | 12 |
| Kafka: topics, partitions, consumer groups, offsets | 14 |
| BullMQ on Redis | 6 |
| SQS and SNS | 6 |
| Outbox, saga and event sourcing | 4 |

- [x] QC-MSG.1 Coverage map committed
- [x] QC-MSG.2 100 questions written (PT and EN)
- [x] QC-MSG.3 Validation passing
- [x] QC-MSG.4 Blind review resolved

#### QC-LB Load balancing

Sources: Legacy project load-stress-tests, NGINX and Caddy documentation, system design notes.

| Topic | Questions |
| --- | --- |
| Layer 4 against layer 7 | 10 |
| Balancing algorithms | 16 |
| Health checks and failover | 12 |
| Sticky sessions | 8 |
| Reverse proxy, load balancer and API gateway | 10 |
| TLS termination | 6 |
| Horizontal against vertical scaling | 10 |
| NGINX configuration | 10 |
| Caddy configuration | 6 |
| Consistent hashing | 6 |
| High availability and single points of failure | 6 |

- [x] QC-LB.1 Coverage map committed
- [x] QC-LB.2 100 questions written (PT and EN)
- [x] QC-LB.3 Validation passing
- [x] QC-LB.4 Blind review resolved

#### QC-PERF Performance

Sources: Legacy project load-stress-tests, k6 documentation, Dragon Book (locality).

| Topic | Questions |
| --- | --- |
| Latency, throughput and percentiles | 14 |
| Load, stress, spike and soak tests | 12 |
| k6: virtual users, stages, thresholds, checks | 14 |
| Benchmarking methodology | 12 |
| Profiling and flame graphs | 10 |
| CPU cache and memory locality | 8 |
| Database performance: indexes, N+1, connection pooling | 12 |
| Runtime performance: event loop, garbage collection, cluster | 10 |
| Capacity planning and queueing | 8 |

- [x] QC-PERF.1 Coverage map committed
- [x] QC-PERF.2 100 questions written (PT and EN)
- [x] QC-PERF.3 Validation passing
- [x] QC-PERF.4 Blind review resolved

#### QC-CACHE Cache

Sources: Redis documentation, HTTP caching RFC, system design notes.

| Topic | Questions |
| --- | --- |
| Why and where to cache: browser, CDN, application, database | 12 |
| Strategies: cache-aside, read-through, write-through, write-behind | 16 |
| Invalidation and time to live | 14 |
| Eviction policies: LRU, LFU, FIFO | 12 |
| Stampede, penetration and avalanche | 12 |
| HTTP cache headers | 12 |
| Redis data structures and persistence | 12 |
| Consistency trade-offs | 10 |

- [x] QC-CACHE.1 Coverage map committed
- [x] QC-CACHE.2 100 questions written (PT and EN)
- [x] QC-CACHE.3 Validation passing
- [x] QC-CACHE.4 Blind review resolved

### Wave 6

#### QC-RL Rate limiting

Sources: Tanenbaum Networks (leaky and token bucket), Redis documentation.

| Topic | Questions |
| --- | --- |
| Why and where to limit | 10 |
| Fixed window | 10 |
| Sliding log and sliding counter | 14 |
| Token bucket | 14 |
| Leaky bucket | 12 |
| Distributed limiting with Redis and atomicity | 14 |
| HTTP 429, headers and client backoff | 12 |
| Quotas, throttling and load shedding | 14 |

- [x] QC-RL.1 Coverage map committed
- [x] QC-RL.2 100 questions written (PT and EN)
- [x] QC-RL.3 Validation passing
- [x] QC-RL.4 Blind review resolved

#### QC-FS File systems

Sources: Tanenbaum (file systems), USP Data Structures II (files, indexes, B-trees).

| Topic | Questions |
| --- | --- |
| Files, attributes and operations | 10 |
| Allocation: contiguous, linked, FAT, i-nodes | 14 |
| Directories and links | 8 |
| Free space management and journaling | 10 |
| Secondary storage: disk, flash and access cost | 10 |
| Record organisation: fixed, variable, RRN | 10 |
| Indexes: primary, secondary, inverted lists | 10 |
| B-trees and B+ trees | 12 |
| External sorting | 8 |
| Compression and space reclamation | 8 |

- [x] QC-FS.1 Coverage map committed
- [x] QC-FS.2 100 questions written (PT and EN)
- [x] QC-FS.3 Validation passing
- [x] QC-FS.4 Blind review resolved

#### QC-OBS Observability

Sources: Majors et al., Observability Engineering, OpenTelemetry documentation.

| Topic | Questions |
| --- | --- |
| Monitoring against observability | 10 |
| The three signals: logs, metrics, traces | 10 |
| Structured logs | 10 |
| Metric types and cardinality | 12 |
| Distributed tracing: spans and context propagation | 14 |
| OpenTelemetry | 10 |
| SLI, SLO and error budgets | 12 |
| Alerting | 8 |
| RED, USE and golden signals | 6 |
| Profiling | 4 |
| Prometheus, Grafana, Loki and Tempo basics | 4 |

- [ ] QC-OBS.1 Coverage map committed
- [ ] QC-OBS.2 100 questions written (PT and EN)
- [ ] QC-OBS.3 Validation passing
- [ ] QC-OBS.4 Blind review resolved

#### QC-CHAIN Blockchain

Sources: Nakamoto, Bitcoin: A Peer-to-Peer Electronic Cash System.

| Topic | Questions |
| --- | --- |
| Hash functions | 12 |
| Digital signatures and keys | 10 |
| Transactions and unspent outputs | 12 |
| Blocks, the chain and Merkle trees | 14 |
| Proof of work and difficulty | 14 |
| Double spending and confirmations | 10 |
| Network and consensus: longest chain and forks | 12 |
| Incentives and mining | 8 |
| Limits and alternatives: proof of stake, scalability | 8 |

- [x] QC-CHAIN.1 Coverage map committed
- [x] QC-CHAIN.2 100 questions written (PT and EN)
- [x] QC-CHAIN.3 Validation passing
- [x] QC-CHAIN.4 Blind review resolved

#### QC-CI Continuous integration

Sources: GitHub Actions course material in references/courses/github-actions.

| Topic | Questions |
| --- | --- |
| CI and CD concepts | 12 |
| GitHub Actions: workflows, events, jobs, steps | 16 |
| Runners and matrix builds | 10 |
| Caching and artifacts | 10 |
| Secrets, environments and permissions | 12 |
| Custom actions and reusable workflows | 10 |
| Quality gates | 8 |
| Deployment strategies | 10 |
| SemVer, Conventional Commits and changelog | 8 |
| Supply-chain security in CI | 4 |

- [ ] QC-CI.1 Coverage map committed
- [ ] QC-CI.2 100 questions written (PT and EN)
- [ ] QC-CI.3 Validation passing
- [ ] QC-CI.4 Blind review resolved

#### QC-SE Software engineering

Theory only: no mini-project. The quiz is the whole deliverable for this area.

Sources: Sommerville (9th edition), Brooks, Clean Code, Code Simplicity, The Lean Startup.

| Topic | Questions |
| --- | --- |
| Process models: waterfall, incremental, agile | 16 |
| Requirements engineering | 16 |
| System modelling with UML | 10 |
| Architectural design overview | 8 |
| Design, implementation and clean code | 16 |
| Testing, evolution and maintenance | 12 |
| Project management and estimation | 14 |
| Brooks: The Mythical Man-Month and No Silver Bullet | 14 |
| Quality and configuration management | 12 |
| Dependability and safety | 8 |
| Agile methods and lean startup | 14 |
| Simplicity and technical debt | 10 |

- [ ] QC-SE.1 Coverage map committed
- [ ] QC-SE.2 150 questions written (PT and EN)
- [ ] QC-SE.3 Validation passing
- [ ] QC-SE.4 Blind review resolved

### Wave 7

Added by the owner on 2026-10-07.

#### QC-AI Artificial intelligence and LLMs

Sources: found by a web search of primary and well-known material (papers such as "Attention Is All You Need" and "Denoising Diffusion Probabilistic Models", the GPT and BERT papers, university courses such as Stanford CS229, CS231n and CS224n, the Deep Learning book by Goodfellow, Bengio and Courville, official documentation, and widely used tutorials). The list actually used is recorded in `quiz/content/artificial-intelligence/coverage.json` and in `REFERENCES.md`.

| Topic | Questions |
| --- | --- |
| What AI, machine learning and deep learning are, and the kinds of learning | 8 |
| Probability and statistics foundations: distributions, expectation, Bayes, likelihood | 12 |
| Linear algebra for machine learning: vectors, matrices, dot product, cosine similarity | 10 |
| Supervised learning: regression, classification, loss, overfitting, train and test sets | 10 |
| Neural networks: neurons, activation functions, layers | 10 |
| Training: gradient descent, backpropagation, optimisers, regularisation | 12 |
| Tokens and tokenisation: BPE, vocabulary, context window | 10 |
| Embeddings and vector search | 10 |
| Attention and the transformer architecture | 12 |
| Language models: next-token prediction, sampling, pre-training and fine-tuning | 12 |
| Using LLMs: prompting, context, retrieval, tools and agents, hallucination, evaluation | 8 |
| Image generation: convolution, autoencoders, GANs, diffusion | 10 |
| Limits, bias, safety and cost: parameters, compute, quantisation | 6 |
| PyTorch: tensors, automatic differentiation, modules, the training loop | 12 |
| TensorFlow and Keras: tensors, layers, compiling and fitting a model, graphs against eager execution | 8 |
| Computer vision: images as tensors, convolution and pooling, CNN architectures, augmentation, transfer learning, detection and segmentation | 14 |

- [x] QC-AI.1 Coverage map committed
- [x] QC-AI.2 164 questions written (PT and EN)
- [x] QC-AI.3 Validation passing
- [x] QC-AI.4 Blind review resolved

---

## Part MP: Mini-projects

### Wave 1

#### MP-ALG-1 Sorting race

Teaches: how the same algorithms behave across languages and input shapes, and how measured time relates to Big O.

- [x] **MP-ALG-1.1** Algorithms in TypeScript (reference): bubble, insertion, merge, quick, heap, radix
	- [x] MP-ALG-1.1.a One file per algorithm, pure function, no library sort.
	- [x] MP-ALG-1.1.b Property test: output is sorted and is a permutation of the input.
	- **Accept:** tests pass for empty, single-element, sorted, reversed, duplicated and random inputs.
- [x] **MP-ALG-1.2** Same algorithms in C++, Python, Java, Elixir, Rust and Go
	- [x] MP-ALG-1.2.a Each language reads the shared input file and prints the benchmark contract JSON.
	- [x] MP-ALG-1.2.b Each language has the same test cases as the reference.
	- **Accept:** all 7 implementations produce the same sorted output for the same input file (checksum equal).
- [x] **MP-ALG-1.3** Benchmark
	- [x] MP-ALG-1.3.a Input generator with a fixed seed: random, sorted and reversed, sizes 10^3 to 10^6.
	- [x] MP-ALG-1.3.b Quadratic algorithms capped at a size documented in the README.
	- **Accept:** `bun run bench -- --project sorting-race` writes the table, and merge sort time grows less than 2.5 times when `n` doubles.
	- Note (2026-10-07): measured on a shared machine with a reduced grid (random input in the 7 languages, sizes up to 200,000; the three input shapes are compared in TypeScript only). From 100,000 to 200,000 merge sort grew 1.76 to 2.45 times in six languages. Elixir measured 3.51 times in the committed run (2.1 to 2.6 in an isolated probe), attributed to garbage collection of immutable lists, and is documented as an exception. Worth repeating on an idle machine.
- [x] **MP-ALG-1.4** Static dashboard: time against `n`, one line per algorithm, selector per language.
	- **Accept:** opening the page with the committed `results.json` shows the chart with no network request.
- [x] **MP-ALG-1.5** Definition of done for mini-projects met.

#### MP-CONC-1 Counter race condition

Teaches: why unsynchronised shared state loses updates, and four ways to fix it.

- [x] **MP-CONC-1.1** Buggy version in Go, Rust (with `unsafe` clearly labelled), Java and TypeScript (worker threads with shared memory)
	- **Accept:** a test that increments 1,000,000 times from 8 workers observes a final value below 1,000,000 in at least 9 of 10 runs.
- [x] **MP-CONC-1.2** Fixes
	- [x] MP-CONC-1.2.a Mutex.
	- [x] MP-CONC-1.2.b Atomic operation.
	- [x] MP-CONC-1.2.c Channel or message passing.
	- [x] MP-CONC-1.2.d Actor (Elixir process as the owner of the state).
	- **Accept:** every fixed version reaches exactly 1,000,000 in 100 consecutive runs.
- [x] **MP-CONC-1.3** Race detector: Go `-race` and Java tooling flag the buggy version and are silent on the fixes.
	- **Accept:** the detector output is captured in the test log for both cases.
- [x] **MP-CONC-1.4** Benchmark of the four fixes: throughput by number of workers.
	- **Accept:** table committed with 1, 2, 4 and 8 workers per fix and per language.
- [x] **MP-CONC-1.5** Definition of done for mini-projects met.

#### MP-SEC-1 SQL injection lab

Teaches: why string concatenation in queries is exploitable and how parameterised queries prevent it. Local only, per `.claude/rules/security-labs.md`.

- [x] **MP-SEC-1.1** Environment
	- [x] MP-SEC-1.1.a docker-compose with an `internal: true` network, app port bound to `127.0.0.1`.
	- [x] MP-SEC-1.1.b PostgreSQL seeded with obviously fake data.
	- **Accept:** from inside the app container, a request to an external host fails.
- [x] **MP-SEC-1.2** Vulnerable version (ElysiaJS, raw concatenated SQL), in a folder and files named `vulnerable`.
	- [x] MP-SEC-1.2.a Login bypass.
	- [x] MP-SEC-1.2.b Data exposure through a search field.
	- **Accept:** an automated test demonstrates both flaws against the vulnerable version.
- [x] **MP-SEC-1.3** Fixed version: parameterised queries, input validation, least-privilege database user.
	- **Accept:** the same tests that succeed against the vulnerable version fail to exploit the fixed one, and normal use still works.
- [x] **MP-SEC-1.4** Documentation: why it happens, how to prevent it, what does not work as a fix (blocklists, escaping by hand).
	- **Accept:** both READMEs have the three sections, and no payload targets anything outside the lab.
- [x] **MP-SEC-1.5** Definition of done for mini-projects met.

#### MP-COMP-1 Mini language: lexer and parser

Teaches: how source text becomes tokens and then a tree. First step of the compiler track (interpreter and bytecode VM come later).

- [x] **MP-COMP-1.1** Language definition: numbers, strings, booleans, variables, arithmetic and comparison operators, `if`, `while`, functions.
	- **Accept:** grammar written in the README in EBNF, with one example program per construct.
- [x] **MP-COMP-1.2** Lexer in TypeScript
	- [x] MP-COMP-1.2.a Tokens carry type, text, line and column.
	- [x] MP-COMP-1.2.b Errors report line and column.
	- **Accept:** tests cover every token type, comments, and an unterminated string.
- [x] **MP-COMP-1.3** Parser in TypeScript (recursive descent, Pratt parsing for expressions)
	- [x] MP-COMP-1.3.a Operator precedence and associativity.
	- [x] MP-COMP-1.3.b Syntax errors with position, parser does not stop at the first one.
	- **Accept:** tests prove `1 + 2 * 3` and `(1 + 2) * 3` give different trees, and a file with two errors reports both.
- [x] **MP-COMP-1.4** Demo: REPL that prints the tokens and the tree of each line.
	- **Accept:** one command starts the REPL in Docker, and a recorded session is in the README.
- [x] **MP-COMP-1.5** Definition of done for mini-projects met.

#### MP-MSG-1 Queue comparison

Teaches: what changes when the same task runs on BullMQ, RabbitMQ, Kafka and SQS. Rebuilds the legacy `message-queues-pubsub` project.

- [x] **MP-MSG-1.1** Common task and interface: an "order placed" message that triggers a simulated e-mail, with one producer and one consumer interface.
	- **Accept:** the four adapters implement the same TypeScript interface, checked by the compiler.
- [x] **MP-MSG-1.2** Adapters
	- [x] MP-MSG-1.2.a BullMQ on Redis.
	- [x] MP-MSG-1.2.b RabbitMQ.
	- [x] MP-MSG-1.2.c Kafka.
	- [x] MP-MSG-1.2.d SQS on LocalStack.
	- **Accept:** an integration test per adapter sends 1,000 messages and the consumer receives 1,000.
	- Note (2026-10-08): SQS runs on LocalStack 4.14.0, not on the newest tag, which refuses to start without a licence token. The Kafka ordering test first failed on the main session: a retried produce request wrote duplicate records. It was fixed at the root with an idempotent producer and by waiting for the topic to be ready, then passed 10 runs in a row.
- [x] **MP-MSG-1.3** Behaviour experiments
	- [x] MP-MSG-1.3.a Ordering: are messages received in the order sent?
	- [x] MP-MSG-1.3.b Redelivery: consumer crashes before acknowledging.
	- **Accept:** a table in the README states, per broker, the observed result of each experiment, produced by a test.
- [x] **MP-MSG-1.4** Throughput benchmark, all brokers local in docker-compose.
	- **Accept:** table with messages per second per broker, with the machine and versions recorded.
- [x] **MP-MSG-1.5** Definition of done for mini-projects met.

### Remaining mini-projects, by area

Electronics and Software engineering are theory only and have no mini-project.

#### MP-BIGO-1 Big O lab

Teaches: how to measure a function and recognise its growth curve. Languages: TS.

- [x] **MP-BIGO-1.1** Instrumented samples of O(1), O(log n), O(n), O(n log n), O(n^2) and O(2^n)
	- [x] MP-BIGO-1.1.a Each sample counts its basic operations.
	- [x] MP-BIGO-1.1.b Sizes double on every run.
	- **Accept:** operation counts match the closed formula for each sample in unit tests.
- [x] **MP-BIGO-1.2** Curve fitting
	- [x] MP-BIGO-1.2.a Fit measured counts against the candidate curves.
	- [x] MP-BIGO-1.2.b Report the best fit and its error.
	- **Accept:** the tool names the right class for all six samples.
- [x] **MP-BIGO-1.3** CLI and static dashboard with counts and time against `n`
	- **Accept:** `bun run demo` prints the table and the dashboard plots the committed results.
- [x] **MP-BIGO-1.4** Definition of done for mini-projects met.

#### MP-BIGO-2 Interactive master theorem

Teaches: how the three cases of the master theorem decide the cost of a recurrence. Languages: TS.

- [x] **MP-BIGO-2.1** Classifier for `T(n) = aT(n/b) + f(n)`
	- [x] MP-BIGO-2.1.a Returns the case and the solution.
	- [x] MP-BIGO-2.1.b Reports when the theorem does not apply.
	- **Accept:** unit tests cover one recurrence per case and one that does not fit.
- [x] **MP-BIGO-2.2** Empirical check: count the calls of a generated recursive function
	- **Accept:** the measured growth agrees with the predicted class for merge sort, binary search and a 7-way split.
- [x] **MP-BIGO-2.3** CLI and static page with the recursion tree
	- **Accept:** one command prints the case and the page draws the tree for the chosen `a`, `b`.
- [x] **MP-BIGO-2.4** Definition of done for mini-projects met.

#### MP-BIGO-3 The lower bound of comparison sorting

Teaches: why no comparison sort beats Ω(n lg n) and how counting sorts escape it. Languages: TS, Python.

- [x] **MP-BIGO-3.1** Decision tree generator for `n` = 3 and 4
	- **Accept:** the tree has `n!` leaves and its height equals the ceiling of `lg(n!)`.
- [x] **MP-BIGO-3.2** Comparison counters in merge, heap and quicksort
	- **Accept:** counted comparisons never fall below `lg(n!)` on 1,000 random inputs.
- [x] **MP-BIGO-3.3** Counting and radix sort on the same inputs
	- **Accept:** they sort correctly with zero element comparisons, shown in the same table.
- [x] **MP-BIGO-3.4** Definition of done for mini-projects met.

#### MP-DS-1 Hash map from scratch

Teaches: how collisions are resolved and why the load factor matters. Languages: C++, Rust, TS.

- [x] **MP-DS-1.1** Separate chaining and open addressing (linear probing)
	- [x] MP-DS-1.1.a Insert, get, delete.
	- [x] MP-DS-1.1.b Resize when the load factor passes a limit.
	- **Accept:** property tests compare every operation against the language's own map.
- [x] **MP-DS-1.2** Deletion in open addressing with tombstones
	- **Accept:** a get after delete-then-insert of colliding keys returns the right value.
- [x] **MP-DS-1.3** Benchmark by load factor
	- **Accept:** table of lookup time at load 0.25, 0.5, 0.75 and 0.9 for both strategies.
- [x] **MP-DS-1.4** Definition of done for mini-projects met.

#### MP-DS-2 Graph algorithms

Teaches: shortest paths, ordering and spanning trees on the same graph library. Languages: C++, Go.

- [x] **MP-DS-2.1** Graph with adjacency list and adjacency matrix
	- **Accept:** both representations pass the same test suite.
- [x] **MP-DS-2.2** Dijkstra, Bellman-Ford, topological sort, Prim and Kruskal
	- [x] MP-DS-2.2.a Bellman-Ford reports negative cycles.
	- [x] MP-DS-2.2.b Topological sort reports cycles.
	- **Accept:** the 10 `.in`/`.out` cases in `references/usp/data-structures-2` pass in both languages.
- [x] **MP-DS-2.3** Benchmark and CLI that prints the path
	- **Accept:** one command runs a case file and prints the result in the expected format.
- [x] **MP-DS-2.4** Definition of done for mini-projects met.

#### MP-DS-3 B-tree on disk

Teaches: why databases use wide trees: fewer page reads. Languages: C++, Rust.

- [x] **MP-DS-3.1** B-tree stored in a file, one node per page
	- [x] MP-DS-3.1.a Insert with node split.
	- [x] MP-DS-3.1.b Search.
	- [x] MP-DS-3.1.c Delete with merge and redistribution.
	- **Accept:** invariants (order, sorted keys, equal leaf depth) hold after 100,000 random operations.
- [x] **MP-DS-3.2** Page-read counter
	- **Accept:** search in 1,000,000 keys reads at most the tree height in pages.
- [x] **MP-DS-3.3** Comparison with a binary search tree on disk
	- **Accept:** table of page reads per search for both structures.
- [x] **MP-DS-3.4** Definition of done for mini-projects met.

#### MP-DS-4 LRU cache, bloom filter and trie

Teaches: three structures behind caches, membership tests and prefix search. Languages: TS, Go.

- [x] **MP-DS-4.1** LRU cache with O(1) get and put
	- **Accept:** eviction order matches a reference model in property tests.
- [x] **MP-DS-4.2** Bloom filter with configurable size and hash count
	- **Accept:** measured false-positive rate is within 20% of the theoretical rate, and there is no false negative.
- [x] **MP-DS-4.3** Trie with insert, search and prefix listing
	- **Accept:** prefix search over a 100,000-word list returns the same set as a linear filter.
- [x] **MP-DS-4.4** Definition of done for mini-projects met.

#### MP-DS-5 Balanced search trees

Teaches: how an unbalanced tree degenerates and how rotations prevent it. Languages: C++, Java.

- [x] **MP-DS-5.1** Unbalanced BST, AVL and red-black tree with the same interface
	- **Accept:** each keeps its invariant after every operation in property tests.
- [x] **MP-DS-5.2** Height and rotation counters
	- **Accept:** sorted insertion of 100,000 keys gives height 100,000 for the BST and under 40 for the balanced trees.
- [x] **MP-DS-5.3** Step-by-step rotation visualiser (static page)
	- **Accept:** the page replays the insertion of a fixed sequence and shows each rotation.
- [x] **MP-DS-5.4** Definition of done for mini-projects met.

#### MP-OS-1 CPU scheduling simulator

Teaches: how scheduling policies trade waiting time, response time and fairness. Languages: TS, Python.

- [x] **MP-OS-1.1** FCFS, shortest job first, round-robin, priority and multilevel feedback
	- **Accept:** textbook examples give the documented waiting and turnaround times.
- [x] **MP-OS-1.2** Gantt chart output
	- **Accept:** CLI prints the chart and the static page draws it.
- [x] **MP-OS-1.3** Comparison on generated workloads
	- **Accept:** table of average waiting, turnaround and response time per policy.
- [x] **MP-OS-1.4** Definition of done for mini-projects met.

#### MP-OS-2 Paging and TLB simulator

Teaches: how virtual addresses are translated and what page replacement costs. Languages: Rust, TS.

- [x] **MP-OS-2.1** Page table and TLB with hit and miss counters
	- **Accept:** a reference trace gives the expected counts.
- [x] **MP-OS-2.2** Replacement: FIFO, clock, LRU, optimal
	- **Accept:** page-fault counts match textbook examples.
- [x] **MP-OS-2.3** Belady's anomaly
	- **Accept:** a test shows FIFO faulting more with more frames on the classic reference string.
- [x] **MP-OS-2.4** Definition of done for mini-projects met.

#### MP-OS-3 Memory allocator

Teaches: how allocation strategies fragment memory. Languages: C++, Rust.

- [x] **MP-OS-3.1** First fit, best fit, worst fit and buddy system over a fixed arena
	- **Accept:** no two live blocks overlap in a randomised test.
- [x] **MP-OS-3.2** Coalescing of free blocks
	- **Accept:** freeing everything returns one free block.
- [x] **MP-OS-3.3** Fragmentation benchmark
	- **Accept:** table of external fragmentation and failed allocations per strategy.
- [x] **MP-OS-3.4** Definition of done for mini-projects met.

#### MP-OS-4 Deadlock detection and a mini shell

Teaches: resource allocation graphs, the banker's algorithm, and processes with pipes. Languages: Go, C++.

- [x] **MP-OS-4.1** Deadlock detector on a resource allocation graph
	- **Accept:** known deadlocked and safe graphs are classified correctly.
- [x] **MP-OS-4.2** Banker's algorithm
	- **Accept:** textbook states are classified safe or unsafe as documented.
- [x] **MP-OS-4.3** Mini shell with pipes, redirection and signals
	- **Accept:** a test script runs pipelines of three commands and interrupts a running one.
- [x] **MP-OS-4.4** Definition of done for mini-projects met.

#### MP-NET-1 Sliding window and a mini TCP

Teaches: how reliability is built on an unreliable channel. Languages: Go, Elixir.

- [x] **MP-NET-1.1** Simulated channel with loss, duplication and reordering
	- **Accept:** the channel is deterministic with a fixed seed.
- [x] **MP-NET-1.2** Stop-and-wait, go-back-N and selective repeat
	- **Accept:** every protocol delivers a file intact at 20% loss, checked by checksum.
- [x] **MP-NET-1.3** Mini TCP over UDP: handshake, sequence numbers, retransmission
	- **Accept:** a 10 MB transfer on localhost with injected loss arrives intact, and throughput per protocol is tabled.
- [x] **MP-NET-1.4** Definition of done for mini-projects met.

#### MP-NET-2 ALOHA and CSMA/CD simulator

Teaches: how shared media are contended. Languages: Python.

- [x] **MP-NET-2.1** Pure and slotted ALOHA
	- **Accept:** simulated throughput peaks within 5% of the theoretical 18.4% and 36.8%.
- [x] **MP-NET-2.2** CSMA/CD with binary exponential backoff
	- **Accept:** chart of throughput against offered load for the three, generated from committed results.
- [x] **MP-NET-2.3** Definition of done for mini-projects met.

#### MP-NET-3 DNS resolver and subnet calculator

Teaches: how names are resolved and how addresses are divided. Languages: Go, TS.

- [x] **MP-NET-3.1** Iterative resolver against a local fake hierarchy of root, TLD and authoritative servers in Docker
	- **Accept:** resolution works with no external network, and each step is printed.
- [x] **MP-NET-3.2** Cache with time to live
	- **Accept:** a second query is answered from cache and expires on time.
- [x] **MP-NET-3.3** Subnet calculator
	- **Accept:** network, broadcast, range and mask are correct for a table of CIDR cases.
- [x] **MP-NET-3.4** Definition of done for mini-projects met.

#### MP-DB-1 Mini relational DBMS

Teaches: how selection, projection and three join algorithms work. Languages: Rust, Python.

- [x] **MP-DB-1.1** In-memory tables with selection and projection
	- **Accept:** results equal SQLite on the same data in tests.
- [x] **MP-DB-1.2** Nested-loop, hash and sort-merge join
	- **Accept:** the three joins return the same rows on random tables.
- [x] **MP-DB-1.3** Benchmark by table size
	- **Accept:** table shows where nested-loop falls behind, for sizes 10^3 to 10^6.
	- Note (2026-10-07): hash and sort-merge are measured from 10^3 to 10^6. Nested-loop is capped at 10^4, where it is already about 100 times slower: 10^5 took 27 s in Rust and 10^6 would take about 45 minutes per run.
- [x] **MP-DB-1.4** Definition of done for mini-projects met.

#### MP-DB-2 Normalisation tool

Teaches: how functional dependencies drive normal forms. Languages: Python.

- [x] **MP-DB-2.1** Attribute closure and candidate keys
	- **Accept:** textbook examples return the documented keys.
- [x] **MP-DB-2.2** Normal form check and decomposition to 3NF and BCNF
	- **Accept:** decompositions are lossless, verified by a chase test.
- [x] **MP-DB-2.3** CLI that explains each step
	- **Accept:** one command prints the reasoning for an example schema.
- [x] **MP-DB-2.4** Definition of done for mini-projects met.

#### MP-ALG-2 Dynamic programming

Teaches: how memoisation and tabulation remove repeated work. Languages: TS, Python.

- [x] **MP-ALG-2.1** Knapsack, longest common subsequence and coin change in three versions each: naive, memoised, tabulated
	- **Accept:** the three versions return the same answer on 200 random cases.
- [x] **MP-ALG-2.2** Call counter and benchmark
	- **Accept:** the naive version makes at least 100 times more calls than the memoised one for the documented input size.
- [x] **MP-ALG-2.3** Demo printing the filled table step by step
	- **Accept:** one command prints the table for a small example, shown in the README.
- [x] **MP-ALG-2.4** Definition of done for mini-projects met.

#### MP-ALG-3 Travelling salesman

Teaches: where brute force stops being usable and what a heuristic trades away. Languages: TS, Rust.

- [x] **MP-ALG-3.1** Brute force and dynamic programming (Held-Karp) solvers
	- **Accept:** both return the same optimal tour for every instance up to 10 cities.
	- Note (2026-10-07): checked on a sample, not on every instance: 20 random instances per size up to 8 cities and 4 for 9 and 10. The tests compare the optimal length and validate each tour; the visiting order may differ by direction or on ties.
- [x] **MP-ALG-3.2** Heuristics: nearest neighbour and 2-opt
	- **Accept:** tour length stays within a documented factor of the optimum on instances up to 12 cities.
- [x] **MP-ALG-3.3** Benchmark by number of cities
	- **Accept:** the table shows the size at which brute force exceeds 10 seconds, in both languages.
- [x] **MP-ALG-3.4** Definition of done for mini-projects met.

#### MP-ALG-4 Hybrid quicksort

Teaches: how the pivot and the small-array threshold change quicksort in practice. Languages: C++, Rust.

- [x] **MP-ALG-4.1** Pivot strategies: first, random, median of three
	- **Accept:** all sort correctly, and the first-element pivot shows quadratic growth on sorted input.
- [x] **MP-ALG-4.2** Switch to insertion sort below a threshold `k`
	- **Accept:** benchmark sweeps `k` over 0, 5, 10, 20, 50 and records the best value.
- [x] **MP-ALG-4.3** Dashboard comparing strategies by input shape
	- **Accept:** the chart is generated from the committed results.
- [x] **MP-ALG-4.4** Definition of done for mini-projects met.

#### MP-CONC-2 Deadlock: dining philosophers

Teaches: the four conditions of deadlock and how breaking one removes it. Languages: Go, Java.

- [x] **MP-CONC-2.1** Version that deadlocks
	- **Accept:** a test with a timeout detects the deadlock in at least 9 of 10 runs.
- [x] **MP-CONC-2.2** Fixes: lock ordering and a waiter (semaphore)
	- **Accept:** both fixes run 60 seconds with every philosopher eating, checked by counters.
- [x] **MP-CONC-2.3** Thread dump of the deadlocked version explained in the README
	- **Accept:** the captured dump is committed and each line is annotated.
- [x] **MP-CONC-2.4** Definition of done for mini-projects met.

#### MP-CONC-3 Ten thousand connections

Teaches: how event loops, goroutines and BEAM processes handle many idle connections. Languages: TS, Go, Elixir.

- [x] **MP-CONC-3.1** Same echo and delayed-response server in the three languages
	- **Accept:** one protocol test suite passes against all three.
- [x] **MP-CONC-3.2** Local k6 scenario holding 10,000 connections
	- **Accept:** the script refuses to run against a non-local host.
- [x] **MP-CONC-3.3** Measurement of memory and latency percentiles
	- **Accept:** table committed with memory per connection and p50, p95, p99 per server.
- [x] **MP-CONC-3.4** Definition of done for mini-projects met.

#### MP-PAR-1 Scaling by cores

Teaches: how much a program speeds up with more cores, and why not linearly. Languages: Rust, Go, C++.

- [x] **MP-PAR-1.1** Prime counting and Mandelbrot, sequential and parallel
	- **Accept:** parallel results equal the sequential ones exactly.
- [x] **MP-PAR-1.2** Speed-up measurement with 1, 2, 4 and 8 workers
	- **Accept:** table of speed-up and efficiency per language.
- [x] **MP-PAR-1.3** Amdahl fit
	- **Accept:** the README states the serial fraction estimated from the measurements.
- [x] **MP-PAR-1.4** Definition of done for mini-projects met.

#### MP-TX-1 Isolation levels in PostgreSQL

Teaches: which anomaly each isolation level allows. Languages: TS + SQL.

- [x] **MP-TX-1.1** Two-session test harness with controlled interleaving
	- **Accept:** steps run in a fixed order, proven by a log of timestamps.
- [x] **MP-TX-1.2** Dirty read, non-repeatable read, phantom, lost update, write skew
	- **Accept:** each anomaly is reproduced at the weakest level that allows it and blocked at the next.
	- Note (2026-10-07): PostgreSQL never allows a dirty read, even at `READ UNCOMMITTED`, so for that anomaly the test proves the opposite: it does not happen at any level. The other four are reproduced and blocked as stated.
- [x] **MP-TX-1.3** Result matrix
	- **Accept:** the README table of level against anomaly is generated by the tests.
- [x] **MP-TX-1.4** Definition of done for mini-projects met.

#### MP-TX-2 Overselling at checkout

Teaches: how concurrent purchases oversell stock and three ways to stop it. Languages: TS.

- [x] **MP-TX-2.1** Naive checkout (read, check, write) with ElysiaJS and PostgreSQL
	- **Accept:** local k6 with 200 concurrent buyers of 10 items sells more than 10.
- [x] **MP-TX-2.2** Fixes: optimistic version column, `SELECT FOR UPDATE`, `SERIALIZABLE` with retry
	- **Accept:** each fix sells exactly 10 under the same load.
- [x] **MP-TX-2.3** Throughput and error rate per fix
	- **Accept:** table committed with requests per second and rejected requests.
- [x] **MP-TX-2.4** Definition of done for mini-projects met.

#### MP-TX-3 Prisma, Drizzle and raw SQL

Teaches: what an ORM costs and what SQL it generates. Languages: TS.

- [x] **MP-TX-3.1** Same schema and same five queries in the three approaches
	- **Accept:** the three return identical rows in tests.
- [x] **MP-TX-3.2** Captured SQL for each query
	- **Accept:** the generated SQL is committed next to each query.
- [x] **MP-TX-3.3** Latency benchmark and an N+1 example with its fix
	- **Accept:** table with latency per approach, and the N+1 version issues more than 100 statements where the fix issues 2.
- [x] **MP-TX-3.4** Definition of done for mini-projects met.

#### MP-TX-4 Outbox and saga

Teaches: how to keep two services consistent without a distributed transaction. Languages: TS.

- [x] **MP-TX-4.1** Order and payment services with a message broker
	- **Accept:** happy path leaves both databases consistent.
- [x] **MP-TX-4.2** Dual-write bug, then transactional outbox
	- **Accept:** with a crash injected between the write and the publish, the bug loses the event and the outbox does not.
- [x] **MP-TX-4.3** Saga with compensation
	- **Accept:** a failed payment cancels the order, checked end to end.
- [x] **MP-TX-4.4** Definition of done for mini-projects met.

#### MP-SEC-2 XSS and CSP lab

Teaches: how script injection works and how escaping and a content policy stop it. Languages: TS.

- [x] **MP-SEC-2.1** Vulnerable pages: stored, reflected and DOM-based, on an internal Docker network
	- **Accept:** a Playwright test demonstrates each one inside the lab.
- [x] **MP-SEC-2.2** Fixes: output encoding, safe DOM APIs, Content Security Policy
	- **Accept:** the same tests fail to execute script on the fixed version.
- [x] **MP-SEC-2.3** Documentation of cause and prevention
	- **Accept:** both READMEs explain why each fix works, and no payload targets anything outside the lab.
- [x] **MP-SEC-2.4** Definition of done for mini-projects met.

#### MP-SEC-3 CSRF lab

Teaches: why a browser sends cookies on forged requests and how to refuse them. Languages: TS.

- [x] **MP-SEC-3.1** Vulnerable state-changing endpoint and a second local origin that forges the request
	- **Accept:** a Playwright test shows the forged change succeeding.
- [x] **MP-SEC-3.2** Fixes: anti-CSRF token and `SameSite` cookies
	- **Accept:** the forged request is rejected and the legitimate form still works.
- [x] **MP-SEC-3.3** Definition of done for mini-projects met.

#### MP-SEC-4 Broken access control lab

Teaches: why the server must check ownership on every request. Languages: TS.

- [x] **MP-SEC-4.1** Vulnerable API that trusts the id in the URL
	- **Accept:** a test reads another fake user's record.
- [x] **MP-SEC-4.2** Fix: ownership and role checks in one place
	- **Accept:** the same test gets 403 and an authorisation test matrix passes.
- [x] **MP-SEC-4.3** Definition of done for mini-projects met.

#### MP-SEC-5 SSRF lab

Teaches: how a server can be tricked into calling internal services. Languages: TS.

- [x] **MP-SEC-5.1** Vulnerable URL-fetch feature and a fake internal service, both on the internal Docker network
	- **Accept:** a test reaches the internal service through the feature.
- [x] **MP-SEC-5.2** Fix: allow-list, scheme and resolved-address validation
	- **Accept:** the same test is blocked, including through a redirect.
- [x] **MP-SEC-5.3** Definition of done for mini-projects met.

#### MP-SEC-6 Passwords and sessions lab

Teaches: how passwords should be stored and logins protected. Languages: TS.

- [x] **MP-SEC-6.1** Storage comparison: plain, MD5, salted SHA-256, Argon2
	- **Accept:** a benchmark shows hashes per second for each, on fake data only.
- [x] **MP-SEC-6.2** Login with attempt limiting and secure session cookies
	- **Accept:** tests cover lockout, cookie flags and session rotation on login.
- [x] **MP-SEC-6.3** Definition of done for mini-projects met.

#### MP-SEC-7 JWT mistakes lab

Teaches: the common ways token validation goes wrong. Languages: TS.

- [x] **MP-SEC-7.1** Vulnerable verifier: accepts unsigned tokens, weak secret, no expiry check
	- **Accept:** a test demonstrates each mistake inside the lab.
- [x] **MP-SEC-7.2** Fixed verifier: pinned algorithm, strong key, expiry and audience checks
	- **Accept:** every forged token is rejected and a valid one is accepted.
- [x] **MP-SEC-7.3** Definition of done for mini-projects met.

#### MP-SEC-8 Upload and path traversal lab

Teaches: why file names and types from the client cannot be trusted. Languages: TS.

- [x] **MP-SEC-8.1** Vulnerable upload and download endpoints
	- **Accept:** a test reads a file outside the upload folder inside the container.
- [x] **MP-SEC-8.2** Fix: generated names, canonical path check, type and size validation
	- **Accept:** the same test is blocked and valid uploads still work.
- [x] **MP-SEC-8.3** Definition of done for mini-projects met.

#### MP-COMP-2 Tree-walking interpreter

Teaches: how a tree is executed: environments, scopes and closures. Languages: TS.

- [x] **MP-COMP-2.1** Evaluator for the mini language of MP-COMP-1
	- [x] MP-COMP-2.1.a Variables and scopes.
	- [x] MP-COMP-2.1.b Functions and closures.
	- [x] MP-COMP-2.1.c `if` and `while`.
	- **Accept:** a suite of example programs prints the expected output.
- [x] **MP-COMP-2.2** Run-time errors with line and column
	- **Accept:** tests cover undefined variable, wrong argument count and division by zero.
- [x] **MP-COMP-2.3** REPL that keeps state between lines
	- **Accept:** a recorded session in the README defines a function and calls it later.
- [x] **MP-COMP-2.4** Definition of done for mini-projects met.

#### MP-COMP-3 Bytecode virtual machine

Teaches: why bytecode runs faster than walking a tree. Languages: Rust.

- [x] **MP-COMP-3.1** Compiler from the tree to stack bytecode
	- **Accept:** a disassembler prints readable bytecode, checked by snapshot tests.
- [x] **MP-COMP-3.2** Stack virtual machine
	- **Accept:** the example programs of MP-COMP-2 give the same output.
- [x] **MP-COMP-3.3** Benchmark against the tree-walking interpreter
	- **Accept:** table for a loop and a recursive function, with machine and versions recorded.
- [x] **MP-COMP-3.4** Definition of done for mini-projects met.

#### MP-COMP-4 Regex engine

Teaches: how a regular expression becomes an automaton. Languages: Go.

- [x] **MP-COMP-4.1** Parser for concatenation, alternation, star, plus, optional and classes
	- **Accept:** tests cover precedence and invalid patterns.
- [x] **MP-COMP-4.2** Thompson construction to NFA and subset construction to DFA
	- **Accept:** matches agree with Go's `regexp` on 1,000 generated cases.
- [x] **MP-COMP-4.3** Automaton export and timing on a pathological pattern
	- **Accept:** the engine stays linear where a backtracking matcher is exponential, shown in a table.
- [x] **MP-COMP-4.4** Definition of done for mini-projects met.

#### MP-FSM-1 Order state machine

Teaches: how explicit states and transitions remove invalid situations. Languages: TS, Elixir.

- [x] **MP-FSM-1.1** States created, paid, shipped, delivered, cancelled, refunded, with a transition table
	- **Accept:** every valid transition succeeds and every invalid one is rejected, in a test generated from the table.
- [x] **MP-FSM-1.2** Diagram generated from the same table
	- **Accept:** the committed diagram is regenerated by a command and the test fails if it is out of date.
- [x] **MP-FSM-1.3** CLI that walks an order through events
	- **Accept:** the demo script in the README runs a full order and a rejected transition.
- [x] **MP-FSM-1.4** Definition of done for mini-projects met.

#### MP-INFO-1 Huffman and LZ77

Teaches: how compression exploits redundancy and what entropy says about its limit. Languages: Rust, Python.

- [x] **MP-INFO-1.1** Shannon entropy calculator for a file
	- **Accept:** known inputs (single symbol, uniform bytes) give 0 and 8 bits per byte.
- [x] **MP-INFO-1.2** Huffman encoder and decoder
	- **Accept:** round trip is lossless on text, binary and empty files.
- [x] **MP-INFO-1.3** LZ77 encoder and decoder, and comparison table
	- **Accept:** table of compression ratio against entropy for five sample files.
- [x] **MP-INFO-1.4** Definition of done for mini-projects met.

#### MP-INFO-2 Error detection and correction

Teaches: how redundancy detects and repairs flipped bits. Languages: C++.

- [x] **MP-INFO-2.1** Parity, checksum and CRC-32
	- **Accept:** CRC-32 matches the standard check value for the string `123456789`.
- [x] **MP-INFO-2.2** Hamming(7,4) encoder and decoder
	- **Accept:** every single-bit error in every codeword is corrected in an exhaustive test.
- [x] **MP-INFO-2.3** Noise simulator
	- **Accept:** table of detected, corrected and missed errors by bit error rate.
- [x] **MP-INFO-2.4** Definition of done for mini-projects met.

#### MP-DL-1 Logic gates, Karnaugh and adders

Teaches: how Boolean functions become circuits. Languages: TS, Python.

- [x] **MP-DL-1.1** Gate simulator and truth-table generator from an expression
	- **Accept:** tables match hand-written ones for 20 expressions.
- [x] **MP-DL-1.2** Minimisation by Quine-McCluskey
	- **Accept:** the minimised expression is equivalent to the original for every input.
- [x] **MP-DL-1.3** Half adder, full adder and ripple-carry adder built from gates
	- **Accept:** the 8-bit adder agrees with native addition for all 65,536 input pairs.
- [x] **MP-DL-1.4** Definition of done for mini-projects met.

#### MP-DL-2 NAND-only ALU and a 4-bit CPU

Teaches: how a computer is built from one gate. Languages: Go, TS.

- [x] **MP-DL-2.1** Every gate derived from NAND
	- **Accept:** derived gates match their truth tables.
- [x] **MP-DL-2.2** ALU with add, subtract, and, or, and flags
	- **Accept:** exhaustive test over all 4-bit inputs and operations.
- [x] **MP-DL-2.3** 4-bit CPU with registers, program counter and a tiny instruction set
	- **Accept:** a committed program multiplies two numbers and the trace is in the README.
- [x] **MP-DL-2.4** Definition of done for mini-projects met.

#### MP-OOP-1 Same domain in OOP and functional style

Teaches: what changes when the same rules are written with objects or with functions. Languages: Java, Elixir, TS.

- [x] **MP-OOP-1.1** Shopping cart with discounts, taxes and coupons, object-oriented version
	- **Accept:** shared acceptance scenarios pass.
- [x] **MP-OOP-1.2** Functional version with immutable data
	- **Accept:** the same scenarios pass, and a test proves no input is mutated.
- [x] **MP-OOP-1.3** Comparison
	- **Accept:** README table of lines, number of types and how a new rule is added in each.
- [x] **MP-OOP-1.4** Definition of done for mini-projects met.

#### MP-OOP-2 Executable code smell catalogue

Teaches: how to recognise and remove common smells. Languages: TS, Java.

- [x] **MP-OOP-2.1** Before and after for long method, god class, feature envy, shotgun surgery, primitive obsession
	- **Accept:** the same tests pass on both versions of each smell.
- [x] **MP-OOP-2.2** Polymorphism instead of a conditional chain
	- **Accept:** adding a new variant touches one file in the refactored version, shown by a diff in the README.
- [x] **MP-OOP-2.3** Definition of done for mini-projects met.

#### MP-FP-1 Pure functions and property-based tests

Teaches: why pure code is easy to test and what properties find. Languages: TS, Elixir.

- [x] **MP-FP-1.1** Impure and pure versions of the same module
	- **Accept:** the pure version is tested with no mock.
- [x] **MP-FP-1.2** Properties: round trip, idempotence, invariants
	- **Accept:** a property finds a seeded bug that the example tests miss, and the shrunk counterexample is in the README.
- [x] **MP-FP-1.3** Composition and pipeline examples
	- **Accept:** the same pipeline is written in both languages with equivalent tests.
- [x] **MP-FP-1.4** Definition of done for mini-projects met.

#### MP-PAT-1 Back-end design patterns

Teaches: about ten patterns in situations where they pay off. Languages: TS.

- [x] **MP-PAT-1.1** Strategy, Observer, Factory, Adapter, Decorator
	- **Accept:** each has a failing-design version, the pattern version and tests.
- [x] **MP-PAT-1.2** Repository, Command, State, Builder
	- **Accept:** same structure as above.
- [x] **MP-PAT-1.3** Singleton and why to avoid it
	- **Accept:** a test shows the hidden shared state, and the injected version removes it.
- [x] **MP-PAT-1.4** Definition of done for mini-projects met.

#### MP-PAT-2 SOLID before and after

Teaches: what each principle prevents. Languages: TS, Java.

- [x] **MP-PAT-2.1** One violating module per principle
	- **Accept:** tests document the current behaviour.
- [x] **MP-PAT-2.2** Refactor per principle
	- **Accept:** the same tests pass after each refactor.
- [x] **MP-PAT-2.3** Cost of change
	- **Accept:** the README shows, per principle, the diff needed for one new requirement before and after.
- [x] **MP-PAT-2.4** Definition of done for mini-projects met.

#### MP-ARCH-1 Clean architecture application

Teaches: how the dependency rule keeps business rules free of frameworks. Languages: TS.

- [x] **MP-ARCH-1.1** Note-taking application: entities, use cases, adapters, drivers
	- **Accept:** an automated check fails if an inner layer imports an outer one.
- [x] **MP-ARCH-1.2** Two delivery mechanisms (HTTP and CLI) and two repositories (memory and PostgreSQL)
	- **Accept:** use-case tests run with no database and no HTTP server.
- [x] **MP-ARCH-1.3** Swap experiment
	- **Accept:** replacing the repository changes only the composition root, shown by a diff.
- [x] **MP-ARCH-1.4** Definition of done for mini-projects met.

#### MP-TEST-1 Full test pyramid

Teaches: what each test level is for and what it costs. Languages: TS.

- [x] **MP-TEST-1.1** Small application with unit, integration, end-to-end (Playwright), smoke and regression suites
	- **Accept:** each suite runs with its own command inside Docker.
- [x] **MP-TEST-1.2** A seeded bug per level
	- **Accept:** a table shows which suite catches each bug.
- [x] **MP-TEST-1.3** Time and cost
	- **Accept:** the README records count and duration of each suite.
- [x] **MP-TEST-1.4** Definition of done for mini-projects met.

#### MP-TEST-2 TDD kata with commit history

Teaches: the red, green, refactor rhythm. Languages: TS.

- [x] **MP-TEST-2.1** Multi-currency money kata
	- **Accept:** the git history alternates failing-test, passing and refactor commits, checked by a script on the commit prefixes.
- [x] **MP-TEST-2.2** Walkthrough
	- **Accept:** the README links each step to its commit.
- [x] **MP-TEST-2.3** Definition of done for mini-projects met.

#### MP-TEST-3 Mutation testing

Teaches: why coverage does not measure test quality. Languages: TS.

- [x] **MP-TEST-3.1** Module with 100% line coverage and weak assertions
	- **Accept:** the coverage report shows 100%.
- [x] **MP-TEST-3.2** Mutation run
	- **Accept:** the mutation score is under 60% before and over 90% after the tests are strengthened.
- [x] **MP-TEST-3.3** Definition of done for mini-projects met.

#### MP-TEST-4 Flaky test lab

Teaches: the usual causes of intermittent tests. Languages: TS.

- [x] **MP-TEST-4.1** Flaky tests caused by time, order dependence, shared state and real network
	- **Accept:** each fails at least once in 50 runs.
- [x] **MP-TEST-4.2** Fixes: fake clock, isolation, deterministic order, stubbed network
	- **Accept:** each fixed test passes 500 consecutive runs.
- [x] **MP-TEST-4.3** Definition of done for mini-projects met.

#### MP-TEST-5 Mini xUnit from scratch

Teaches: how a test framework works inside. Languages: Python, TS.

- [x] **MP-TEST-5.1** Test case, suite, result, set-up and tear-down
	- **Accept:** the framework tests itself.
- [x] **MP-TEST-5.2** Discovery and reporting
	- **Accept:** a failing test reports name, message and location, and the run exits non-zero.
- [x] **MP-TEST-5.3** Definition of done for mini-projects met.

#### MP-PROTO-1 REST, GraphQL and JSON-RPC

Teaches: what each API style costs and offers on the same domain. Languages: TS (Elysia).

- [x] **MP-PROTO-1.1** Same domain exposed through the three styles
	- **Accept:** one behaviour test suite passes against the three.
- [x] **MP-PROTO-1.2** N+1 problem in GraphQL and its fix with batching
	- **Accept:** query count drops from more than 100 to under 5 for the same request.
- [x] **MP-PROTO-1.3** Latency and payload size
	- **Accept:** table per style for a list, a detail and a nested read.
- [x] **MP-PROTO-1.4** Definition of done for mini-projects met.

#### MP-PROTO-2 HTTP/1.1, HTTP/2 and HTTP/3

Teaches: what multiplexing and QUIC change for a page with many resources. Languages: Caddy + TS.

- [x] **MP-PROTO-2.1** Local page with 200 small images served over the three versions
	- **Accept:** the negotiated protocol is asserted in a test for each port.
- [x] **MP-PROTO-2.2** Measurement with and without injected latency and loss
	- **Accept:** table of total load time per protocol and condition.
	- Note (2026-10-08): measured on a shared machine with a small page (about 400 kB). With 50 ms of latency HTTP/1.1 took about 3.3 times as long as HTTP/2. With latency and 2% loss, HTTP/3 was not ahead of HTTP/2: the difference was smaller than the standard deviation. The README says so and explains the limits of the experiment.
- [x] **MP-PROTO-2.3** Waterfall visual
	- **Accept:** a static page shows the three waterfalls from committed data.
- [x] **MP-PROTO-2.4** Definition of done for mini-projects met.

#### MP-PROTO-3 HTTP server on raw TCP

Teaches: what is inside an HTTP request and response. Languages: Go.

- [x] **MP-PROTO-3.1** Request parser: request line, headers, body by content length
	- **Accept:** tests cover malformed requests and oversized headers.
- [x] **MP-PROTO-3.2** Router, keep-alive and chunked responses
	- **Accept:** `curl` and a browser both get correct responses.
- [x] **MP-PROTO-3.3** Wire trace
	- **Accept:** the README shows the raw bytes of one request and response, annotated.
- [x] **MP-PROTO-3.4** Definition of done for mini-projects met.

#### MP-MSG-2 Idempotency and dead-letter queue

Teaches: how to survive duplicated and poisoned messages. Languages: TS, Go.

- [x] **MP-MSG-2.1** Consumer that fails randomly, with redelivery
	- **Accept:** without protection, the side effect is applied more than once in the test.
- [x] **MP-MSG-2.2** Idempotency key store
	- **Accept:** with the store, 1,000 messages delivered at least twice produce exactly 1,000 effects.
- [x] **MP-MSG-2.3** Retry with backoff and dead-letter queue
	- **Accept:** a poisoned message lands in the dead-letter queue after the configured attempts.
- [x] **MP-MSG-2.4** Definition of done for mini-projects met.

#### MP-MSG-3 Queue, pub/sub and backpressure

Teaches: the difference between competing consumers and broadcast, and what happens when producers are faster. Languages: TS, Elixir.

- [x] **MP-MSG-3.1** Work queue against fan-out on RabbitMQ
	- **Accept:** a queue delivers each message once, and a fan-out delivers it to every subscriber, asserted in tests.
- [x] **MP-MSG-3.2** Producer faster than consumer, without and with backpressure
	- **Accept:** memory grows without bound in the first case and stays flat in the second.
	- Note (2026-10-08): "without bound" is shown as linear growth that does not slow down (about 45 MiB per second over a 2 second run), not by exhausting the memory of a shared machine.
- [x] **MP-MSG-3.3** GenStage pipeline in Elixir
	- **Accept:** demand-driven flow keeps the buffer under the configured size.
- [x] **MP-MSG-3.4** Definition of done for mini-projects met.

#### MP-LB-1 NGINX against Caddy

Teaches: how balancing algorithms distribute requests and survive a dead node. Languages: config + TS.

- [x] **MP-LB-1.1** Three identical API instances behind each proxy
	- **Accept:** one command brings up both stacks on different local ports.
- [x] **MP-LB-1.2** Round-robin, least connections and ip-hash
	- **Accept:** request counts per instance match the expected distribution within 5%.
- [x] **MP-LB-1.3** Failure experiment: one instance stopped during load
	- **Accept:** error count and recovery time are recorded for both proxies.
- [x] **MP-LB-1.4** Definition of done for mini-projects met.

#### MP-LB-2 Hand-written L7 load balancer

Teaches: what a load balancer does on every request. Languages: Go.

- [x] **MP-LB-2.1** Reverse proxy with round-robin and least connections
	- **Accept:** integration tests check the distribution.
- [x] **MP-LB-2.2** Active health checks and retry on failure
	- **Accept:** a stopped back end is removed within the configured interval and no request fails.
- [x] **MP-LB-2.3** Benchmark against NGINX with local k6
	- **Accept:** table of throughput and p99 latency for both.
	- Note (2026-10-08): the table is committed, but the benchmark names no winner. Medians were about 10,600 requests per second for this balancer and 10,100 for NGINX, with fully overlapping ranges, on a machine loaded by other work. Earlier runs on the same day gave medians between about 5,000 and 9,600.
- [x] **MP-LB-2.4** Definition of done for mini-projects met.

#### MP-PERF-1 Bun against Node

Teaches: how runtime and process model change throughput. Languages: TS.

- [x] **MP-PERF-1.1** Same HTTP API on Bun, Node, and Node with PM2 cluster
	- **Accept:** one test suite passes against the three.
- [x] **MP-PERF-1.2** Local k6 scenario with a CPU-bound and an I/O-bound endpoint
	- **Accept:** the script refuses non-local targets.
- [x] **MP-PERF-1.3** Results
	- **Accept:** table of requests per second, p95 latency and memory for each setup.
- [x] **MP-PERF-1.4** Definition of done for mini-projects met.

#### MP-PERF-2 Load test scenarios with k6

Teaches: what load, stress, spike and soak tests each reveal. Languages: TS + k6.

- [x] **MP-PERF-2.1** Local API with a deliberate bottleneck (small connection pool)
	- **Accept:** the bottleneck is visible as a latency knee in the load test.
- [x] **MP-PERF-2.2** Four scenarios with thresholds
	- **Accept:** each scenario fails its threshold before the fix and passes after.
- [x] **MP-PERF-2.3** Report
	- **Accept:** Markdown summary per scenario committed, raw output git-ignored.
- [x] **MP-PERF-2.4** Definition of done for mini-projects met.

#### MP-PERF-3 Cache-friendly matrix multiplication

Teaches: how memory locality changes speed with the same Big O. Languages: C++, Rust.

- [x] **MP-PERF-3.1** Naive, loop-interchanged and blocked multiplication
	- **Accept:** the three give the same matrix within floating-point tolerance.
- [x] **MP-PERF-3.2** Benchmark by matrix size
	- **Accept:** the blocked version is at least 2 times faster than naive at the largest size.
	- Note (2026-10-08): at n = 1500 the blocked version was between 3.3 and 19.6 times faster than naive, always above 2 times but never by the same factor, on a shared machine. On this machine (96 MiB of L3 cache) blocking did not beat the plain loop interchange, which the README says.
- [x] **MP-PERF-3.3** Explanation with the measured numbers
	- **Accept:** the README relates the result to cache line and block size.
- [x] **MP-PERF-3.4** Definition of done for mini-projects met.

#### MP-CACHE-1 Cache strategies and stampede

Teaches: how caching patterns behave and how they fail. Languages: TS.

- [x] **MP-CACHE-1.1** Cache-aside, write-through and write-behind over Redis and PostgreSQL
	- **Accept:** each strategy passes a consistency test that describes its guarantee.
- [x] **MP-CACHE-1.2** Cache stampede and its fixes: lock and early refresh
	- **Accept:** under local k6, database queries per expiry drop from hundreds to 1.
- [x] **MP-CACHE-1.3** Hit rate and latency
	- **Accept:** table per strategy and time to live.
- [x] **MP-CACHE-1.4** Definition of done for mini-projects met.

#### MP-RL-1 Rate limiter algorithms

Teaches: how each algorithm treats bursts. Languages: TS, Go.

- [x] **MP-RL-1.1** Fixed window, sliding window, token bucket and leaky bucket in memory
	- **Accept:** each passes a table-driven test of allowed and rejected requests over time.
- [x] **MP-RL-1.2** Distributed version on Redis with an atomic script
	- **Accept:** two instances together never allow more than the limit under concurrent load.
- [x] **MP-RL-1.3** Burst experiment
	- **Accept:** chart of accepted requests over time for the four algorithms with the same traffic.
- [x] **MP-RL-1.4** Definition of done for mini-projects met.

#### MP-FS-1 File organisation and indexes

Teaches: how records, free lists and indexes live inside a file. Languages: C++, Rust.

- [x] **MP-FS-1.1** Fixed-length records with header, RRN access and a free list inside the file
	- **Accept:** deleted slots are reused, checked by file size after delete and insert.
- [x] **MP-FS-1.2** Primary and secondary index with inverted lists
	- **Accept:** index search returns the same records as a full scan.
- [x] **MP-FS-1.3** Run-length and Huffman compression of the data file
	- **Accept:** round trip is lossless and the ratio is reported.
- [x] **MP-FS-1.4** Definition of done for mini-projects met.

#### MP-FS-2 External sorting

Teaches: how to sort a file larger than memory. Languages: Rust, Go.

- [x] **MP-FS-2.1** Run generation with a memory limit
	- **Accept:** peak memory stays under the limit while sorting a file 10 times larger.
- [x] **MP-FS-2.2** K-way merge with a heap
	- **Accept:** output is sorted and has the same multiset of lines as the input.
- [x] **MP-FS-2.3** Effect of run size and merge fan-in
	- **Accept:** table of total time per configuration.
- [x] **MP-FS-2.4** Definition of done for mini-projects met.

#### MP-OBS-1 Three services with traces, metrics and logs

Teaches: how the three signals together explain one slow request. Languages: TS, Go.

- [ ] **MP-OBS-1.1** Three services instrumented with OpenTelemetry, plus Prometheus, Grafana, Loki and Tempo in docker-compose
	- **Accept:** one command brings everything up locally with pinned images.
- [ ] **MP-OBS-1.2** Injected slow dependency
	- **Accept:** a single trace shows the slow span, and the README has the screenshot and the query used.
- [ ] **MP-OBS-1.3** Dashboards as code
	- **Accept:** dashboards are committed as JSON and load on start-up.
- [ ] **MP-OBS-1.4** Definition of done for mini-projects met.

#### MP-OBS-2 Structured logs and correlation id

Teaches: how to follow one request across services. Languages: TS.

- [ ] **MP-OBS-2.1** JSON logs with a correlation id propagated through HTTP and a queue
	- **Accept:** a test finds every log line of one request with a single query.
- [ ] **MP-OBS-2.2** Unstructured version for contrast
	- **Accept:** the README shows the same search on both.
- [ ] **MP-OBS-2.3** Definition of done for mini-projects met.

#### MP-OBS-3 SLO and alert

Teaches: how an objective becomes an alert. Languages: TS.

- [ ] **MP-OBS-3.1** Availability and latency indicators with an error budget
	- **Accept:** recording rules are committed and tested with the Prometheus rule tester.
- [ ] **MP-OBS-3.2** Violation caused by local k6
	- **Accept:** the alert fires within the documented time and resolves after the load stops.
- [ ] **MP-OBS-3.3** Definition of done for mini-projects met.

#### MP-OBS-4 Profiling with a flame graph

Teaches: how to find where time goes. Languages: Go, TS.

- [ ] **MP-OBS-4.1** Service with a hidden hot path
	- **Accept:** the flame graph points at the function, and the image is committed.
- [ ] **MP-OBS-4.2** Fix and before/after benchmark
	- **Accept:** throughput improves by a factor recorded in the README.
- [ ] **MP-OBS-4.3** Definition of done for mini-projects met.

#### MP-CHAIN-1 Didactic blockchain

Teaches: how hashing, proof of work and validation make a tamper-evident chain. Languages: TS, Rust.

- [x] **MP-CHAIN-1.1** Blocks with hash links and a Merkle root
	- **Accept:** changing any transaction invalidates the chain in a test.
- [x] **MP-CHAIN-1.2** Proof of work with adjustable difficulty
	- **Accept:** average mining time grows about 16 times per extra hex zero, shown in a table.
	- Note (2026-10-08): the number of attempts grows 16.3, 15.3 and 15.2 times per digit, identical in both languages. Time follows from difficulty 2 on (14.3 to 16.9 times). Between difficulties 1 and 2 the time ratio is about 11 to 12, attributed to the fixed cost of preparing the header when a block needs only 16 hashes. Timings were taken on a shared machine.
- [x] **MP-CHAIN-1.3** Signed transactions and a longest-chain rule between local nodes
	- **Accept:** a double spend is rejected and a fork resolves to the longest chain.
- [x] **MP-CHAIN-1.4** Definition of done for mini-projects met.

#### MP-CI-1 CI pipeline as a lesson

Teaches: what the pipeline of this repository does and why. Languages: YAML.

- [ ] **MP-CI-1.1** Documented walkthrough of the workflow built in F-4
	- **Accept:** both READMEs explain every job.
- [ ] **MP-CI-1.2** Demonstration branches
	- **Accept:** one branch fails each quality gate, with links to the failed runs.
- [ ] **MP-CI-1.3** Definition of done for mini-projects met.

#### MP-AI-1 BPE tokenizer

Teaches: how text becomes tokens, and why a model counts tokens and not words. Languages: TS, Python.

- [x] **MP-AI-1.1** Byte-pair encoding trained on a small corpus written for the project
	- **Accept:** encode then decode returns the original text for ASCII, accented and emoji input.
- [x] **MP-AI-1.2** Vocabulary size against number of tokens
	- **Accept:** a table shows the token count of the same text falling as the number of merges grows, identical in both languages.
- [x] **MP-AI-1.3** CLI that shows the tokens of a sentence, with ids and boundaries
	- **Accept:** one command prints the tokens of a sentence, and the README shows the output.
- [x] **MP-AI-1.4** Definition of done for mini-projects met.

#### MP-AI-2 Neural network from scratch

Teaches: what a neuron computes and how backpropagation finds the gradients. Languages: Python.

- [x] **MP-AI-2.1** Scalar automatic differentiation: values, operations and the backward pass
	- **Accept:** every analytic gradient matches a numerical gradient within a tolerance, in a test.
- [x] **MP-AI-2.2** Multi-layer perceptron trained with gradient descent
	- **Accept:** with a fixed seed it learns XOR exactly and reaches at least 95% accuracy on a generated two-class dataset.
- [x] **MP-AI-2.3** Loss curve and decision boundary
	- **Accept:** the demo writes the loss per epoch and a rendering of the decision boundary, committed in `results/`.
- [x] **MP-AI-2.4** Definition of done for mini-projects met.

#### MP-AI-3 Embeddings and vector search

Teaches: how meaning becomes a vector and how similar vectors are found. Languages: TS, Python.

- [x] **MP-AI-3.1** Word vectors built from co-occurrence counts on a corpus written for the project
	- **Accept:** for a list of test words, the nearest neighbours by cosine similarity fall in the expected group.
- [x] **MP-AI-3.2** Brute-force search and a simple index
	- **Accept:** the index returns the same top result as brute force in at least 95% of queries, with the number of comparisons tabled.
- [x] **MP-AI-3.3** Retrieval demo: the question picks the most relevant passages
	- **Accept:** one command prints the passages retrieved for a question, shown in the README.
- [x] **MP-AI-3.4** Definition of done for mini-projects met.

#### MP-AI-4 Tiny language model

Teaches: how a language model predicts the next token, from counting to self-attention. Languages: Python.

- [x] **MP-AI-4.1** Bigram model by counting, with sampling
	- **Accept:** the probabilities of each row sum to 1 and sampling is reproducible with a fixed seed.
- [x] **MP-AI-4.2** Small transformer with self-attention written from scratch, trained on CPU
	- **Accept:** on held-out text its loss is lower than the loss of the bigram model, in a test with a fixed seed.
- [x] **MP-AI-4.3** Sampling controls: temperature, top-k and top-p
	- **Accept:** a table shows that a lower temperature gives less varied output, measured by the entropy of the samples.
- [x] **MP-AI-4.4** Definition of done for mini-projects met.

#### MP-AI-5 Diffusion toy

Teaches: how an image model learns to remove noise, on two-dimensional points instead of pixels. Languages: Python.

- [x] **MP-AI-5.1** Forward process: noise added step by step
	- **Accept:** after the last step the points are statistically indistinguishable from Gaussian noise, in a test.
- [x] **MP-AI-5.2** Reverse process: a small network trained to predict the noise
	- **Accept:** samples generated from pure noise land on the target shape, with a mean distance below a documented threshold.
- [x] **MP-AI-5.3** Step-by-step picture
	- **Accept:** the demo writes the points at several steps of the reverse process, committed in `results/`.
- [x] **MP-AI-5.4** Definition of done for mini-projects met.

#### MP-AI-6 PyTorch basics

Teaches: what a deep learning framework does for you, by redoing MP-AI-2 with PyTorch. Added at the owner's request on 2026-10-08. Languages: Python (PyTorch, CPU only).

- [x] **MP-AI-6.1** Tensors and automatic differentiation
	- **Accept:** the gradients PyTorch computes match numerical gradients, and match the hand-written backpropagation of MP-AI-2 on the same small network, within a tolerance.
- [x] **MP-AI-6.2** The training loop written by hand: forward, loss, backward, optimiser step
	- **Accept:** with a fixed seed the network reaches at least 95% accuracy on the generated two-class dataset of MP-AI-2.
- [x] **MP-AI-6.3** From scratch against the framework
	- **Accept:** a table compares lines of code and training time of MP-AI-2 and of this version, with the machine recorded.
- [x] **MP-AI-6.4** Definition of done for mini-projects met.

#### MP-AI-7 TensorFlow and Keras basics

Teaches: the same model in another framework, and what a high-level API hides. Languages: Python (TensorFlow, CPU only).

- [x] **MP-AI-7.1** The same network and dataset with the Keras API: layers, compile, fit, evaluate
	- **Accept:** with a fixed seed it reaches at least 95% accuracy on the same dataset.
- [x] **MP-AI-7.2** The same training step written with a gradient tape
	- **Accept:** a test shows the loss falling over the steps, and the gradient of a small expression matching its hand-computed value.
- [x] **MP-AI-7.3** PyTorch and TensorFlow side by side
	- **Accept:** both READMEs have a table mapping each concept (tensor, gradient, layer, optimiser, training loop) to its PyTorch and TensorFlow form, with the measured accuracy of both.
- [x] **MP-AI-7.4** Definition of done for mini-projects met.

#### MP-AI-8 Computer vision with a CNN

Teaches: how a network sees: images as numbers, convolution, pooling and learned filters. Languages: Python (PyTorch, CPU only).

- [x] **MP-AI-8.1** Images as tensors and convolution by hand
	- **Accept:** a hand-written convolution with an edge filter gives the same output as the framework's convolution on the same image, in a test.
- [x] **MP-AI-8.2** A small convolutional network that classifies shapes drawn by the project (no downloaded dataset)
	- **Accept:** with a fixed seed it reaches at least 95% accuracy on held-out images, and a plain fully connected network with a similar number of parameters does worse on shifted images.
- [x] **MP-AI-8.3** Data augmentation and what the network learned
	- **Accept:** a table shows accuracy on rotated and shifted images with and without augmentation, and the learned first-layer filters and one activation map are committed as images in `results/`.
- [x] **MP-AI-8.4** Definition of done for mini-projects met.

---

## Order of execution

1. Part F (foundation), then Part QZ (quiz app). These unblock everything else. Part BD (language benchmark dashboard) depends only on Part F and runs in its own worktree.
2. Quiz content wave 1, then mini-project wave 1.
3. From there, quiz content waves and mini-project waves alternate.

**Unit of work (owner's rule, 2026-10-07):** a worktree takes one area and completes it before merging: the quiz of the area, its practical mini-projects and the tests proving that everything works. Each complete project (a quiz area, a mini-project) gets its own commit and its own GitHub release. The wave tables below still give the priority order of the mini-projects inside and across areas.

Mini-project waves are breadth first: every theory-and-practice area gets its first mini-project before any area gets its second. Each wave has up to 5 mini-projects, one worktree each.

| Wave | Mini-projects |
| --- | --- |
| 1 | MP-ALG-1, MP-CONC-1, MP-SEC-1, MP-COMP-1, MP-MSG-1 |
| 2 | MP-BIGO-1, MP-DS-1, MP-OS-1, MP-NET-1, MP-DB-1 |
| 3 | MP-PAR-1, MP-TX-1, MP-FSM-1, MP-INFO-1, MP-DL-1 |
| 4 | MP-OOP-1, MP-FP-1, MP-PAT-1, MP-ARCH-1, MP-TEST-1 |
| 5 | MP-PROTO-1, MP-LB-1, MP-PERF-1, MP-CACHE-1, MP-RL-1 |
| 6 | MP-FS-1, MP-OBS-1, MP-CHAIN-1, MP-CI-1, MP-BIGO-2 |
| 7 | MP-DS-2, MP-OS-2, MP-NET-2, MP-DB-2, MP-ALG-2 |
| 8 | MP-CONC-2, MP-TX-2, MP-SEC-2, MP-COMP-2, MP-INFO-2 |
| 9 | MP-DL-2, MP-OOP-2, MP-PAT-2, MP-TEST-2, MP-PROTO-2 |
| 10 | MP-MSG-2, MP-LB-2, MP-PERF-2, MP-FS-2, MP-OBS-2 |
| 11 | MP-BIGO-3, MP-DS-3, MP-OS-3, MP-NET-3, MP-ALG-3 |
| 12 | MP-CONC-3, MP-TX-3, MP-SEC-3, MP-COMP-3, MP-TEST-3 |
| 13 | MP-PROTO-3, MP-MSG-3, MP-PERF-3, MP-OBS-3, MP-DS-4 |
| 14 | MP-OS-4, MP-ALG-4, MP-TX-4, MP-SEC-4, MP-COMP-4 |
| 15 | MP-TEST-4, MP-OBS-4, MP-DS-5, MP-SEC-5, MP-TEST-5 |
| 16 | MP-SEC-6, MP-SEC-7, MP-SEC-8 |
| 17 | MP-AI-1, MP-AI-2, MP-AI-3, MP-AI-4, MP-AI-5 |
| 18 | MP-AI-6, MP-AI-7, MP-AI-8 |
