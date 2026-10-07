# Software Engineer Fundamentals

> [English](#english) · [Português](#português)

## English

An educational, open source (MIT) long-term reference for studying **computer science fundamentals** through small, runnable projects. Every mini-project ships with a demo or benchmark, automated tests and bilingual documentation (EN/PT).

### Study areas

- Compilers
- Sorting algorithms, data structures, Big O
- State machines, information theory
- Concurrency, parallelism, race conditions, deadlocks
- Transactions, load balancing
- OOP, functional programming, design patterns, SOLID
- Messaging and queues (Kafka, BullMQ, RabbitMQ)
- Protocols: JSON-RPC, HTTP/2, HTTP/3, GraphQL
- Web application security (defensive, local-only labs)
- Testing: TDD, unit, integration, e2e, smoke, regression
- Observability and telemetry

### Languages

C++, Python, Java, Elixir, Rust, Go and TypeScript.

### Repository layout

| Path | Purpose |
| --- | --- |
| `docs/en/`, `docs/pt/` | Documentation per area and sub-area |
| `references/` | Study material imported from the previous repository |
| `PLAN.md` | Main roadmap with checklists and acceptance criteria |
| `CHANGELOG.md` | Release history (Keep a Changelog + SemVer) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Rules, onboarding notes and pinned third-party skills for AI coding agents |

### What every mini-project contains

- A bilingual README explaining what it teaches
- A benchmark or demo (CLI or a simple web dashboard)
- Setup scripts: `setup-unix-<project>.sh` and `setup-windows-<project>.ps1`
- Didactic code comments in Portuguese and English, written for beginners

### Security labs and load tests

Security labs are **defensive and educational**, in the spirit of OWASP Juice Shop and DVWA. They run only locally, inside Docker, with no external network access, and every vulnerable example comes with its fixed version and a test proving the fix. Load tests target only local services created in this repository. See [SECURITY.md](SECURITY.md).

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

### License

[MIT](LICENSE)

---

## Português

Referência de longo prazo, educacional e open source (MIT), para estudar **fundamentos da computação** por meio de miniprojetos executáveis. Cada miniprojeto traz uma demo ou benchmark, testes automatizados e documentação bilíngue (PT/EN).

### Áreas de estudo

- Compiladores
- Algoritmos de ordenação, estruturas de dados, Big O
- Máquina de estados, teoria da informação
- Concorrência, paralelismo, race conditions, deadlocks
- Transactions, load balancer
- POO, programação funcional, design patterns, SOLID
- Mensageria e filas (Kafka, BullMQ, RabbitMQ)
- Protocolos: JSON-RPC, HTTP/2, HTTP/3, GraphQL
- Segurança de aplicações web (defensiva, labs apenas locais)
- Testes: TDD, unitários, integração, e2e, smoke, regressão
- Observabilidade e telemetria

### Linguagens

C++, Python, Java, Elixir, Rust, Go e TypeScript.

### Estrutura do repositório

| Caminho | Finalidade |
| --- | --- |
| `docs/pt/`, `docs/en/` | Documentação por área e subárea |
| `references/` | Material de estudo importado do repositório anterior |
| `PLAN.md` | Roadmap principal com checklists e critérios de aceite |
| `CHANGELOG.md` | Histórico de releases (Keep a Changelog + SemVer) |
| `AGENTS.md`, `CLAUDE.md`, `.claude/` | Regras, notas de onboarding e skills de terceiros fixadas para agentes de IA |

### O que todo miniprojeto contém

- README bilíngue explicando o que ele ensina
- Benchmark ou demo (CLI ou dashboard web simples)
- Scripts de setup: `setup-unix-<projeto>.sh` e `setup-windows-<projeto>.ps1`
- Comentários de código didáticos em português e inglês, escritos para iniciantes

### Labs de segurança e testes de carga

Os labs de segurança são **defensivos e educacionais**, no espírito do OWASP Juice Shop e do DVWA. Rodam apenas localmente, em Docker, sem acesso a rede externa, e todo exemplo vulnerável vem com a versão corrigida e um teste que prova a correção. Os testes de carga têm como alvo somente serviços locais criados neste repositório. Veja [SECURITY.md](SECURITY.md).

### Como contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

### Licença

[MIT](LICENSE)
