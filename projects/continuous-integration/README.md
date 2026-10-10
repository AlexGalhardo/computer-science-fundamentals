# Continuous integration

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Continuous integration means merging small changes often and letting an automated pipeline build, lint and test each one, so that problems are found minutes after they are introduced. Around that idea sit the practices this repository itself uses: workflows on GitHub Actions, caching and artifacts, secrets and permissions, quality gates, deployment strategies, semantic versioning and a changelog.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [CI pipeline as a lesson (`ci-pipeline`)](ci-pipeline/README.md) | What the pipeline of this repository does and why: every job of `ci.yml` explained, and each of its 14 quality gates broken on purpose in Docker | done ([documentation](../../docs/en/continuous-integration/ci-pipeline.md)) |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/continuous-integration/`).
- Documentation: planned (`docs/en/continuous-integration/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Free. The reference article on the practice: one mainline, self-testing builds, fast feedback, fix at once.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Free. The official introduction to workflows, events, jobs, steps, actions and runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. In Portuguese. Free. A free chapter in Portuguese on version control, continuous integration, deployment and feature flags.
- [GitHub Skills](https://learn.github.com/skills), GitHub. Free. Hands-on courses that run inside a repository of your own, including several on Actions.

### Books

- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble and David Farley. Free online, paid in print. The site of the book summarises its principles: the deployment pipeline, automation and small batches.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck and Wright. Free. A free chapter on fast feedback loops, presubmit and post-submit testing and flakiness.
- [Pro Git (em português)](https://git-scm.com/book/pt-br/v2), Scott Chacon and Ben Straub. In Portuguese. Free. The free Git book in Brazilian Portuguese, the base under any pipeline.

### Papers and specifications

- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Free. The specification of version numbers used by this repository, also available in Portuguese.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), Conventional Commits contributors. Free. The commit message convention that lets tools derive versions and changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Free. The changelog format of this repository and the reasons behind it.
- [SLSA: Supply-chain Levels for Software Artifacts](https://slsa.dev/), Open Source Security Foundation. Free. A framework of levels for protecting the build and its provenance against tampering.
- [DORA](https://dora.dev/), DORA research programme, Google Cloud. Free. The research behind the four delivery metrics and the capabilities that improve them.
- [Trunk Based Development](https://trunkbaseddevelopment.com/), Paul Hammant. Free. A site on the branching model that continuous integration assumes.
- [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), Martin Fowler. Free. A short description of releasing by switching between two identical environments.

### Official documentation

- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Free. The complete reference: workflow syntax, contexts, caching, artifacts, matrices and reusable workflows.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Free. Official hardening advice: least-privilege tokens, pinning actions and handling untrusted input.
- [Docker: GitHub Actions](https://docs.docker.com/build/ci/github-actions/), Docker. Free. How to build images in a workflow with layer caching.

### Videos

- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Free. Weekly videos by the co-author of the Continuous Delivery book on pipelines, trunk-based development and testing.
- [DevOps CI/CD Explained in 100 Seconds](https://www.youtube.com/watch?v=scEDHsr3APg), Fireship. Free. A two-minute overview before the longer readings.

### Practice and tools

- [actionlint](https://github.com/rhysd/actionlint), rhysd. Free. A static checker for workflow files that catches syntax and expression mistakes.
- [act](https://github.com/nektos/act), nektos. Free. Runs GitHub Actions workflows locally in Docker.
- [OpenSSF Scorecard](https://securityscorecards.dev/), Open Source Security Foundation. Free. Automated checks of a repository's supply-chain practices, such as pinned dependencies.

### Communities

- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Free. The official forum for questions about workflows and runners.
- [DevOps Stack Exchange](https://devops.stackexchange.com/), Stack Exchange. Free. Questions and answers on pipelines, deployment and tooling.
