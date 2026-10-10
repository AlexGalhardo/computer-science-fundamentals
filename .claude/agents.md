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

## State after the session of 2026-10-10

Everything in `PLAN.md` is ticked: 32 quiz areas (3,384 questions), 86 mini-projects, three languages. The handoff of 2026-10-08 (branch `wip/spanish-ci-se-quiz`) was finished on `main`.

What was added in this session, and how to keep it true:

- **Spanish is the third language** (English first, then Portuguese, then Spanish). `bun .claude/scripts/check-es.ts <paths>` reports any `README.pt-BR.md` without `README.es.md`, any `docs/pt` page without `docs/es`, any `PT:` comment block without an `ES:` block and any language line without the Spanish link. Run it after touching documentation or comments. Translating a quiz topic: write `{ "<id>": { ...es block } }` and merge with `bun .claude/scripts/merge-es.ts <topic.json> <translations.json>`.
- **Spanish comments and linters.** Go `misspell` reads Spanish words as English typos: add them to `ignore-rules` in the module's `.golangci.yml`. `clang-format`, `ruff` (100 columns), `gofmt` and google-java-format reflow or reject long comment lines, so wrap an `ES:` block like its `PT:` block and run the formatter of the language (the `formatters` job of CI runs them over the whole repository).
- **Theory summary** of every quiz area in `quiz/content/<area>/theory/{en,pt,es}.json`, shown under the start form of the area page. Format, block types and inline marks are in `docs/en/quiz-authoring.md`. The three languages must share one skeleton, and `bun run quiz:validate --strict` fails when a summary is missing. Table headers cannot be empty, and `*italic*` is not a mark (use `**bold**`). When questions of an area change, reread the matching section of its summary.
- **Quiz UI**: Base UI (`@base-ui/react`, pinned) for interactive components, Tailwind CSS v4 and the tokens of `globals.css` for style. The dark theme is black and white on purpose. The language switch is a toggle group with client-side navigation (it was links before): the owner was told and may ask for links back.
- **markdownlint**: `bun run lint:md` and `bun run format:md`, rules in `.markdownlint-cli2.jsonc`, enforced by CI. Fenced code blocks need a language (`text` for output and diagrams). Generated `results/` folders are ignored.
- **CI** tests every mini-project on every run (about 15 minutes, 94 jobs). `projects/continuous-integration/ci-pipeline` is the lesson about the workflow, and its `workflow-sync` test fails when `ci.yml` gains a named step that the lesson does not demonstrate: a new gate needs a `demo/<gate>/` folder, the runner case and the READMEs.
- **Vercel**: project `computer-science-fundamentals-quiz`, team `galhardos-projects`, production at <https://cs-fundamentals-quiz.vercel.app>. Deploy by hand as a prebuilt static output: build `quiz/`, copy `quiz/out` to `<dir>/.vercel/output/static`, write `<dir>/.vercel/output/config.json` = `{"version":3,"trailingSlash":true}`, then `bunx vercel@63.1.0 link --yes --project computer-science-fundamentals-quiz --scope galhardos-projects` and `bunx vercel@63.1.0 deploy --prebuilt --prod --yes --scope galhardos-projects`. Still to do: connect the GitHub repository (root directory `quiz`, `quiz/vercel.json`) so a push to `main` deploys by itself.
- **Lessons from the CI runs of this session.** A check that counts profiler samples depends on the machine: `flame-graph` now profiles for 15 seconds in its setup script. Bun closes a connection silent for 10 seconds, so a long request needs `idleTimeout`. A watcher that reads a Prometheus ratio must treat `NaN` (0 / 0, no traffic yet) as a missing sample (`slo-alert`).

## Open items

- **One test is flaky on a loaded CI runner** (seen once in the 16 CI runs of 2026-10-10). `projects/observability/three-signals`: the end-to-end test timed out after 300 seconds waiting for the slow trace in the Tempo search. Not investigated. The other flaky test of that day, the Go test of `counter-race`, was settled by the owner: the criterion is now lost updates in at least 24 of 30 runs, in the four languages (a data race only loses updates while the workers really run in parallel; replacing the channel gate by a polled flag was measured and made no difference).
- Transactions quiz: the correct alternative is the longest in about half of the questions (see "Known quality debts").
- The blind reviews of this session ran in English. Portuguese and Spanish texts of the new continuous integration and software engineering questions were not read by an independent reviewer.
- The theory summaries were written by one agent per area and validated by the schema, with every link checked, but no independent reader reviewed them for teaching quality.
- `.git/filter-repo/` and `git gc` after the history rewrite of 2026-10-08 are still pending (the old worktree and its branch were removed on 2026-10-10).
