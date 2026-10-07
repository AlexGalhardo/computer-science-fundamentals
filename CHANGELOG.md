# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-10-07

### Added

- `PLAN.md` completed: coverage maps for the 31 quiz areas (3,220 questions), 78 mini-projects detailed with acceptance criteria, and the order of execution in 16 breadth-first waves.
- Quiz requirements: i18n (PT and EN), light and dark theme toggle and mobile-friendly layout, with Next.js SSG and Tailwind CSS v4.
- Theory and practice rule: theory-only areas get a larger quiz and no mini-project, technical areas get runnable examples plus the quiz.

### Changed

- Electronics and Software engineering are quiz only; their mini-projects left the catalog.

## [0.4.0] - 2026-10-07

### Added

- `PLAN.md`, stage 1: outline of the 31 areas, foundation, quiz app, the first wave of quiz content with coverage maps and the first wave of mini-projects, with acceptance criteria.

## [0.3.0] - 2026-10-07

### Added

- Quiz design in `docs/en/quiz.md` and `docs/pt/quiz.md`: the quiz becomes the main product of the repository.
- Brainstorming record in `docs/en/brainstorming.md` and `docs/pt/brainstorming.md`, with the chosen and the discarded options.
- Four new areas (electronics, software architecture, database theory, software engineering) and the ideas taken from the book summaries, in the mini-project catalog.
- Summaries of two more books in `references/summaries/books/`.
- `.claude/rules/quiz.md`.

## [0.2.0] - 2026-10-07

### Added

- `references/`: study material imported from the previous repository (algorithms, university coursework, course exercises and notes), with a bilingual `references/README.md` mapping origin to destination and listing what was left out.
- `references/projects/`: the legacy `learning-load-stress-tests` and `learning-message-queue-and-pub-sub` projects, kept as raw material for future mini-projects.
- Phase 2 decisions and the mini-project catalog, in `docs/en/` and `docs/pt/` (`decisions.md`, `mini-project-catalog.md`).
- `references/summaries/`: Markdown summaries of the 252 books, articles and lecture PDFs of the previous repository. The PDFs themselves are not included.
- Third-party skill repositories pinned as shallow git submodules under `.claude/skills/`: `andrej-karpathy-skills`, `graphify`, `agent-skills`, `superpowers` and `ponytail`.

## [0.1.0] - 2026-10-07

### Added

- Repository bootstrap with a fresh git history on `main`.
- Root files: `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `PLAN.md`, `.editorconfig` and `.gitignore`.
- Bilingual documentation skeleton under `docs/pt/` and `docs/en/`.
- Agent onboarding: `CLAUDE.md`, `AGENTS.md`, `.claude/agents.md` and `.claude/rules/`.
- `.gitattributes` enforcing LF line endings, CRLF only for Windows scripts.

[Unreleased]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AlexGalhardo/Software-Engineer-Fundamentals/releases/tag/v0.1.0
