# Software Engineer Fundamentals

> [English](#english) · [Português](#português)

## English

An educational, open source (MIT) long-term reference for studying **computer science fundamentals**. It has two parts that point at each other:

- **A quiz** covering 31 areas, in Portuguese and English. Each question has 5 alternatives, and after the answer the explanation appears next to it: the concept, why each alternative is right or wrong, and a link to the mini-project that shows the concept running.
- **Runnable mini-projects** for 29 of those areas, each with tests, a demo or benchmark, and bilingual documentation. Everything runs in Docker.

Live status of every area (questions written, blind review, mini-projects done): [docs/en/README.md](docs/en/README.md). Roadmap with acceptance criteria: [PLAN.md](PLAN.md).

### Run the quiz

The only requirement is Docker.

```sh
./quiz/setup-unix-quiz.sh        # Linux and macOS
./quiz/setup-windows-quiz.ps1    # Windows
```

Then open <http://localhost:3000>. More in [quiz/README.md](quiz/README.md).

### Run a mini-project

Each one lives in `projects/<area>/<name>/` and brings its own setup scripts, which build pinned images and run the tests:

```sh
./projects/big-o/big-o-lab/setup-unix-big-o-lab.sh
```

Its README says what it teaches, how to run the demo, and which quiz topics it demonstrates.

### Languages

C++, Python, Java, Elixir, Rust, Go and TypeScript. TypeScript is the reference, and other languages are added where the lesson changes.

### Repository layout

| Path | Purpose |
| --- | --- |
| `quiz/` | The quiz app (Next.js static site, Tailwind CSS v4) and its questions |
| `projects/` | Mini-projects, by area |
| `benchmarks/` | Cross-language benchmark workloads and their dashboard (in progress) |
| `docs/en/`, `docs/pt/` | Documentation per area, in both languages |
| `tools/` | Benchmark runner and mini-project generator |
| `docker/` | Pinned base image per language |
| `references/` | Study material and summaries the content is based on |
| `PLAN.md` | Roadmap with checklists and acceptance criteria |
| `CHANGELOG.md` | Release history (Keep a Changelog + SemVer) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Rules and notes for AI coding agents |

### Development

Needs [Bun](https://bun.sh) 1.4.2 and Docker.

```sh
bun install
bun run lint && bun run typecheck
bun test quiz/tests/unit tools
bun run quiz:validate
```

The full command list is in [AGENTS.md](AGENTS.md).

### Security labs and load tests

Security labs are **defensive and educational**, in the spirit of OWASP Juice Shop and DVWA. They run only locally, inside Docker, with no external network access, and every vulnerable example comes with its fixed version and a test proving the fix. Load tests target only local services created in this repository. See [SECURITY.md](SECURITY.md).

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

### License

[MIT](LICENSE)

---

## Português

Referência de longo prazo, educacional e open source (MIT), para estudar **fundamentos da computação**. Ela tem duas partes que apontam uma para a outra:

- **Um quiz** que cobre 31 áreas, em português e inglês. Cada questão tem 5 alternativas, e depois da resposta a explicação aparece ao lado: o conceito, por que cada alternativa está certa ou errada, e um link para o mini-projeto que mostra o conceito funcionando.
- **Mini-projetos executáveis** para 29 dessas áreas, cada um com testes, uma demo ou benchmark e documentação bilíngue. Tudo roda em Docker.

Status atual de cada área (questões escritas, revisão cega, mini-projetos prontos): [docs/pt/README.md](docs/pt/README.md). Roteiro com critérios de aceite: [PLAN.md](PLAN.md).

### Como rodar o quiz

O único requisito é o Docker.

```sh
./quiz/setup-unix-quiz.sh        # Linux e macOS
./quiz/setup-windows-quiz.ps1    # Windows
```

Depois abra <http://localhost:3000>. Mais detalhes em [quiz/README.pt-BR.md](quiz/README.pt-BR.md).

### Como rodar um mini-projeto

Cada um fica em `projects/<area>/<nome>/` e traz os próprios scripts de setup, que constroem imagens fixadas e rodam os testes:

```sh
./projects/big-o/big-o-lab/setup-unix-big-o-lab.sh
```

O README dele diz o que ensina, como rodar a demo e quais tópicos do quiz ele demonstra.

### Linguagens

C++, Python, Java, Elixir, Rust, Go e TypeScript. TypeScript é a referência, e as outras linguagens entram onde a lição muda.

### Estrutura do repositório

| Caminho | Finalidade |
| --- | --- |
| `quiz/` | O app do quiz (site estático em Next.js, Tailwind CSS v4) e as questões |
| `projects/` | Mini-projetos, por área |
| `benchmarks/` | Cargas de benchmark entre linguagens e o dashboard (em andamento) |
| `docs/en/`, `docs/pt/` | Documentação por área, nos dois idiomas |
| `tools/` | Runner de benchmark e gerador de mini-projetos |
| `docker/` | Imagem base fixada por linguagem |
| `references/` | Material de estudo e resumos em que o conteúdo se baseia |
| `PLAN.md` | Roteiro com checklists e critérios de aceite |
| `CHANGELOG.md` | Histórico de releases (Keep a Changelog + SemVer) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Regras e notas para agentes de IA |

### Desenvolvimento

Precisa de [Bun](https://bun.sh) 1.4.2 e Docker.

```sh
bun install
bun run lint && bun run typecheck
bun test quiz/tests/unit tools
bun run quiz:validate
```

A lista completa de comandos está em [AGENTS.md](AGENTS.md).

### Laboratórios de segurança e testes de carga

Os laboratórios de segurança são **defensivos e educacionais**, no espírito do OWASP Juice Shop e do DVWA. Rodam apenas localmente, dentro do Docker, sem acesso à rede externa, e todo exemplo vulnerável vem com a versão corrigida e um teste que prova a correção. Testes de carga miram apenas serviços locais criados neste repositório. Veja [SECURITY.md](SECURITY.md).

### Como contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

### Licença

[MIT](LICENSE)
