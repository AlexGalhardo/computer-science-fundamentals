# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Talk to the owner in Brazilian Portuguese. Code, identifiers and commit messages are in English. Didactic code comments are trilingual: English, Portuguese and Spanish (see `.claude/rules/code-style.md`).
- Update `.claude/agents.md` and `.claude/rules/` whenever a recurring rule or decision appears, so the next session starts with it.
- The third-party skills in `.claude/skills/<skill>/SKILL.md` are loaded by Claude Code as project skills. Their sources and licences are in `.claude/skills/SOURCES.md`, and the rules of this repository win over them (`.claude/rules/external-skills.md`).
