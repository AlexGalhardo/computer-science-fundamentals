<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

# Computer Science Fundamentals

Computer science fundamentals you can **answer, run and measure**: a trilingual
quiz covering 32 areas, and small runnable mini-projects that show each concept
working, with tests, benchmarks and step-by-step explanations written for
beginners.

[![CI](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue.svg)](https://semver.org/)

<!-- markdownlint-disable-next-line MD001 -->
### [Leia em Português Brasil](./README-ptbr.md)

### [Lea en Español](./README-es.md)

</div>

## Table of contents

- [Introduction](#introduction)
- [What you will learn](#what-you-will-learn)
- [Roadmap for beginners](#roadmap-for-beginners)
- [Quick start](#quick-start)
- [Tech stack](#tech-stack)
- [Docs](#docs)
- [Repository layout](#repository-layout)
- [How this project is built](#how-this-project-is-built)
- [How to contribute](#how-to-contribute)
- [Credits](#credits)

## Introduction

**Computer Science Fundamentals** is a long-term, open source (MIT) study
reference. It has two parts that point at each other:

- **A quiz.** Multiple choice, 5 alternatives, in English, Portuguese and Spanish. After
  you answer, the explanation appears next to the question: the concept, why the
  right alternative is right, why each of the others is wrong, and a link to the
  mini-project that shows the idea running.
- **Mini-projects.** Small programs that make one concept observable: a race
  condition that loses updates and four ways to fix it, a B-tree that reads 3
  pages where a binary tree reads 16, a SQL injection and the query that stops
  it. Each one has tests, a demo or benchmark, and documentation in all three
  languages (English, Portuguese and Spanish). Everything runs in Docker, so the only requirement is Docker.

The live status of every area (questions written, blind review, mini-projects
done) is generated from the repository itself:
[docs/en/README.md](./docs/en/README.md).

Work on this project started in **October 2026**, written with **Claude Code
(Claude Opus 5.5)** and reviewed by its author. See
[How this project is built](#how-this-project-is-built).

## What you will learn

Each area has a quiz and, except for the two theory-only areas, a folder in
[`projects/`](./projects) with its mini-projects and study references.

| Area | What the mini-projects show |
| --- | --- |
| [Big O and algorithm analysis](./projects/big-o) | measuring a function and naming its growth curve, the master theorem, why comparison sorts cannot beat n log n |
| [Algorithms](./projects/algorithms) | the same six sorts in seven languages, dynamic programming, where brute force stops, hybrid quicksort |
| [Data structures](./projects/data-structures) | a hash map from scratch, graph algorithms, a B-tree on disk, LRU cache, Bloom filter, trie, balanced trees |
| [Operating systems](./projects/operating-systems) | CPU scheduling, paging and the TLB, memory allocators, deadlock detection, a mini shell |
| [Networks](./projects/networks) | reliable delivery over a lossy channel, a mini TCP, ALOHA and CSMA/CD, a DNS resolver, subnets |
| [Databases (theory)](./projects/databases) | a mini relational engine with three join algorithms, a normalisation tool |
| [Transactions](./projects/transactions) | isolation levels and their anomalies, overselling under load, what an ORM costs, outbox and saga |
| [Concurrency](./projects/concurrency) | a counter race and four fixes, dining philosophers, ten thousand connections on three runtimes |
| [Parallelism](./projects/parallelism) | speed-up by cores and Amdahl's law |
| [Security](./projects/security) | defensive, local-only labs: SQL injection, XSS and CSP, CSRF, access control, SSRF, passwords and sessions, JWT, uploads |
| [Compilers](./projects/compilers) | a lexer and parser, a tree-walking interpreter, a bytecode VM, a regex engine |
| [State machines](./projects/state-machines) | an order life cycle driven by one transition table |
| [Information theory](./projects/information-theory) | entropy, Huffman and LZ77, CRC and Hamming codes |
| [Digital logic](./projects/digital-logic) | gates, Karnaugh minimisation, adders, a NAND-only ALU and a 4-bit CPU |
| [Object-oriented programming](./projects/oop) | the same domain in OOP and functional style, a catalogue of code smells |
| [Functional programming](./projects/functional-programming) | pure functions and property-based tests |
| [Design patterns and SOLID](./projects/design-patterns) | back-end patterns where they pay off, SOLID before and after |
| [Software architecture](./projects/software-architecture) | a clean architecture application and its dependency rule |
| [Testing](./projects/testing) | the full test pyramid, a TDD kata, mutation testing, flaky tests, a test framework from scratch |
| [Protocols](./projects/protocols) | REST, GraphQL and JSON-RPC, HTTP/1.1 to HTTP/3, an HTTP server on raw TCP |
| [Messaging](./projects/messaging) | queues compared, idempotency and dead letters, pub/sub and backpressure |
| [Load balancing](./projects/load-balancing) | NGINX against Caddy, a hand-written layer 7 balancer |
| [Performance](./projects/performance) | Bun against Node, load test scenarios with k6, cache-friendly code |
| [Cache](./projects/cache) | caching strategies and the cache stampede |
| [Rate limiting](./projects/rate-limiting) | the four classic algorithms, in memory and on Redis |
| [File systems](./projects/file-systems) | records and indexes inside a file, external sorting |
| [Observability](./projects/observability) | traces, metrics and logs together, correlation ids, SLOs and alerts, flame graphs |
| [Blockchain](./projects/blockchain) | hashing, proof of work and a longest-chain rule |
| [Continuous integration](./projects/continuous-integration) | the pipeline of this repository, explained |
| [Artificial intelligence and LLMs](./projects/artificial-intelligence) | a tokenizer, a neural network from scratch, embeddings, a tiny language model, a diffusion toy |
| Electronics | theory only: a 170-question quiz |
| Software engineering | theory only: a 150-question quiz |

Every area is finished: the 32 quizzes (3,384 questions, each one in the three
languages, with a theory summary to read before answering) and the 86
mini-projects. The [status page](./docs/en/README.md) shows the numbers of each
area, and [PLAN.md](./PLAN.md) has the full roadmap with the acceptance
criteria that were checked.

## Roadmap for beginners

You do not need to follow the areas in the order above. This order builds each
step on the previous one. For every step: read the area page, answer the quiz
at the basic level, run the first mini-project, then come back for the harder
questions.

1. **How to think about cost.** [Big O](./projects/big-o), then
   [Algorithms](./projects/algorithms) (start with the sorting race).
2. **How data is organised.** [Data structures](./projects/data-structures):
   lists, stacks, queues, trees, hash tables, graphs.
3. **How a computer is built.** [Digital logic](./projects/digital-logic), then
   the Electronics quiz if you want the physical layer.
4. **What runs your program.** [Operating systems](./projects/operating-systems),
   then [File systems](./projects/file-systems).
5. **How computers talk.** [Networks](./projects/networks), then
   [Protocols](./projects/protocols).
6. **Where data lives.** [Databases](./projects/databases), then
   [Transactions](./projects/transactions).
7. **Doing many things at once.** [Concurrency](./projects/concurrency), then
   [Parallelism](./projects/parallelism).
8. **Writing code that lasts.** [OOP](./projects/oop),
   [Functional programming](./projects/functional-programming),
   [Design patterns and SOLID](./projects/design-patterns),
   [Testing](./projects/testing),
   [Software architecture](./projects/software-architecture), and the Software
   engineering quiz.
9. **Keeping systems safe.** [Security](./projects/security).
10. **Running systems at scale.** [Cache](./projects/cache),
    [Rate limiting](./projects/rate-limiting),
    [Load balancing](./projects/load-balancing),
    [Messaging](./projects/messaging), [Performance](./projects/performance),
    [Observability](./projects/observability),
    [Continuous integration](./projects/continuous-integration).
11. **How languages work.** [State machines](./projects/state-machines),
    [Information theory](./projects/information-theory),
    [Compilers](./projects/compilers).
12. **Modern topics.** [Artificial intelligence and LLMs](./projects/artificial-intelligence),
    [Blockchain](./projects/blockchain).

Books, courses, papers and videos for every step are in
[REFERENCES.md](./REFERENCES.md).

## Quick start

The only requirement is [Docker](https://docs.docker.com/get-docker/).

Run the quiz:

```sh
./quiz/setup-unix-quiz.sh        # Linux and macOS
./quiz/setup-windows-quiz.ps1    # Windows
```

Then open <http://localhost:3000>.

Run a mini-project (each one brings its own setup scripts, which build pinned
images and run the tests):

```sh
./projects/big-o/big-o-lab/setup-unix-big-o-lab.sh
```

Its README says what it teaches, how to run the demo, and which quiz topics it
demonstrates.

To work on the repository itself you also need [Bun](https://bun.sh) 1.4.2:

```sh
bun install
bun run lint && bun run typecheck
bun test quiz/tests/unit tools
bun run quiz:validate
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Quiz app | [Next.js](https://nextjs.org) static site generation, [Tailwind CSS v4](https://tailwindcss.com), no back end |
| Content validation | [Zod](https://zod.dev) |
| Languages of the mini-projects | TypeScript ([Bun](https://bun.sh)), Python, Go, Rust, C++, Java, Elixir |
| Environment | [Docker](https://www.docker.com) and docker-compose, one pinned image per language |
| Databases and brokers | PostgreSQL, SQLite, Redis, RabbitMQ, Kafka, LocalStack |
| Web servers and proxies | [ElysiaJS](https://elysiajs.com), Caddy, NGINX |
| Benchmarks and load tests | [hyperfine](https://github.com/sharkdp/hyperfine), [k6](https://k6.io), local targets only |
| Testing | `bun:test`, [Playwright](https://playwright.dev), and the test runner of each language |
| Lint and format | [Biome](https://biomejs.dev), ruff, rustfmt and clippy, gofmt and golangci-lint, clang-format, mix format, Spotless |
| CI | GitHub Actions |

## Docs

| Document | What it covers |
| --- | --- |
| [docs/en/README.md](./docs/en/README.md) | live status of every area, with links to each mini-project |
| [REFERENCES.md](./REFERENCES.md) | books, courses, papers, documentation and videos, by area |
| [PLAN.md](./PLAN.md) | the roadmap, with checklists and acceptance criteria |
| [docs/en/quiz.md](./docs/en/quiz.md) | design of the quiz |
| [docs/en/quiz-authoring.md](./docs/en/quiz-authoring.md) | how questions are written and blind-reviewed |
| [docs/en/environment.md](./docs/en/environment.md) | pinned Docker images and formatters |
| [docs/en/benchmarks.md](./docs/en/benchmarks.md) | the benchmark contract and runner |
| [docs/en/decisions.md](./docs/en/decisions.md) | project decisions and their reasons |
| [quiz/README.md](./quiz/README.md) | the quiz app |
| [CHANGELOG.md](./CHANGELOG.md) | release history |
| [SECURITY.md](./SECURITY.md) | scope of the security labs and of the load tests |
| [AGENTS.md](./AGENTS.md) | onboarding for AI coding agents |

Every document under `docs/en/` has an equivalent under `docs/pt/` and `docs/es/`.

## Repository layout

```text
/quiz/         the quiz app and its questions (quiz/content/<area>/<topic>.json)
/projects/     mini-projects, by area, each with tests, a demo and three READMEs
/benchmarks/   cross-language benchmark workloads and their dashboard
/docs/         documentation per area, in English (en/), Portuguese (pt/) and Spanish (es/)
/tools/        benchmark runner and mini-project generator
/docker/       one pinned base image per language
/.github/      continuous integration
/.claude/      rules and notes for AI coding agents
```

## How this project is built

- **Written with an AI coding agent.** Development started in October 2026 with
  Claude Code (Claude Opus 5.5), working in parallel git worktrees, one complete
  area per worktree.
- **Every question is blind-reviewed.** A second agent answers each area without
  seeing the answer key. Where it disagrees with the key, or flags an ambiguous
  statement, the question is fixed and the resolution is logged in the area's
  `review.md`.
- **Every checkbox has an acceptance criterion.** [PLAN.md](./PLAN.md) states a
  command or an observable fact for each item, and a box is ticked only after
  it was run. Where a criterion could not be met as written, the plan says so.
- **Everything is verified on Linux by CI**, including the tests of each
  mini-project whose folder changes.
- **Security content is defensive.** Labs run only locally, in Docker, on
  internal networks, and every vulnerable example ships with its fix and a test
  proving it. Load tests never target third-party hosts.
- **AI-written material can be wrong.** If you find a mistake in a question or
  an explanation, please open an issue: that is the most useful contribution.

## How to contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/), versions follow
[SemVer](https://semver.org/), and each finished quiz area or mini-project gets
its own release.

## Credits

Built by [Alex Galhardo](https://github.com/AlexGalhardo), with Claude Code.

Licensed under the [MIT License](./LICENSE).
