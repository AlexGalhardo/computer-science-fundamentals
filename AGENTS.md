# AGENTS.md

Project name: **Computer Science Fundamentals** (the GitHub repository is still `AlexGalhardo/computer-science-fundamentals`).

Onboarding for AI coding agents working in this repository. `CLAUDE.md` imports this file, so keep the two in sync by editing only this one.

## What this repository is

An educational, open source (MIT) long-term reference for studying computer science fundamentals through a quiz covering every area and small runnable mini-projects, with demos, benchmarks and trilingual documentation (English, Portuguese and Spanish).

Languages: C++, Python, Java, Elixir, Rust, Go, TypeScript.

## Current state

The project is built in phases and the agent **stops at the end of each phase** for the owner's review. The live status is the checklist at the top of `PLAN.md`.

- Phase 0: repository setup
- Phase 1: import of previous content into `references/` and external skills into `.claude/skills/`
- Phase 2: brainstorming, decisions documented in `docs/pt/` and `docs/en/`
- Phase 3: full `PLAN.md`
- Phase 4: parallel development, the main session plus up to 10 git worktrees. Each worktree takes one area and completes it: quiz, practical mini-projects and tests. Each complete project gets its own commit and GitHub release (see `.claude/rules/git-workflow.md`)

## Layout

| Path | Purpose |
| --- | --- |
| `docs/en/`, `docs/pt/`, `docs/es/` | Documentation per area and sub-area. English is the main language. The three languages are mandatory and must stay equivalent |
| `REFERENCES.md`, `REFERENCES.pt-BR.md`, `REFERENCES.es.md` | Books, courses, papers, documentation and videos for every area, with verified links. Each `projects/<area>/README.md` has the longer list of its area |
| `quiz/` | The quiz app and its questions (see `docs/en/quiz.md` and `docs/en/quiz-authoring.md`) |
| `benchmarks/` | Cross-language benchmark workloads and their static dashboard (planned, Part BD of `PLAN.md`) |
| `tools/bench/` | Benchmark runner: `bun run bench -- --project <name>` (see `docs/en/benchmarks.md`) |
| `tools/scaffold/` | Mini-project generator: `bun run new:project <area> <name> --langs ts,go` |
| `docker/` | Pinned base image per language (see `docs/en/environment.md`) |
| `projects/` | Mini-projects, by area. Live status in `docs/en/README.md` |
| `PLAN.md` | Main roadmap with checklists and verifiable acceptance criteria |
| `CHANGELOG.md` | Keep a Changelog + SemVer |
| `.claude/rules/` | Recurring rules, one topic per file |
| `.claude/agents.md` | Session-to-session notes for agents |
| `.claude/skills/` | Third-party skills as Markdown only, one folder per skill, with their licences (`SOURCES.md` lists the origin of each) |

## Commands

| Command | What it does |
| --- | --- |
| `bun install` | install the workspace (root, `quiz`, `tools/*`) |
| `bun run lint` / `bun run format` | Biome check, and check with fixes |
| `bun run lint:md` / `bun run format:md` | markdownlint on every Markdown file, and the same with automatic fixes (rules in `.markdownlint-cli2.jsonc`) |
| `bun run typecheck` | TypeScript for `quiz` and `tools/*` |
| `bun test quiz/tests/unit tools` | unit tests |
| `bun run quiz:validate [area] [--strict]` | validate quiz content |
| `bun run quiz:blind <area>` and `bun run quiz:compare <area> <answers>` | blind review of an area |
| `./quiz/setup-unix-quiz.sh [test]` | serve the quiz on localhost, or run its unit and end-to-end tests in Docker |
| `bun run bench -- --project <name>` | run the benchmark of a mini-project in Docker |
| `bun run new:project <area> <name> --langs ts,go` | create a mini-project from the template |
| `bun run dashboard:css <dashboard folder>` | rebuild the committed `tailwind.css` of a static dashboard |
| `bun run docs:index [--check]` | regenerate the status pages `docs/en/README.md`, `docs/pt/README.md` and `docs/es/README.md` |
| `gh workflow run CI` | run CI by hand, testing every mini-project |

## Rules

The detailed rules live in `.claude/rules/`. Read the ones that match the task before editing:

- `security-labs.md`: scope of every vulnerability lab. Non-negotiable.
- `load-tests.md`: k6 and similar tools target local services only.
- `mini-project.md`: what every mini-project must contain.
- `code-style.md`: indentation, trilingual didactic comments (EN, PT, ES), linters and formatters.
- `git-workflow.md`: Conventional Commits, SemVer, changelog and releases.
- `quiz.md`: format, content rules and quality checks of the quiz, the main product of the repository.
- `external-skills.md`: how the third-party skills in `.claude/skills/` may be used.

## Hard constraints

- Security content is defensive and educational. Labs run only locally, in Docker, with no external network access. Every vulnerable example ships with its fixed version and an automated test proving the fix. No payloads aimed at real systems, no evasion techniques, no attack tooling reusable outside the lab.
- Load and performance tests never target third-party URLs.
- `.claude/skills/` holds Markdown only. Never add scripts, hooks or installers from the source repositories of those skills.
- Hooks are disabled for this project (`disableAllHooks` in `.claude/settings.local.json`). Do not re-enable them.
