# Agent notes

Notes that carry over between sessions. Rules live in `.claude/rules/`. This file records state and decisions.

## Decisions

- **Remote**: `origin` uses SSH (`git@github.com:AlexGalhardo/Software-Engineer-Fundamentals.git`) because `gh` is configured for the SSH protocol on the owner's machine.
- **Line endings**: `.gitattributes` forces LF in the repository, CRLF only for `*.ps1`.
- **Imported content**: lives in `references/`, lowercase kebab-case paths. See `references/README.md` for the mapping and for what was deliberately left out.
- **Third-party skills**: tracked as shallow git submodules pinned to a commit, not vendored. This keeps their licences and history separate from this MIT repository. After cloning run `git submodule update --init --depth 1`.
- **Hooks**: disabled through `.claude/settings.local.json`, which is git-ignored. Recreate it on a fresh clone:

  ```json
  { "disableAllHooks": true }
  ```

## Never import from the previous repository

The previous repository (`AlexGalhardo/Software-Engineering`) contains files that must not be copied here: copyrighted books and course PDFs, Terraform state and `*.tfvars`, an SSH key pair under the Terraform course, lockfiles, and a DDoS script that is outside the defensive scope of this project.

## Phase log

- Phase 0 and Phase 1 done on 2026-10-07. Next: Phase 2 (brainstorming), after the owner's confirmation.
