# Git workflow

- Conventional Commits, in English: `feat(sorting): add merge sort benchmark`.
- SemVer tags (`vMAJOR.MINOR.PATCH`) and Keep a Changelog in `CHANGELOG.md`.
- The owner authorised commit, push and a release (`gh release create`, tag plus changelog entry) for each relevant commit. A release without a matching `CHANGELOG.md` entry is not allowed.
- Before 1.0.0: a new mini-project or area is a minor bump, fixes and documentation are patch bumps.
- Phase 4 uses up to 5 git worktrees under `.claude/worktrees/`, one mini-project each, merged back into `main`.
- Never commit secrets, `.env` files, Terraform state, or `.claude/settings.local.json`.
- Update `AGENTS.md`, `.claude/agents.md` and the relevant file in `.claude/rules/` when a change affects how the project is understood or operated.
