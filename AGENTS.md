# AGENTS.md

Onboarding for AI coding agents working in this repository. `CLAUDE.md` imports this file, so keep the two in sync by editing only this one.

## What this repository is

An educational, open source (MIT) long-term reference for studying computer science fundamentals through small runnable mini-projects, with demos, benchmarks and bilingual documentation (PT/EN).

Languages: C++, Python, Java, Elixir, Rust, Go, TypeScript.

## Current state

The project is built in phases and the agent **stops at the end of each phase** for the owner's review. The live status is the checklist at the top of `PLAN.md`.

- Phase 0: repository setup
- Phase 1: import of previous content into `references/` and external skills into `.claude/skills/`
- Phase 2: brainstorming, decisions documented in `docs/pt/` and `docs/en/`
- Phase 3: full `PLAN.md`
- Phase 4: parallel development, up to 5 git worktrees, one mini-project each

## Layout

| Path | Purpose |
| --- | --- |
| `docs/en/`, `docs/pt/` | Documentation per area and sub-area. Both languages are mandatory and must stay equivalent |
| `references/` | Study material imported from the previous repository. Read-only source of ideas, not a mini-project |
| `PLAN.md` | Main roadmap with checklists and verifiable acceptance criteria |
| `CHANGELOG.md` | Keep a Changelog + SemVer |
| `.claude/rules/` | Recurring rules, one topic per file |
| `.claude/agents.md` | Session-to-session notes for agents |
| `.claude/skills/` | Third-party skill repositories, pinned as git submodules |

## Rules

The detailed rules live in `.claude/rules/`. Read the ones that match the task before editing:

- `security-labs.md`: scope of every vulnerability lab. Non-negotiable.
- `load-tests.md`: k6 and similar tools target local services only.
- `mini-project.md`: what every mini-project must contain.
- `code-style.md`: indentation, bilingual didactic comments, linters and formatters.
- `git-workflow.md`: Conventional Commits, SemVer, changelog and releases.
- `external-skills.md`: how the third-party skills in `.claude/skills/` may be used.

## Hard constraints

- Security content is defensive and educational. Labs run only locally, in Docker, with no external network access. Every vulnerable example ships with its fixed version and an automated test proving the fix. No payloads aimed at real systems, no evasion techniques, no attack tooling reusable outside the lab.
- Load and performance tests never target third-party URLs.
- Never run scripts from `.claude/skills/` without the owner's explicit approval.
- Hooks are disabled for this project (`disableAllHooks` in `.claude/settings.local.json`). Do not re-enable them.
