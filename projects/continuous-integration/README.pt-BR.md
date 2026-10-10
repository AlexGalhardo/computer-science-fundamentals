# Integração contínua

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Integração contínua significa integrar mudanças pequenas com frequência e deixar um pipeline automatizado compilar, analisar e testar cada uma, para que os problemas sejam achados minutos depois de introduzidos. Em torno dessa ideia ficam as práticas que este próprio repositório usa: workflows no GitHub Actions, cache e artefatos, segredos e permissões, barreiras de qualidade, estratégias de implantação, versionamento semântico e um changelog.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Pipeline de CI como lição (`ci-pipeline`)](ci-pipeline/README.pt-BR.md) | O que o pipeline deste repositório faz e por quê: cada job do `ci.yml` explicado, e cada um dos seus 14 portões de qualidade quebrado de propósito no Docker | pronto ([documentação](../../docs/pt/continuous-integration/ci-pipeline.md)) |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/continuous-integration/`).
- Documentação: planejada (`docs/pt/continuous-integration/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Gratuito. O artigo de referência sobre a prática: uma linha principal, builds que se testam, retorno rápido, correção imediata.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Gratuito. A introdução oficial a workflows, eventos, jobs, steps, actions e runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre controle de versões, integração contínua, implantação e feature flags.
- [GitHub Skills](https://learn.github.com/skills), GitHub. Gratuito. Cursos práticos que rodam dentro de um repositório seu, incluindo vários sobre Actions.

### Livros

- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble and David Farley. Gratuito online, pago impresso. O site do livro resume seus princípios: o pipeline de implantação, automação e lotes pequenos.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck and Wright. Gratuito. Capítulo gratuito sobre ciclos rápidos de retorno, testes antes e depois da submissão e instabilidade.
- [Pro Git (em português)](https://git-scm.com/book/pt-br/v2), Scott Chacon and Ben Straub. Em português. Gratuito. O livro gratuito de Git em português do Brasil, a base por baixo de qualquer pipeline.

### Artigos e especificações

- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Gratuito. A especificação dos números de versão usada por este repositório, também disponível em português.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), Conventional Commits contributors. Gratuito. A convenção de mensagens de commit que permite a ferramentas derivar versões e changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Gratuito. O formato de changelog deste repositório e os motivos por trás dele.
- [SLSA: Supply-chain Levels for Software Artifacts](https://slsa.dev/), Open Source Security Foundation. Gratuito. Estrutura de níveis para proteger o build e sua proveniência contra adulteração.
- [DORA](https://dora.dev/), DORA research programme, Google Cloud. Gratuito. A pesquisa por trás das quatro métricas de entrega e das capacidades que as melhoram.
- [Trunk Based Development](https://trunkbaseddevelopment.com/), Paul Hammant. Gratuito. Um site sobre o modelo de ramificação que a integração contínua pressupõe.
- [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), Martin Fowler. Gratuito. Descrição curta de como lançar alternando entre dois ambientes idênticos.

### Documentação oficial

- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Gratuito. A referência completa: sintaxe de workflow, contextos, cache, artefatos, matrizes e workflows reutilizáveis.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Gratuito. Orientação oficial de endurecimento: tokens com privilégio mínimo, fixação de actions e tratamento de entrada não confiável.
- [Docker: GitHub Actions](https://docs.docker.com/build/ci/github-actions/), Docker. Gratuito. Como construir imagens em um workflow com cache de camadas.

### Vídeos

- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratuito. Vídeos semanais do coautor do livro Continuous Delivery sobre pipelines, desenvolvimento na linha principal e testes.
- [DevOps CI/CD Explained in 100 Seconds](https://www.youtube.com/watch?v=scEDHsr3APg), Fireship. Gratuito. Uma visão geral de dois minutos antes das leituras mais longas.

### Prática e ferramentas

- [actionlint](https://github.com/rhysd/actionlint), rhysd. Gratuito. Verificador estático de arquivos de workflow que pega erros de sintaxe e de expressões.
- [act](https://github.com/nektos/act), nektos. Gratuito. Executa workflows do GitHub Actions localmente em Docker.
- [OpenSSF Scorecard](https://securityscorecards.dev/), Open Source Security Foundation. Gratuito. Verificações automáticas das práticas de cadeia de suprimentos de um repositório, como dependências fixadas.

### Comunidades

- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Gratuito. O fórum oficial para dúvidas sobre workflows e runners.
- [DevOps Stack Exchange](https://devops.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre pipelines, implantação e ferramentas.
