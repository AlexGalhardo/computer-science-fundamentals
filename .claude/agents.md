# Agent notes

Notes that carry over between sessions. Rules live in `.claude/rules/`. This file records state and decisions.

## Decisions

- **Remote**: `origin` uses SSH (`git@github.com:AlexGalhardo/Software-Engineer-Fundamentals.git`) because `gh` is configured for the SSH protocol on the owner's machine.
- **Line endings**: `.gitattributes` forces LF in the repository, CRLF only for `*.ps1`.
- **Imported content**: lives in `references/`, lowercase kebab-case paths. See `references/README.md` for the mapping and for what was deliberately left out.
- **Legacy projects**: `references/projects/load-stress-tests` and `references/projects/message-queues-pubsub` are the owner's older projects, kept as they were. They do not follow the rules of this repository yet (Prettier and Husky instead of Biome, open `^` version ranges, k6 scripts for the serverless API pointing at an AWS API Gateway placeholder). Their `*-ddos-attack.mjs` load generators were not imported. Treat them as raw material to be rebuilt as proper mini-projects, with local-only targets.
- **Images**: `references/images/` is git-ignored (third-party infographics). Never add it to a commit.
- **PDF summaries**: `references/summaries/` holds Markdown summaries, in Portuguese, of the 252 PDFs of the previous repository. The PDFs themselves are never committed.
- **Third-party skills**: tracked as shallow git submodules pinned to a commit, not vendored. This keeps their licences and history separate from this MIT repository. After cloning run `git submodule update --init --depth 1`.
- **Hooks**: disabled through `.claude/settings.local.json`, which is git-ignored. Recreate it on a fresh clone:

  ```json
  { "disableAllHooks": true }
  ```

## Never import from the previous repository

The previous repository (`AlexGalhardo/Software-Engineering`) contains files that must not be copied here: copyrighted books and course PDFs (only their summaries), Terraform state and `*.tfvars`, an SSH key pair under the Terraform course, lockfiles, and a DDoS script that is outside the defensive scope of this project.

## Phase log

- Phase 0, Phase 1 and Phase 2 done on 2026-10-07. Decisions are in `docs/en/decisions.md` and `docs/pt/decisions.md`, the backlog in `mini-project-catalog.md`. Next: Phase 3 (`PLAN.md`), after the owner's confirmation.
