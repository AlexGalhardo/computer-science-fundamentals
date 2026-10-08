# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The project is now called **Computer Science Fundamentals**, in the READMEs, the quiz app, `package.json` and the agent docs. The GitHub repository keeps its address.
- Third-party skills in `.claude/skills/` are plain Markdown folders with their licences, no longer git submodules.
- `README.md` is English only, with `README-ptbr.md` next to it, a table of what each area teaches and a roadmap for beginners.
- The artificial intelligence area grew to 164 questions and 8 mini-projects, adding PyTorch, TensorFlow and computer vision.

## [0.80.0] - 2026-10-07

### Added

- Mini-project `projects/oop/code-smells` (TypeScript and Java): before and after for long method, god class, feature envy, shotgun surgery and primitive obsession, the same tests passing on both, and polymorphism replacing a conditional chain. The OOP area is complete.

## [0.79.0] - 2026-10-07

### Added

- Mini-project `projects/oop/oop-vs-functional` (Java, TypeScript and Elixir): the same shopping cart rules written with objects and with pure functions over immutable data, passing the same scenarios, with a generated comparison table.

## [0.78.0] - 2026-10-07

### Added

- Quiz area complete: object-oriented programming, 100 questions in Portuguese and English, with the Java fragments executed, blind-reviewed with 100 of 100 agreement and 2 reviewer notes resolved (`quiz/content/oop/review.md`).

## [0.77.0] - 2026-10-07

### Added

- Language benchmark dashboard in `benchmarks/`: eight workloads in the seven languages (single-thread CPU, parallelism, concurrency, HTTP server under local k6, memory, build time, binary size and database access) and a static, didactic dashboard with explanation cards, tooltips, a glossary and a methodology section, in Portuguese and English. It opens from disk with no network.

## [0.76.0] - 2026-10-07

### Added

- Mini-project `projects/design-patterns/solid-before-after` (TypeScript and Java): one violating module per SOLID principle, its refactor passing the same tests, and the cost of one new requirement before and after. The design patterns area is complete.

## [0.75.0] - 2026-10-07

### Added

- Mini-project `projects/design-patterns/backend-patterns` (TypeScript): Strategy, Observer, Factory, Adapter, Decorator, Repository, Command, State and Builder, each with the design it replaces and tests, and Singleton with a test that exposes its hidden shared state.

## [0.74.0] - 2026-10-07

### Added

- Quiz area complete: design patterns and SOLID, 100 questions in Portuguese and English, blind-reviewed with 100 of 100 agreement and 4 reviewer notes resolved (`quiz/content/design-patterns/review.md`).

## [0.73.0] - 2026-10-07

### Added

- Mini-project `projects/functional-programming/pure-functions-properties` (TypeScript and Elixir): impure and pure versions of the same module, a small property-testing library written from scratch with shrinking, a property that finds a seeded bug the example tests miss, and the same pipeline in both languages. The functional programming area is complete.

## [0.72.0] - 2026-10-07

### Added

- Quiz area complete: functional programming, 100 questions in Portuguese and English, with every code fragment executed, blind-reviewed with 100 of 100 agreement and 5 reviewer notes resolved (`quiz/content/functional-programming/review.md`).

## [0.71.0] - 2026-10-07

### Added

- Mini-project `projects/software-architecture/clean-architecture-app` (TypeScript): a note-taking application in entities, use cases, adapters and drivers, with an automated check of the dependency rule, HTTP and CLI delivery, memory and PostgreSQL repositories, and a swap that changes only the composition root. The software architecture area is complete.

## [0.70.0] - 2026-10-07

### Added

- Quiz area complete: software architecture, 100 questions in Portuguese and English, blind-reviewed in English and in Portuguese with 100 of 100 agreement and the reviewer notes resolved (`quiz/content/software-architecture/review.md`).

## [0.69.0] - 2026-10-07

### Added

- Quiz area complete: electronics, a theory-only area, 170 questions in Portuguese and English following the 34 chapters of the source book, blind-reviewed with 170 of 170 agreement and 3 reviewer notes resolved (`quiz/content/electronics/review.md`).

## [0.68.0] - 2026-10-07

### Added

- Mini-project `projects/digital-logic/nand-alu-cpu` (Go and TypeScript): every gate derived from NAND, a 4-bit ALU with flags tested exhaustively, and a 4-bit CPU whose committed program multiplies two numbers, with the trace in the README. The digital logic area is complete.

## [0.67.0] - 2026-10-07

### Added

- Mini-project `projects/digital-logic/gates-karnaugh-adders` (TypeScript and Python): a gate simulator and truth-table generator, Quine-McCluskey minimisation checked on every function of 3 and 4 variables, and an 8-bit ripple-carry adder verified on all 65,536 input pairs.

## [0.66.0] - 2026-10-07

### Added

- Quiz area complete: digital logic, 100 questions in Portuguese and English, blind-reviewed in English and in Portuguese with 100 of 100 agreement (`quiz/content/digital-logic/review.md`).

## [0.65.0] - 2026-10-07

### Added

- Mini-project `projects/algorithms/hybrid-quicksort` (C++ and Rust): pivot strategies, the switch to insertion sort below a threshold, a sweep of that threshold, and a dashboard by input shape. The algorithms area is complete.

## [0.64.0] - 2026-10-07

### Added

- Mini-project `projects/algorithms/travelling-salesman` (TypeScript and Rust): brute force and Held-Karp solvers, nearest neighbour and 2-opt heuristics within a documented factor of the optimum, and the size at which brute force passes 10 seconds.

## [0.63.0] - 2026-10-07

### Added

- Mini-project `projects/algorithms/dynamic-programming` (TypeScript and Python): knapsack, longest common subsequence and coin change, each naive, memoised and tabulated, with call counters and a demo that prints the filled table.

## [0.62.0] - 2026-10-07

### Added

- Mini-project `projects/algorithms/sorting-race` (all 7 languages): bubble, insertion, merge, quick, heap and radix sort with the same tests and the same checksum in every language, a benchmark by size, and a static dashboard of time against n.

## [0.61.0] - 2026-10-07

### Added

- Quiz area complete: algorithms, 100 questions in Portuguese and English, blind-reviewed with 100 of 100 agreement (`quiz/content/algorithms/review.md`).

## [0.60.0] - 2026-10-07

### Added

- Mini-project `projects/information-theory/error-detection-correction` (C++): parity, checksum and CRC-32 matching the standard check value, Hamming(7,4) correcting every single-bit error, and a noise simulator. The information theory area is complete.

## [0.59.0] - 2026-10-07

### Added

- Mini-project `projects/information-theory/huffman-lz77` (Rust and Python): a Shannon entropy calculator, lossless Huffman and LZ77 encoders and decoders, and a table of compression ratio against entropy for five sample files.

## [0.58.0] - 2026-10-07

### Added

- Quiz area complete: information theory, 100 questions in Portuguese and English, blind-reviewed with 100 of 100 agreement (`quiz/content/information-theory/review.md`).

## [0.57.0] - 2026-10-07

### Added

- Mini-project `projects/compilers/regex-engine` (Go): a regex parser, Thompson construction to NFA and subset construction to DFA, agreement with Go's `regexp` on 1,000 generated cases, and linear time on a pattern where backtracking is exponential. The compilers area is complete.

## [0.56.0] - 2026-10-07

### Added

- Mini-project `projects/compilers/bytecode-vm` (Rust): a compiler from the tree to stack bytecode with a disassembler, a stack virtual machine that runs the same example programs, and a benchmark against the tree-walking interpreter.

## [0.55.0] - 2026-10-07

### Added

- Mini-project `projects/compilers/tree-walking-interpreter` (TypeScript): an evaluator for the mini language with scopes, functions and closures, run-time errors with line and column, and a REPL that keeps state.

## [0.54.0] - 2026-10-07

### Added

- Mini-project `projects/compilers/mini-language-parser` (TypeScript): the mini language defined in EBNF, a lexer with positions, a recursive-descent parser with Pratt parsing for expressions and error recovery, and a REPL that prints tokens and tree.

## [0.53.0] - 2026-10-07

### Added

- Quiz area complete: compilers, 100 questions in Portuguese and English, blind-reviewed with 100 of 100 agreement and 7 reviewer notes resolved (`quiz/content/compilers/review.md`).

## [0.52.0] - 2026-10-07

### Added

- Mini-project `projects/parallelism/scaling-by-cores` (Rust, Go and C++): prime counting and Mandelbrot, sequential and parallel with static and dynamic scheduling, speed-up and efficiency for 1, 2, 4 and 8 workers, and the serial fraction estimated with Amdahl's law. The parallelism area is complete.

## [0.51.0] - 2026-10-07

### Added

- Quiz area complete: parallelism, 100 questions in Portuguese and English, blind-reviewed in English and in Portuguese with no disagreement (`quiz/content/parallelism/review.md`).

## [0.50.0] - 2026-10-07

### Added

- Security lab `projects/security/upload-path-traversal-lab`: upload and download endpoints that leak a file outside the upload folder, fixed with generated names, a canonical path check and type and size validation. The security area is complete.

## [0.49.0] - 2026-10-07

### Added

- Security lab `projects/security/jwt-lab`: a verifier that accepts unsigned tokens, a weak secret and expired tokens, and the fixed verifier with a pinned algorithm, a strong key and expiry and audience checks.

## [0.48.0] - 2026-10-07

### Added

- Security lab `projects/security/passwords-sessions-lab`: password storage compared (plain, MD5, salted SHA-256, Argon2) on fake data, and a login with attempt limiting, secure cookie flags and session rotation.

## [0.47.0] - 2026-10-07

### Added

- Security lab `projects/security/ssrf-lab`: a URL-fetch feature that reaches a fake internal service, fixed with an allow-list and scheme and resolved-address validation, including through a redirect.

## [0.46.0] - 2026-10-07

### Added

- Security lab `projects/security/access-control-lab`: an API that trusts the id in the URL, fixed with ownership and role checks in one place and an authorisation test matrix.

## [0.45.0] - 2026-10-07

### Added

- Security lab `projects/security/csrf-lab`: a forged request from a second local origin succeeds against the vulnerable endpoint and is rejected by an anti-CSRF token and by SameSite cookies, each tested on its own.

## [0.44.0] - 2026-10-07

### Added

- Security lab `projects/security/xss-csp-lab`: stored, reflected and DOM-based cross-site scripting shown by Playwright inside the lab, and the fixes (output encoding, safe DOM APIs, Content Security Policy) proven by the same tests.

## [0.43.0] - 2026-10-07

### Added

- Security lab `projects/security/sql-injection-lab`: local only, on an internal Docker network. A vulnerable login and search built with concatenated SQL, the fixed version with parameterised queries, validation and a least-privilege database user, and tests proving the fix.

## [0.42.0] - 2026-10-07

### Added

- Quiz area complete: security, 100 defensive questions in Portuguese and English, blind-reviewed with 100 of 100 agreement and 8 reviewer notes resolved (`quiz/content/security/review.md`).

## [0.41.0] - 2026-10-07

### Added

- Mini-project `projects/state-machines/order-state-machine` (TypeScript and Elixir): an order life cycle driven by one transition table, tests and the diagram generated from that table, and a CLI that walks an order through events. The state machines area is complete.

## [0.40.0] - 2026-10-07

### Added

- Quiz area complete: state machines, 100 questions in Portuguese and English, blind-reviewed with 100 of 100 agreement (`quiz/content/state-machines/review.md`).

## [0.39.0] - 2026-10-07

### Added

- Mini-project `projects/concurrency/ten-thousand-connections` (TypeScript, Go and Elixir): the same server on an event loop, goroutines and BEAM processes holding 10,000 local connections under k6, with memory per connection and latency percentiles. The concurrency area is complete.

## [0.38.0] - 2026-10-07

### Added

- Mini-project `projects/concurrency/dining-philosophers` (Go and Java): a version that deadlocks, fixed by lock ordering and by a waiter, with the captured thread dumps annotated line by line.

## [0.37.0] - 2026-10-07

### Added

- Mini-project `projects/concurrency/counter-race` (Go, Rust, Java, TypeScript and Elixir): an unsynchronised counter that loses updates, four fixes (mutex, atomic, channel, actor), the race detectors flagging only the buggy version, and a throughput benchmark by number of workers.

## [0.36.0] - 2026-10-07

### Added

- Quiz area complete: concurrency, 100 questions in Portuguese and English, blind-reviewed with no disagreement (`quiz/content/concurrency/review.md`).

## [0.35.0] - 2026-10-07

### Added

- Mini-project `projects/data-structures/balanced-trees` (C++ and Java): unbalanced BST, AVL and red-black trees with one interface, height and rotation counters (height 100,000 against 17 and 31 on sorted input), and a step-by-step rotation visualiser. The data structures area is complete.

## [0.34.0] - 2026-10-07

### Added

- Mini-project `projects/data-structures/lru-bloom-trie` (TypeScript and Go): an O(1) LRU cache checked against a reference model, a Bloom filter whose measured false-positive rate matches the theory, and a trie with prefix listing.

## [0.33.0] - 2026-10-07

### Added

- Mini-project `projects/data-structures/b-tree-on-disk` (C++ and Rust): a B-tree stored in a file with split, merge and redistribution, a page-read counter, and a comparison with a binary search tree on disk (about 3 page reads against 16 per search in 1,000,000 keys).

## [0.32.0] - 2026-10-07

### Added

- Mini-project `projects/data-structures/graph-algorithms` (C++ and Go): adjacency list and matrix behind one test suite, Dijkstra, Bellman-Ford, topological sort, Prim and Kruskal, and the 10 reference cases passing in both languages.

## [0.31.0] - 2026-10-07

### Added

- Mini-project `projects/data-structures/hash-map` (C++, Rust and TypeScript): separate chaining and linear probing with tombstones, property tests against the language's own map, and a lookup benchmark by load factor.

## [0.30.0] - 2026-10-07

### Added

- Mini-project `projects/networks/dns-subnet` (Go and TypeScript): an iterative DNS resolver against a fake root, TLD and authoritative hierarchy on an internal Docker network, a cache with time to live, and a subnet calculator. The networks area is complete.

## [0.29.0] - 2026-10-07

### Added

- Mini-project `projects/networks/aloha-csma` (Python): simulation of pure ALOHA, slotted ALOHA and CSMA/CD with binary exponential backoff, with throughput peaks within 5% of the theoretical 18.4% and 36.8%, and a chart generated from the committed results.

## [0.28.0] - 2026-10-07

### Added

- Mini-project `projects/networks/sliding-window-mini-tcp` (Go and Elixir): a deterministic lossy channel, stop-and-wait, go-back-N and selective repeat, and a mini TCP over UDP that transfers 10 MB intact with injected loss.

## [0.27.0] - 2026-10-07

### Added

- Mini-project `projects/operating-systems/deadlock-mini-shell` (Go and C++): deadlock detection on a resource allocation graph and the banker's algorithm in Go, and a mini shell with pipes, redirection and signals in C++. The operating systems area is complete.

## [0.26.0] - 2026-10-07

### Added

- Mini-project `projects/operating-systems/memory-allocator` (C++ and Rust): first fit, best fit, worst fit and buddy system over a fixed arena, coalescing of free blocks, and a fragmentation table per strategy.

## [0.25.0] - 2026-10-07

### Added

- Mini-project `projects/operating-systems/paging-tlb` (Rust and TypeScript): page table and TLB with hit and miss counters, FIFO, clock, LRU and optimal replacement, and Belady's anomaly shown by a test.

## [0.24.0] - 2026-10-07

### Added

- Mini-project `projects/operating-systems/cpu-scheduling` (TypeScript and Python): FCFS, shortest job first, round-robin, priority and multilevel feedback, with a Gantt chart in the CLI and on a static page, and a comparison on generated workloads.

## [0.23.0] - 2026-10-07

### Added

- GitHub Actions workflow verified: a pull request with a formatting error failed, and the same pull request fixed passed every job (Biome, type check, unit tests, quiz validation, formatter checks for Python, Go, Rust, C++ and Elixir, and the quiz end-to-end tests).

## [0.22.0] - 2026-10-07

### Added

- Mini-project `projects/transactions/outbox-saga` (TypeScript): order and payment services on RabbitMQ, the dual-write bug against the transactional outbox under an injected crash, and a saga with compensation. The transactions area is complete.

## [0.21.0] - 2026-10-07

### Added

- Mini-project `projects/transactions/orm-vs-sql` (TypeScript): the same five queries in Prisma, Drizzle and raw SQL with the captured SQL committed, a latency benchmark, and an N+1 example (151 statements) with its fix (2).

## [0.20.0] - 2026-10-07

### Added

- Mini-project `projects/transactions/overselling-checkout` (TypeScript): a naive checkout that oversells under 200 concurrent local buyers, and three fixes (version column, `SELECT FOR UPDATE`, `SERIALIZABLE` with retry) that sell exactly the stock.

## [0.19.0] - 2026-10-07

### Added

- Mini-project `projects/transactions/isolation-levels` (TypeScript and SQL): two-session harness with a fixed interleaving, and the matrix of isolation level against anomaly generated by the tests on PostgreSQL. 37 tests in Docker.

## [0.18.0] - 2026-10-07

### Added

- Quiz area complete: transactions, 100 questions in Portuguese and English, blind-reviewed in two rounds with no disagreement (`quiz/content/transactions/review.md`).

## [0.17.0] - 2026-10-07

### Added

- Mini-project `projects/databases/normalisation-tool` (Python): attribute closure, candidate keys, normal form check, lossless decomposition to 3NF and BCNF verified by a chase test, and a CLI that explains each step. 47 tests in Docker. The databases area is complete.

## [0.16.0] - 2026-10-07

### Added

- Mini-project `projects/databases/mini-dbms` (Rust and Python): selection, projection and nested-loop, hash and sort-merge joins checked against SQLite, with a benchmark by table size.

## [0.15.0] - 2026-10-07

### Added

- Mini-project `projects/big-o/sorting-lower-bound` (TypeScript and Python): decision trees for n = 3 and 4, comparison counters against `lg(n!)`, and counting and radix sort with zero comparisons. 41 tests in Docker. The Big O area is complete.

## [0.14.0] - 2026-10-07

### Added

- Mini-project `projects/big-o/master-theorem` (TypeScript): classifier for `T(n) = aT(n/b) + f(n)`, empirical check by counting calls, and a static page that draws the recursion tree. 25 tests in Docker.

## [0.13.0] - 2026-10-07

### Added

- Mini-project `projects/big-o/big-o-lab` (TypeScript): instrumented samples of six complexity classes, curve fitting that names the class of each one, and a static dashboard. 29 tests in Docker.

## [0.12.0] - 2026-10-07

### Added

- Quiz area complete: operating systems, 100 questions in Portuguese and English. The blind reviewer agreed with the answer key on all 100 and flagged none (`quiz/content/operating-systems/review.md`).

## [0.11.0] - 2026-10-07

### Added

- Quiz area complete: networks, 100 questions in Portuguese and English. The blind reviewer agreed with the answer key on all 100, and three statements that depended on an unstated convention were rewritten (`quiz/content/networks/review.md`).

## [0.10.0] - 2026-10-07

### Added

- Quiz area complete: databases (theory), 100 questions in Portuguese and English. The blind review moved 13 tables, graphs and schedules from the explanation to the statement, and after that the reviewer agreed with the answer key on all 100 (`quiz/content/databases/review.md`).

## [0.9.0] - 2026-10-07

### Added

- Quiz area complete: Big O and algorithm analysis, 100 questions in Portuguese and English. The blind review moved 10 code fragments from the explanation to the statement, and after that the reviewer agreed with the answer key on all 100 (`quiz/content/big-o/review.md`).

## [0.8.0] - 2026-10-07

### Added

- Quiz area complete: data structures, 100 questions in Portuguese and English. The independent blind reviewer agreed with the answer key on all 100, and the one statement it flagged was rewritten (`quiz/content/data-structures/review.md`).

## [0.7.0] - 2026-10-07

### Added

- Quiz app in `quiz/`: Next.js static site generation with Tailwind CSS v4, no back end. One page per area and per language, question screen in two columns with the explanation shown after the answer, keyboard shortcuts, progress in the browser, review of wrong answers, difficulty filter and seeded shuffle of questions and alternatives.
- Portuguese and English for the interface and the questions, with typed dictionaries, and a light and dark theme applied before the first paint.
- Docker image, `setup-unix-quiz.sh` and `setup-windows-quiz.ps1`: the quiz is served as static files by Caddy on `localhost`.
- 36 unit tests and 22 Playwright end-to-end tests run inside Docker, including automated accessibility and contrast checks in both themes and layout checks at 320, 390, 768 and 1280 px.
- Quiz content of wave 1, 500 questions in Portuguese and English: Big O, data structures, operating systems, networks and databases. Blind review in progress.
- `snippet` field for code or diagrams that are part of the question and are shown before the answer.
- GitHub Actions workflow: Biome, type check, unit tests, quiz validation, formatter checks per language, quiz end-to-end tests, and the tests of each mini-project whose folder changed.

### Fixed

- `quiz:validate` and `quiz:blind` ignored the area argument when no flag was given.
- Alternatives are compared case-sensitively, so `O(n)` and `o(n)` can be alternatives of the same question.

## [0.6.0] - 2026-10-07

### Added

- Root Bun workspace with Biome 2.5.15, and formatter configuration for Python, Rust, C++, Go, Elixir and Java.
- `docker/`: one pinned base image per language (TypeScript, Python, Go, Rust, C++, Java, Elixir) and the hyperfine image, documented in `docs/en/environment.md` and `docs/pt/environment.md`.
- `tools/bench`: benchmark contract (Zod schema and `schema.json`) and the runner behind `bun run bench -- --project <name>`, which runs hyperfine inside Docker with no network and writes `results.md`, `results.json` and `results.js`. Documented in `docs/en/benchmarks.md` and `docs/pt/benchmarks.md`.
- `tools/scaffold`: `bun run new:project <area> <name> --langs ...` creates a mini-project with both READMEs, both setup scripts, docker-compose, one tested folder per language and the static dashboard template.
- Quiz content model in `quiz/`: Zod schemas for questions and coverage maps, `bun run quiz:validate`, and the blind review scripts `quiz:blind` and `quiz:compare`.
- Quiz authoring guide in `docs/en/quiz-authoring.md` and `docs/pt/quiz-authoring.md`.
- `PLAN.md` Part BD: a language benchmark dashboard, separate from the quiz.
- `questions-to-dev.md`: open questions for the owner, each with the provisional decision taken.

### Changed

- Phase 4 runs on the main session plus up to 10 worktrees. Each worktree completes one area (quiz, mini-projects and tests), and each complete project gets its own commit and release.
- Zod is the default schema validation library.

## [0.5.0] - 2026-10-07

### Added

- `PLAN.md` completed: coverage maps for the 31 quiz areas (3,220 questions), 78 mini-projects detailed with acceptance criteria, and the order of execution in 16 breadth-first waves.
- Quiz requirements: i18n (PT and EN), light and dark theme toggle and mobile-friendly layout, with Next.js SSG and Tailwind CSS v4.
- Theory and practice rule: theory-only areas get a larger quiz and no mini-project, technical areas get runnable examples plus the quiz.

### Changed

- Electronics and Software engineering are quiz only; their mini-projects left the catalog.

## [0.4.0] - 2026-10-07

### Added

- `PLAN.md`, stage 1: outline of the 31 areas, foundation, quiz app, the first wave of quiz content with coverage maps and the first wave of mini-projects, with acceptance criteria.

## [0.3.0] - 2026-10-07

### Added

- Quiz design in `docs/en/quiz.md` and `docs/pt/quiz.md`: the quiz becomes the main product of the repository.
- Brainstorming record in `docs/en/brainstorming.md` and `docs/pt/brainstorming.md`, with the chosen and the discarded options.
- Four new areas (electronics, software architecture, database theory, software engineering) and the ideas taken from the book summaries, in the mini-project catalog.
- Summaries of two more books in `references/summaries/books/`.
- `.claude/rules/quiz.md`.

## [0.2.0] - 2026-10-07

### Added

- `references/`: study material imported from the previous repository (algorithms, university coursework, course exercises and notes), with a bilingual `references/README.md` mapping origin to destination and listing what was left out.
- `references/projects/`: the legacy `learning-load-stress-tests` and `learning-message-queue-and-pub-sub` projects, kept as raw material for future mini-projects.
- Phase 2 decisions and the mini-project catalog, in `docs/en/` and `docs/pt/` (`decisions.md`, `mini-project-catalog.md`).
- `references/summaries/`: Markdown summaries of the 252 books, articles and lecture PDFs of the previous repository. The PDFs themselves are not included.
- Third-party skill repositories pinned as shallow git submodules under `.claude/skills/`: `andrej-karpathy-skills`, `graphify`, `agent-skills`, `superpowers` and `ponytail`.

## [0.1.0] - 2026-10-07

### Added

- Repository bootstrap with a fresh git history on `main`.
- Root files: `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `PLAN.md`, `.editorconfig` and `.gitignore`.
- Bilingual documentation skeleton under `docs/pt/` and `docs/en/`.
- Agent onboarding: `CLAUDE.md`, `AGENTS.md`, `.claude/agents.md` and `.claude/rules/`.
- `.gitattributes` enforcing LF line endings, CRLF only for Windows scripts.

[Unreleased]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/releases/tag/v0.1.0
