# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Talk to the owner in Brazilian Portuguese. Code, identifiers and commit messages are in English. Didactic code comments are bilingual (see `.claude/rules/code-style.md`).
- Update `.claude/agents.md` and `.claude/rules/` whenever a recurring rule or decision appears, so the next session starts with it.
- The third-party repositories under `.claude/skills/` are nested, so Claude Code does not auto-load them as project skills. Read a skill file explicitly when it is useful.
