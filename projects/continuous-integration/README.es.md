# Integración continua

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La integración continua consiste en integrar cambios pequeños con frecuencia y dejar que un pipeline automatizado compile, analice (lint) y pruebe cada uno, de modo que los problemas se encuentren minutos después de introducirse. Alrededor de esa idea están las prácticas que este mismo repositorio usa: workflows en GitHub Actions, caché y artefactos, secretos y permisos, quality gates, estrategias de despliegue, versionado semántico y un changelog.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Pipeline de CI como lección (`ci-pipeline`)](ci-pipeline/README.es.md) | Qué hace el pipeline de este repositorio y por qué: cada job de `ci.yml` explicado, y cada una de sus 14 puertas de calidad rota a propósito en Docker | listo ([documentación](../../docs/es/continuous-integration/ci-pipeline.md)) |

## Quiz y documentación

- Preguntas del quiz: planeado (`quiz/content/continuous-integration/`).
- Documentación: planeado (`docs/es/continuous-integration/`).
- Referencias de todas las áreas: [REFERENCES.md](../../REFERENCES.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Cada enlace fue verificado cuando se escribió la lista.

### Empieza aquí

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Gratis. El artículo de referencia sobre la práctica: una única línea principal, compilaciones que se prueban solas, retroalimentación rápida, corregir de inmediato.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Gratis. La introducción oficial a workflows, eventos, jobs, pasos, actions y runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. En portugués. Gratis. Un capítulo gratuito en portugués sobre control de versiones, integración continua, despliegue y feature flags.
- [GitHub Skills](https://learn.github.com/skills), GitHub. Gratis. Cursos prácticos que se ejecutan dentro de un repositorio propio, incluidos varios sobre Actions.

### Libros

- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble y David Farley. Gratis en línea, de pago en papel. El sitio del libro resume sus principios: el pipeline de despliegue, la automatización y los lotes pequeños.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck y Wright. Gratis. Un capítulo gratuito sobre ciclos de retroalimentación rápidos, pruebas presubmit y post-submit, y flakiness.
- [Pro Git (em português)](https://git-scm.com/book/pt-br/v2), Scott Chacon y Ben Straub. En portugués. Gratis. El libro gratuito de Git en portugués de Brasil, la base debajo de cualquier pipeline.

### Papers y especificaciones

- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Gratis. La especificación de números de versión que usa este repositorio, disponible también en español.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), colaboradores de Conventional Commits. Gratis. La convención de mensajes de commit que permite a las herramientas derivar versiones y changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Gratis. El formato de changelog de este repositorio y las razones que lo respaldan.
- [SLSA: Supply-chain Levels for Software Artifacts](https://slsa.dev/), Open Source Security Foundation. Gratis. Un marco de niveles para proteger la compilación y su procedencia contra manipulaciones.
- [DORA](https://dora.dev/), programa de investigación DORA, Google Cloud. Gratis. La investigación detrás de las cuatro métricas de entrega y de las capacidades que las mejoran.
- [Trunk Based Development](https://trunkbaseddevelopment.com/), Paul Hammant. Gratis. Un sitio sobre el modelo de ramas que la integración continua supone.
- [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), Martin Fowler. Gratis. Una descripción breve de cómo publicar alternando entre dos entornos idénticos.

### Documentación oficial

- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Gratis. La referencia completa: sintaxis de workflows, contextos, caché, artefactos, matrices y workflows reutilizables.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Gratis. Consejos oficiales de endurecimiento: tokens con mínimo privilegio, fijar versiones de actions y manejar entradas no confiables.
- [Docker: GitHub Actions](https://docs.docker.com/build/ci/github-actions/), Docker. Gratis. Cómo construir imágenes en un workflow con caché de capas.

### Videos

- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratis. Videos semanales del coautor del libro Continuous Delivery sobre pipelines, trunk-based development y pruebas.
- [DevOps CI/CD Explained in 100 Seconds](https://www.youtube.com/watch?v=scEDHsr3APg), Fireship. Gratis. Un resumen de dos minutos antes de las lecturas más largas.

### Práctica y herramientas

- [actionlint](https://github.com/rhysd/actionlint), rhysd. Gratis. Un verificador estático de archivos de workflow que detecta errores de sintaxis y de expresiones.
- [act](https://github.com/nektos/act), nektos. Gratis. Ejecuta workflows de GitHub Actions localmente en Docker.
- [OpenSSF Scorecard](https://securityscorecards.dev/), Open Source Security Foundation. Gratis. Verificaciones automáticas de las prácticas de cadena de suministro de un repositorio, como dependencias fijadas.

### Comunidades

- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Gratis. El foro oficial para preguntas sobre workflows y runners.
- [DevOps Stack Exchange](https://devops.stackexchange.com/), Stack Exchange. Gratis. Preguntas y respuestas sobre pipelines, despliegue y herramientas.
