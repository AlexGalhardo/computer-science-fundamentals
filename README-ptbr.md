<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

# Computer Science Fundamentals

Fundamentos de ciência da computação que você pode **responder, rodar e medir**:
um quiz bilíngue cobrindo 32 áreas, e mini-projetos executáveis que mostram cada
conceito funcionando, com testes, benchmarks e explicações passo a passo
escritas para iniciantes.

[![CI](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue.svg)](https://semver.org/)

[Read in English](./README.md)

</div>

## Sumário

- [Introdução](#introdução)
- [O que você vai aprender](#o-que-você-vai-aprender)
- [Roteiro para iniciantes](#roteiro-para-iniciantes)
- [Começo rápido](#começo-rápido)
- [Stack](#stack)
- [Documentação](#documentação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como este projeto é construído](#como-este-projeto-é-construído)
- [Como contribuir](#como-contribuir)
- [Créditos](#créditos)

## Introdução

**Computer Science Fundamentals** é uma referência de estudo de longo prazo,
open source (MIT). Ela tem duas partes que apontam uma para a outra:

- **Um quiz.** Múltipla escolha, 5 alternativas, em português e inglês. Depois
  da resposta, a explicação aparece ao lado da questão: o conceito, por que a
  alternativa certa está certa, por que cada uma das outras está errada, e um
  link para o mini-projeto que mostra a ideia funcionando.
- **Mini-projetos.** Programas pequenos que tornam um conceito observável: uma
  condição de corrida que perde atualizações e quatro formas de corrigi-la, uma
  árvore B que lê 3 páginas onde uma árvore binária lê 16, uma injeção de SQL e
  a consulta que a impede. Cada um tem testes, uma demo ou benchmark, e
  documentação nos dois idiomas. Tudo roda em Docker, então o único requisito é
  o Docker.

O status atual de cada área (questões escritas, revisão cega, mini-projetos
prontos) é gerado a partir do próprio repositório:
[docs/pt/README.md](./docs/pt/README.md).

O projeto começou a ser desenvolvido em **outubro de 2026**, escrito com o
**Claude Code (Claude Opus 5.5)** e revisado pelo autor. Veja
[Como este projeto é construído](#como-este-projeto-é-construído).

## O que você vai aprender

Cada área tem um quiz e, com exceção das duas áreas só de teoria, uma pasta em
[`projects/`](./projects) com seus mini-projetos e referências de estudo.

| Área | O que os mini-projetos mostram |
| --- | --- |
| [Big O e análise de algoritmos](./projects/big-o) | medir uma função e nomear sua curva de crescimento, o teorema mestre, por que ordenação por comparação não passa de n log n |
| [Algoritmos](./projects/algorithms) | as mesmas seis ordenações em sete linguagens, programação dinâmica, onde a força bruta para, quicksort híbrido |
| [Estruturas de dados](./projects/data-structures) | hash map do zero, algoritmos em grafos, árvore B em disco, cache LRU, filtro de Bloom, trie, árvores balanceadas |
| [Sistemas operacionais](./projects/operating-systems) | escalonamento de CPU, paginação e TLB, alocadores de memória, detecção de deadlock, um mini shell |
| [Redes](./projects/networks) | entrega confiável sobre canal com perda, um mini TCP, ALOHA e CSMA/CD, resolvedor DNS, sub-redes |
| [Bancos de dados (teoria)](./projects/databases) | um mini motor relacional com três algoritmos de junção, uma ferramenta de normalização |
| [Transações](./projects/transactions) | níveis de isolamento e suas anomalias, venda acima do estoque sob carga, quanto custa um ORM, outbox e saga |
| [Concorrência](./projects/concurrency) | contador com condição de corrida e quatro correções, jantar dos filósofos, dez mil conexões em três runtimes |
| [Paralelismo](./projects/parallelism) | speed-up por núcleos e a lei de Amdahl |
| [Segurança](./projects/security) | laboratórios defensivos e locais: injeção de SQL, XSS e CSP, CSRF, controle de acesso, SSRF, senhas e sessões, JWT, upload |
| [Compiladores](./projects/compilers) | lexer e parser, interpretador de árvore, máquina virtual de bytecode, motor de regex |
| [Máquinas de estado](./projects/state-machines) | o ciclo de vida de um pedido guiado por uma tabela de transições |
| [Teoria da informação](./projects/information-theory) | entropia, Huffman e LZ77, CRC e códigos de Hamming |
| [Lógica digital](./projects/digital-logic) | portas, minimização por Karnaugh, somadores, uma ULA só de NAND e uma CPU de 4 bits |
| [Programação orientada a objetos](./projects/oop) | o mesmo domínio em estilo OO e funcional, um catálogo de code smells |
| [Programação funcional](./projects/functional-programming) | funções puras e testes baseados em propriedades |
| [Padrões de projeto e SOLID](./projects/design-patterns) | padrões de back end onde compensam, SOLID antes e depois |
| [Arquitetura de software](./projects/software-architecture) | uma aplicação em arquitetura limpa e sua regra de dependência |
| [Testes](./projects/testing) | a pirâmide de testes completa, um kata de TDD, teste de mutação, testes instáveis, um framework de testes do zero |
| [Protocolos](./projects/protocols) | REST, GraphQL e JSON-RPC, de HTTP/1.1 a HTTP/3, um servidor HTTP sobre TCP puro |
| [Mensageria](./projects/messaging) | filas comparadas, idempotência e dead letter, pub/sub e backpressure |
| [Balanceamento de carga](./projects/load-balancing) | NGINX contra Caddy, um balanceador de camada 7 escrito à mão |
| [Performance](./projects/performance) | Bun contra Node, cenários de teste de carga com k6, código amigável ao cache |
| [Cache](./projects/cache) | estratégias de cache e o cache stampede |
| [Rate limiting](./projects/rate-limiting) | os quatro algoritmos clássicos, em memória e no Redis |
| [Sistemas de arquivos](./projects/file-systems) | registros e índices dentro de um arquivo, ordenação externa |
| [Observabilidade](./projects/observability) | traces, métricas e logs juntos, correlation id, SLO e alertas, flame graphs |
| [Blockchain](./projects/blockchain) | hash, prova de trabalho e a regra da cadeia mais longa |
| [Integração contínua](./projects/continuous-integration) | o pipeline deste repositório, explicado |
| [Inteligência artificial e LLMs](./projects/artificial-intelligence) | um tokenizador, uma rede neural do zero, embeddings, um mini modelo de linguagem, difusão em miniatura |
| Eletrônica | só teoria: quiz de 170 questões |
| Engenharia de software | só teoria: quiz de 150 questões |

Nem toda área está pronta. A [página de status](./docs/pt/README.md) diz quais
estão, e o [PLAN.md](./PLAN.md) tem o roteiro completo com critérios de aceite.

## Roteiro para iniciantes

Você não precisa seguir as áreas na ordem da tabela. A ordem abaixo faz cada
passo se apoiar no anterior. Em cada passo: leia a página da área, responda o
quiz no nível básico, rode o primeiro mini-projeto, e depois volte para as
questões mais difíceis.

1. **Como pensar em custo.** [Big O](./projects/big-o), depois
   [Algoritmos](./projects/algorithms) (comece pela corrida de ordenação).
2. **Como os dados são organizados.**
   [Estruturas de dados](./projects/data-structures): listas, pilhas, filas,
   árvores, tabelas hash, grafos.
3. **Como um computador é construído.**
   [Lógica digital](./projects/digital-logic), e o quiz de Eletrônica se quiser
   a camada física.
4. **O que roda o seu programa.**
   [Sistemas operacionais](./projects/operating-systems), depois
   [Sistemas de arquivos](./projects/file-systems).
5. **Como os computadores conversam.** [Redes](./projects/networks), depois
   [Protocolos](./projects/protocols).
6. **Onde os dados moram.** [Bancos de dados](./projects/databases), depois
   [Transações](./projects/transactions).
7. **Fazer várias coisas ao mesmo tempo.**
   [Concorrência](./projects/concurrency), depois
   [Paralelismo](./projects/parallelism).
8. **Escrever código que dura.** [POO](./projects/oop),
   [Programação funcional](./projects/functional-programming),
   [Padrões de projeto e SOLID](./projects/design-patterns),
   [Testes](./projects/testing),
   [Arquitetura de software](./projects/software-architecture) e o quiz de
   Engenharia de software.
9. **Manter sistemas seguros.** [Segurança](./projects/security).
10. **Operar sistemas em escala.** [Cache](./projects/cache),
    [Rate limiting](./projects/rate-limiting),
    [Balanceamento de carga](./projects/load-balancing),
    [Mensageria](./projects/messaging), [Performance](./projects/performance),
    [Observabilidade](./projects/observability),
    [Integração contínua](./projects/continuous-integration).
11. **Como as linguagens funcionam.**
    [Máquinas de estado](./projects/state-machines),
    [Teoria da informação](./projects/information-theory),
    [Compiladores](./projects/compilers).
12. **Temas modernos.**
    [Inteligência artificial e LLMs](./projects/artificial-intelligence),
    [Blockchain](./projects/blockchain).

Livros, cursos, artigos e vídeos para cada passo estão em
[REFERENCES.pt-BR.md](./REFERENCES.pt-BR.md).

## Começo rápido

O único requisito é o [Docker](https://docs.docker.com/get-docker/).

Para rodar o quiz:

```sh
./quiz/setup-unix-quiz.sh        # Linux e macOS
./quiz/setup-windows-quiz.ps1    # Windows
```

Depois abra <http://localhost:3000>.

Para rodar um mini-projeto (cada um traz os próprios scripts de setup, que
constroem imagens fixadas e rodam os testes):

```sh
./projects/big-o/big-o-lab/setup-unix-big-o-lab.sh
```

O README dele diz o que ensina, como rodar a demo e quais tópicos do quiz ele
demonstra.

Para trabalhar no repositório em si você também precisa do
[Bun](https://bun.sh) 1.4.2:

```sh
bun install
bun run lint && bun run typecheck
bun test quiz/tests/unit tools
bun run quiz:validate
```

## Stack

| Camada | Tecnologia |
| --- | --- |
| App do quiz | geração estática com [Next.js](https://nextjs.org), [Tailwind CSS v4](https://tailwindcss.com), sem back end |
| Validação de conteúdo | [Zod](https://zod.dev) |
| Linguagens dos mini-projetos | TypeScript ([Bun](https://bun.sh)), Python, Go, Rust, C++, Java, Elixir |
| Ambiente | [Docker](https://www.docker.com) e docker-compose, uma imagem fixada por linguagem |
| Bancos e brokers | PostgreSQL, SQLite, Redis, RabbitMQ, Kafka, LocalStack |
| Servidores e proxies | [ElysiaJS](https://elysiajs.com), Caddy, NGINX |
| Benchmarks e testes de carga | [hyperfine](https://github.com/sharkdp/hyperfine), [k6](https://k6.io), somente alvos locais |
| Testes | `bun:test`, [Playwright](https://playwright.dev) e o executor de testes de cada linguagem |
| Lint e formatação | [Biome](https://biomejs.dev), ruff, rustfmt e clippy, gofmt e golangci-lint, clang-format, mix format, Spotless |
| CI | GitHub Actions |

## Documentação

| Documento | O que cobre |
| --- | --- |
| [docs/pt/README.md](./docs/pt/README.md) | status atual de cada área, com links para cada mini-projeto |
| [REFERENCES.pt-BR.md](./REFERENCES.pt-BR.md) | livros, cursos, artigos, documentação e vídeos, por área |
| [PLAN.md](./PLAN.md) | o roteiro, com checklists e critérios de aceite |
| [docs/pt/quiz.md](./docs/pt/quiz.md) | desenho do quiz |
| [docs/pt/quiz-authoring.md](./docs/pt/quiz-authoring.md) | como as questões são escritas e revisadas às cegas |
| [docs/pt/environment.md](./docs/pt/environment.md) | imagens Docker fixadas e formatadores |
| [docs/pt/benchmarks.md](./docs/pt/benchmarks.md) | o contrato e o runner de benchmark |
| [docs/pt/decisions.md](./docs/pt/decisions.md) | decisões do projeto e seus motivos |
| [quiz/README.pt-BR.md](./quiz/README.pt-BR.md) | o app do quiz |
| [CHANGELOG.md](./CHANGELOG.md) | histórico de releases |
| [SECURITY.md](./SECURITY.md) | escopo dos laboratórios de segurança e dos testes de carga |
| [AGENTS.md](./AGENTS.md) | orientação para agentes de IA |

Todo documento em `docs/pt/` tem um equivalente em `docs/en/`.

## Estrutura do repositório

```text
/quiz/         o app do quiz e as questões (quiz/content/<area>/<topico>.json)
/projects/     mini-projetos, por área, cada um com testes, demo e dois READMEs
/benchmarks/   cargas de benchmark entre linguagens e o dashboard (em andamento)
/docs/         documentação por área, em inglês (en/) e português (pt/)
/tools/        runner de benchmark e gerador de mini-projetos
/docker/       uma imagem base fixada por linguagem
/.github/      integração contínua
/.claude/      regras e notas para agentes de IA
```

## Como este projeto é construído

- **Escrito com um agente de IA.** O desenvolvimento começou em outubro de 2026
  com o Claude Code (Claude Opus 5.5), trabalhando em git worktrees paralelas,
  uma área completa por worktree.
- **Toda questão passa por revisão cega.** Um segundo agente responde cada área
  sem ver o gabarito. Onde ele discorda do gabarito, ou aponta um enunciado
  ambíguo, a questão é corrigida e a resolução fica registrada no `review.md` da
  área.
- **Toda caixa do plano tem um critério de aceite.** O [PLAN.md](./PLAN.md)
  define um comando ou um fato observável para cada item, e a caixa só é marcada
  depois de ele ser executado. Onde um critério não pôde ser cumprido como
  escrito, o plano diz isso.
- **Tudo é verificado em Linux pelo CI**, incluindo os testes de cada
  mini-projeto cuja pasta muda.
- **O conteúdo de segurança é defensivo.** Os laboratórios rodam só localmente,
  em Docker, em redes internas, e todo exemplo vulnerável vem com a correção e
  um teste que a prova. Testes de carga nunca miram servidores de terceiros.
- **Material escrito por IA pode estar errado.** Se você achar um erro em uma
  questão ou em uma explicação, abra uma issue: é a contribuição mais útil.

## Como contribuir

Veja [CONTRIBUTING.md](./CONTRIBUTING.md). Os commits seguem
[Conventional Commits](https://www.conventionalcommits.org/), as versões seguem
[SemVer](https://semver.org/), e cada área de quiz ou mini-projeto concluído
ganha a própria release.

## Créditos

Feito por [Alex Galhardo](https://github.com/AlexGalhardo), com o Claude Code.

Licenciado sob a [Licença MIT](./LICENSE).
