# Agent notes

Notes that carry over between sessions. Rules live in `.claude/rules/`. This file records state and decisions.

## Decisions

- **Remote**: `origin` uses SSH (`git@github.com:AlexGalhardo/Software-Engineer-Fundamentals.git`) because `gh` is configured for the SSH protocol on the owner's machine.
- **Line endings**: `.gitattributes` forces LF in the repository, CRLF only for `*.ps1`.
- **Imported content**: lives in `references/`, lowercase kebab-case paths. See `references/README.md` for the mapping and for what was deliberately left out.
- **Legacy projects**: `references/projects/load-stress-tests` and `references/projects/message-queues-pubsub` are the owner's older projects, kept as they were. They do not follow the rules of this repository yet (Prettier and Husky instead of Biome, open `^` version ranges, k6 scripts for the serverless API pointing at an AWS API Gateway placeholder). Their `*-ddos-attack.mjs` load generators were not imported. Treat them as raw material to be rebuilt as proper mini-projects, with local-only targets.
- **Images**: `references/images/` is git-ignored (third-party infographics). Never add it to a commit.
- **PDF summaries**: `references/summaries/` holds Markdown summaries, in Portuguese, of the 252 PDFs of the previous repository and of 2 books added later. The PDFs themselves are never committed.
- **Third-party skills**: since 2026-10-08 they are plain Markdown copies in `.claude/skills/<skill>/` (47 skills, with licences), no longer git submodules, so Claude Code loads them as project skills. Origins and commits are in `.claude/skills/SOURCES.md`. The owner asked for this layout, following his `agent-money-boilerplate` repository.
- **Hooks**: disabled through `.claude/settings.local.json`, which is git-ignored. Recreate it on a fresh clone:

  ```json
  { "disableAllHooks": true }
  ```

- **Parallelism**: the main session plus up to 10 worktrees when needed (owner, 2026-10-07).
- **Shell gotcha on the owner's Windows machine**: a Bash heredoc that contains an apostrophe fails to parse in the agent shell. Write such files with the file-writing tool instead.
- **Phase 4 work unit** (owner, 2026-10-07): each worktree does one task completely, meaning one area with its quiz, its practical mini-projects and the tests that prove it works. Each complete project (a quiz area, a mini-project) gets its own commit and its own GitHub release. The main session merges, updates `CHANGELOG.md` and `PLAN.md`, tags and releases, so worktrees never touch those files.
- **Schema validation**: Zod is the default (owner, 2026-10-07). See `.claude/rules/code-style.md`.
- **Open questions for the owner** go to `questions-to-dev.md` at the repository root, each with the provisional decision taken, so work never stops waiting for an answer.

## Never import from the previous repository

The previous repository (`AlexGalhardo/Software-Engineering`) contains files that must not be copied here: copyrighted books and course PDFs (only their summaries), Terraform state and `*.tfvars`, an SSH key pair under the Terraform course, lockfiles, and a DDoS script that is outside the defensive scope of this project.

## Phase log

- Phase 0, Phase 1 and Phase 2 done on 2026-10-07. Decisions are in `docs/en/decisions.md` and `docs/pt/decisions.md`, the quiz design in `quiz.md`, the backlog in `mini-project-catalog.md` and the full question-by-question record in `brainstorming.md`. The quiz became the main product in the second brainstorming round. Phase 3 finished on 2026-10-07: `PLAN.md` covers the 31 areas, with 3,220 quiz questions and 78 mini-projects in 16 waves. Next: Phase 4, starting with Part F (foundation) and Part QZ (quiz app), after the owner's confirmation.
- Phase 4 started on 2026-10-07. Done and released: foundation F-1 to F-3 (v0.6.0), the quiz app, Part QZ (v0.7.0), and the wave 1 quiz areas with blind review: data structures (v0.8.0), Big O (v0.9.0), databases (v0.10.0), networks (v0.11.0), operating systems (v0.12.0). F-4 (CI) is written but unverified: GitHub Actions does not start jobs on the owner's account (billing), see `questions-to-dev.md`.
- **Blind review lesson**: a statement must never depend on `example`, which is shown only after the answer. Material needed to answer goes in `snippet`. The first review round caught 23 such questions.
- **Playwright**: package and Docker image must have the same version. 1.64.0 has no image yet, so both are pinned to 1.63.0, with a root `overrides` entry for `playwright-core`.
- **Concurrency limit**: the harness runs at most 20 sub-agents at once, counting the reviewers that worktree agents spawn.
- **Integration routine of the main session**: merge the worktree branch, run `bun run quiz:validate --strict` and `bunx biome check .`, rerun the setup script of each merged mini-project, then `python .claude/scripts/release.py items.json`. That helper ticks the `PLAN.md` sections, adds one `CHANGELOG.md` entry and one tag and GitHub release per project, regenerates the docs index, commits and pushes. `items.json` is a list of `{ "tick": ["MP-OS-1"], "name": "...", "text": "..." }` (or `"tickLines"` for single checklist lines).
- **CI works** since the repository became public on 2026-10-07. It tests each mini-project whose folder changed; `gh workflow run CI` tests all of them.

- **Dashboards from disk**: `tools/scaffold/tests/open-from-disk.mjs` opens pages over `file://` inside the Playwright image with `--network none` and fails on any error, network request or missing chart. CI runs it for every committed dashboard (job `quiz`).

## Known quality debts

- Transactions quiz: the correct alternative is the longest in about half of the questions. Rebalance the alternatives without changing the keys, then rerun the blind review.
- For merged mini-projects the main session reran only the setup script (build and tests). Benchmark tables and demos are recorded as reported by the worktree.

