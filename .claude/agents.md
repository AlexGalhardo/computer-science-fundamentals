# Agent notes

Notes that carry over between sessions. Rules live in `.claude/rules/`. This file records state and decisions.

## Decisions

- **Remote**: since 2026-10-08 `origin` is `https://github.com/AlexGalhardo/computer-science-fundamentals.git` (the owner's git config rewrites it to SSH). The project moved there from `AlexGalhardo/Software-Engineer-Fundamentals` with a forced push of `main`; the previous history of that repository is kept in its branch `legacy-before-2026-10`. Releases v0.1.0 to v0.80.0 were recreated there. `.claude/scripts/release.py` creates releases on `origin`.
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
- **Open questions for the owner**: ask them in the final message of the session, each with the provisional decision taken, and keep working. There is no questions file any more (the owner had it removed on 2026-10-08).

## Never import from the previous repository

The previous repository (`AlexGalhardo/Software-Engineering`) contains files that must not be copied here: copyrighted books and course PDFs (only their summaries), Terraform state and `*.tfvars`, an SSH key pair under the Terraform course, lockfiles, and a DDoS script that is outside the defensive scope of this project.

## Phase log

- Phase 0, Phase 1 and Phase 2 done on 2026-10-07. Decisions are in `docs/en/decisions.md` and `docs/pt/decisions.md`, the quiz design in `quiz.md`, the backlog in `mini-project-catalog.md` and the full question-by-question record in `brainstorming.md`. The quiz became the main product in the second brainstorming round. Phase 3 finished on 2026-10-07: `PLAN.md` covers the 31 areas, with 3,220 quiz questions and 78 mini-projects in 16 waves. Next: Phase 4, starting with Part F (foundation) and Part QZ (quiz app), after the owner's confirmation.
- Phase 4 started on 2026-10-07. Done and released: foundation F-1 to F-3 (v0.6.0), the quiz app, Part QZ (v0.7.0), and the wave 1 quiz areas with blind review: data structures (v0.8.0), Big O (v0.9.0), databases (v0.10.0), networks (v0.11.0), operating systems (v0.12.0). F-4 (CI) is written but unverified: GitHub Actions does not start jobs on the owner's account.
- **Blind review lesson**: a statement must never depend on `example`, which is shown only after the answer. Material needed to answer goes in `snippet`. The first review round caught 23 such questions.
- **Playwright**: package and Docker image must have the same version. 1.64.0 has no image yet, so both are pinned to 1.63.0, with a root `overrides` entry for `playwright-core`.
- **Concurrency limit**: the harness runs at most 20 sub-agents at once, counting the reviewers that worktree agents spawn.
- **Integration routine of the main session**: merge the worktree branch, run `bun run quiz:validate --strict` and `bunx biome check .`, rerun the setup script of each merged mini-project, then `python .claude/scripts/release.py items.json`. That helper ticks the `PLAN.md` sections, adds one `CHANGELOG.md` entry and one tag and GitHub release per project, regenerates the docs index, commits and pushes. `items.json` is a list of `{ "tick": ["MP-OS-1"], "name": "...", "text": "..." }` (or `"tickLines"` for single checklist lines).
- **CI works** since the repository became public on 2026-10-07. It tests each mini-project whose folder changed; `gh workflow run CI` tests all of them.

- **Dashboards from disk**: `tools/scaffold/tests/open-from-disk.mjs` opens pages over `file://` inside the Playwright image with `--network none` and fails on any error, network request or missing chart. CI runs it for every committed dashboard (job `quiz`).

## Known quality debts

- Transactions quiz: the correct alternative is the longest in about half of the questions. Rebalance the alternatives without changing the keys, then rerun the blind review.
- For merged mini-projects the main session reran only the setup script (build and tests). Benchmark tables and demos are recorded as reported by the worktree.
- **`references/` and `questions-to-dev.md` removed** (owner, 2026-10-08): both were deleted from the tree and purged from the git history with `git filter-repo`, then `main` and every tag were force-pushed. Commit hashes before that date changed. Do not recreate either. The quiz areas not written yet (continuous integration, software engineering) take their topics from the tables in `PLAN.md` and from `REFERENCES.md`.
- **Study references**: `REFERENCES.md` and `REFERENCES.pt-BR.md` at the root (738 references, 671 distinct links, all verified when written on 2026-10-08), and `projects/<area>/README.md` with `README.pt-BR.md` for each of the 30 areas with mini-projects. When an area changes, update its README and the matching section of both root files.

## Next session (stopping point of 2026-10-08)

- **Observability is merged but not ticked or released.** `three-signals`, `structured-logs` and `flame-graph` passed their setup on `main`. `slo-alert` is still intermittent: after the fix that puts the 11 rules in one group (`fix(observability): evaluate slo-alert rules in one group`), `sh ./setup-unix-slo-alert.sh test` failed 1 of 3 runs on `main` (run 2, exit 1). The failing step was not captured, because the owner cancelled the rerun. First task: run it in a loop keeping the full log, find which step fails (unit, `rules-test` or e2e), fix the root cause, then tick QC-OBS and MP-OBS-1 to 4 in `PLAN.md` and release with `.claude/scripts/release.py` (next version v0.120.0).
- Remove the worktree `.claude/worktrees/agent-a09aed652a2adcb35` and its branch (pre-rewrite history: cherry-pick from it, never merge), then `git gc` and delete `.git/filter-repo/`.
- Not started, by the owner's decision: continuous integration (QC-CI, MP-CI-1) and software engineering (QC-SE, 150 questions).

## Handoff of 2026-10-08 (branch `wip/spanish-ci-se-quiz`, saved because the session limit ended)

Owner's tasks for this branch: (1) finish the quizzes of continuous integration (quiz only, the mini-project MP-CI-1 is left for another session) and software engineering; (2) add Spanish as a third language everywhere Portuguese exists, English stays the main language; (3) CI tests every mini-project; (4) deploy the quiz to Vercel; (5) "Source Code" GitHub link in the quiz header.

Done on this branch:

- Quiz infra for Spanish: `LANGUAGES = ["en", "pt", "es"]`, the schema REQUIRES an `es` block in every question and `name.es` in areas and coverage; `quiz/src/i18n/es.ts`; header switch, root redirect (`es*` browsers go to `/es/`), `<html lang>`; `docs:index` writes `docs/es/README.md` too (run it once docs/es exists); unit and e2e tests updated (e2e not run yet).
- `quiz/content/areas.json` has Spanish names. Coverage maps written for `continuous-integration` and `software-engineering` (trilingual).
- `.claude/rules/code-style.md`: comments are trilingual (EN, PT, ES).
- CI (`.github/workflows/ci.yml`): job `list-projects` lists all 85 mini-projects, every run tests all of them.
- Quiz header: "Source Code" link with the GitHub icon, left of the language switch (label translated per language, icon only below `sm`).
- `quiz/vercel.json`: static build for Vercel (root directory `quiz`, install at the repo root with bun, output `out/`).
- Merge helper for translations: `bun merge-es.ts <topic.json> <translations.json>` (copied to `.claude/scripts/merge-es.ts`).

State when the session stopped (sub-agents were still writing; check every area with `bun run quiz:validate <area> --strict`):

- Quiz Spanish translation by area groups: algorithms, data-structures, databases, networks DONE (400 questions, 0 errors). Others (electronics, artificial-intelligence, big-o, operating-systems, concurrency, parallelism, transactions, security, compilers, state-machines, information-theory, digital-logic, oop, functional-programming, design-patterns, software-architecture, testing, protocols, messaging, load-balancing, performance, cache, rate-limiting, file-systems, observability, blockchain) were in progress: some topic files may already have `es`, the rest do not.
- New quizzes: continuous-integration (100), software-engineering part A (process-models, requirements-engineering, uml-modelling, architectural-design, design-implementation-clean-code, testing-evolution-maintenance) and part B (project-management-estimation, brooks, quality-configuration-management, dependability-safety, agile-lean-startup, simplicity-technical-debt) were being written, trilingual. Then: blind review (`quiz:blind`, independent reviewer, `quiz:compare`, resolve `review.md`).
- NOT STARTED (were queued, limit of 20 sub-agents): README.es.md for every README with a pt-BR sibling, `docs/es/<area>/` pages and top-level guides, `ES:` comment blocks after every `PT:` block in projects/, benchmarks/, docker/, tools/, quiz/; three-way language lines (`> Versão em português: [...] · Versión en español: [...]`); README-es.md and REFERENCES.es.md at the root; links `### [Leia em Português Brasil](./README-ptbr.md)` and `### [Lea en Español](./README-es.md)` in README.md; scaffold template creating README.es.md; AGENTS.md and rules mentioning three languages.
- Vercel: project `computer-science-fundamentals-quiz` in team `galhardos-projects` (scope flag `--scope galhardos-projects`), production URL <https://computer-science-fundamentals-quiz.vercel.app>. The first deploy (2026-10-08) is the quiz of `main` before this branch (English and Portuguese, no Source Code link), uploaded as a prebuilt static output: build `quiz/` locally, copy `quiz/out` to `<dir>/.vercel/output/static`, write `<dir>/.vercel/output/config.json` = `{"version":3,"trailingSlash":true}`, then `npx vercel@63.1.0 link --yes --project computer-science-fundamentals-quiz --scope galhardos-projects` and `npx vercel@63.1.0 deploy --prebuilt --prod --yes --scope galhardos-projects`. A plain `vercel deploy` of the folder ran `npm run build` remotely and failed. Still to do: set the project Root Directory to `quiz` and connect the GitHub repository (`vercel git connect`) so `quiz/vercel.json` builds every push to `main`, or add a CI job with a `VERCEL_TOKEN` secret that runs the prebuilt deploy. Redeploy once all areas have Spanish (the build refuses content without `es`).
- After everything: `bun run quiz:validate --strict`, `bunx biome check .`, `bun run typecheck`, unit tests, `./quiz/setup-unix-quiz.sh test`, `bun run docs:index`, then commits per item and releases with `.claude/scripts/release.py` (QC-CI, QC-SE, Spanish support, CI change). Observability release v0.120.0 is still pending from the previous session.
