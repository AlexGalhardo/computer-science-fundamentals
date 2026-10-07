# Contributing · Como contribuir

> [English](#english) · [Português](#português)

## English

Thank you for helping. This repository is educational, so clarity for beginners matters more than cleverness.

### Ground rules

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) in English (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `perf:`).
- **Versioning:** [SemVer](https://semver.org/). Every relevant change gets an entry in `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/).
- **Indentation:** tabs, width 4 (see `.editorconfig`). Languages whose standard formatter enforces spaces follow the formatter.
- **Lint and format:** Biome v2 for JS/TS; ruff for Python; rustfmt and clippy for Rust; gofmt and golangci-lint for Go; clang-format for C++; `mix format` for Elixir; spotless with google-java-format for Java.
- **Dependencies:** pin exact stable versions. No `latest`, `next`, `rc`, `beta` or `alpha`. Docker images use fixed version tags.
- **JS/TS package manager:** Bun.

### Mini-project checklist

A mini-project is complete when it has:

- [ ] A bilingual README (EN + PT) explaining what it teaches
- [ ] A benchmark or demo, through a CLI or a simple web dashboard
- [ ] `setup-unix-<project>.sh` and `setup-windows-<project>.ps1`
- [ ] Didactic comments in Portuguese and English
- [ ] Automated tests that pass locally
- [ ] Documentation under `docs/en/` and `docs/pt/`
- [ ] A `CHANGELOG.md` entry

### Security labs

Read [SECURITY.md](SECURITY.md) before touching anything under the security area. A vulnerable example is only accepted together with its fixed version and an automated test that proves the fix.

### Load tests

k6 scripts and similar tools may only target `localhost` or services declared in a `docker-compose` file in this repository.

---

## Português

Obrigado por ajudar. Este repositório é educacional, então clareza para iniciantes vale mais que esperteza.

### Regras básicas

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) em inglês (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `perf:`).
- **Versionamento:** [SemVer](https://semver.org/). Toda mudança relevante ganha uma entrada no `CHANGELOG.md` seguindo o [Keep a Changelog](https://keepachangelog.com/).
- **Indentação:** tabs, largura 4 (veja `.editorconfig`). Linguagens cujo formatter padrão impõe espaços seguem o formatter.
- **Lint e format:** Biome v2 para JS/TS; ruff para Python; rustfmt e clippy para Rust; gofmt e golangci-lint para Go; clang-format para C++; `mix format` para Elixir; spotless com google-java-format para Java.
- **Dependências:** fixe versões estáveis exatas. Nada de `latest`, `next`, `rc`, `beta` ou `alpha`. Imagens Docker usam tags de versão fixas.
- **Gerenciador de pacotes JS/TS:** Bun.

### Checklist de miniprojeto

Um miniprojeto está completo quando tem:

- [ ] README bilíngue (EN + PT) explicando o que ele ensina
- [ ] Benchmark ou demo, via CLI ou dashboard web simples
- [ ] `setup-unix-<projeto>.sh` e `setup-windows-<projeto>.ps1`
- [ ] Comentários didáticos em português e inglês
- [ ] Testes automatizados passando localmente
- [ ] Documentação em `docs/pt/` e `docs/en/`
- [ ] Entrada no `CHANGELOG.md`

### Labs de segurança

Leia o [SECURITY.md](SECURITY.md) antes de mexer em qualquer coisa da área de segurança. Um exemplo vulnerável só é aceito junto com a versão corrigida e um teste automatizado que prova a correção.

### Testes de carga

Scripts de k6 e ferramentas similares só podem ter como alvo `localhost` ou serviços declarados em um `docker-compose` deste repositório.

## Unit of work

One branch (or worktree) takes one area and completes it: the quiz of the area, its practical mini-projects and the tests proving that everything works. Each complete project (a quiz area, a mini-project) is its own commit and gets its own GitHub release with a matching `CHANGELOG.md` entry.
