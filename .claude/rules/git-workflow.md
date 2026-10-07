# Git workflow

- Conventional Commits, in English: `feat(sorting): add merge sort benchmark`.
- SemVer tags (`vMAJOR.MINOR.PATCH`) and Keep a Changelog in `CHANGELOG.md`.
- The owner authorised commit, push and a release (`gh release create`, tag plus changelog entry) for each relevant commit. A release without a matching `CHANGELOG.md` entry is not allowed.
- Before 1.0.0: a new mini-project or area is a minor bump, fixes and documentation are patch bumps.
- Phase 4 uses the main session plus up to 10 git worktrees (raised from 5 by the owner on 2026-10-07) under `.claude/worktrees/`, merged back into `main`.
- **One worktree, one complete work item** (owner's rule, 2026-10-07). A worktree takes one area and finishes it end to end before it is merged: the quiz of the area (coverage map, questions, validation, blind review), its practical mini-projects, and the tests proving everything works. No worktree hands back a half-done item.
- **Every complete project gets its own commit and its own GitHub release.** A finished quiz area and each finished mini-project are separate commits (`feat(quiz): ...`, `feat(<area>): ...`). After the merge, the main session adds the `CHANGELOG.md` entry, bumps the version, tags it and runs `gh release create`. Worktrees never edit `CHANGELOG.md`, `PLAN.md` or version tags, so parallel branches do not conflict.
- After merging a worktree, the main session reruns the setup script of each merged mini-project on `main` before ticking `PLAN.md`, then runs `bun run docs:index`. A worktree report saying "passed" is not enough.
- CI (`.github/workflows/ci.yml`) runs on every push and pull request, and tests each mini-project whose folder changed. `gh workflow run CI` tests all of them.
- Never commit secrets, `.env` files, Terraform state, or `.claude/settings.local.json`.
- Update `AGENTS.md`, `.claude/agents.md` and the relevant file in `.claude/rules/` when a change affects how the project is understood or operated.
