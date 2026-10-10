<!-- markdownlint-disable-next-line MD041 -->
<div align="center">

# Computer Science Fundamentals

Fundamentos de ciencias de la computación que puedes **responder, ejecutar y
medir**: un quiz trilingüe que cubre 32 áreas, y pequeños mini-proyectos
ejecutables que muestran cada concepto en funcionamiento, con pruebas,
benchmarks y explicaciones paso a paso escritas para principiantes.

[![CI](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/computer-science-fundamentals/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org/en/v1.0.0/)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue.svg)](https://semver.org/)

<!-- markdownlint-disable-next-line MD001 -->
### [Read in English](./README.md)

### [Leia em Português Brasil](./README-ptbr.md)

</div>

## Tabla de contenidos

- [Introducción](#introducción)
- [Qué aprenderás](#qué-aprenderás)
- [Hoja de ruta para principiantes](#hoja-de-ruta-para-principiantes)
- [Inicio rápido](#inicio-rápido)
- [Stack tecnológico](#stack-tecnológico)
- [Documentación](#documentación)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Cómo se construye este proyecto](#cómo-se-construye-este-proyecto)
- [Cómo contribuir](#cómo-contribuir)
- [Créditos](#créditos)

## Introducción

**Computer Science Fundamentals** es una referencia de estudio de largo plazo y
de código abierto (MIT). Tiene dos partes que se apuntan entre sí:

- **Un quiz.** Opción múltiple, 5 alternativas, en inglés, portugués y español.
  Después de responder, la explicación aparece junto a la pregunta: el concepto,
  por qué la alternativa correcta es correcta, por qué cada una de las otras es
  incorrecta, y un enlace al mini-proyecto que muestra la idea en ejecución.
- **Mini-proyectos.** Programas pequeños que vuelven observable un concepto: una
  condición de carrera que pierde actualizaciones y cuatro formas de arreglarla,
  un árbol B que lee 3 páginas donde un árbol binario lee 16, una inyección SQL
  y la consulta que la detiene. Cada uno tiene pruebas, una demo o benchmark, y
  documentación en los tres idiomas. Todo corre en Docker, así que el único
  requisito es Docker.

El estado en vivo de cada área (preguntas escritas, revisión a ciegas,
mini-proyectos terminados) se genera a partir del propio repositorio:
[docs/es/README.md](./docs/es/README.md).

El trabajo en este proyecto comenzó en **octubre de 2026**, escrito con
**Claude Code (Claude Opus 5.5)** y revisado por su autor. Consulta
[Cómo se construye este proyecto](#cómo-se-construye-este-proyecto).

## Qué aprenderás

Cada área tiene un quiz y, salvo las dos áreas solo teóricas, una carpeta en
[`projects/`](./projects) con sus mini-proyectos y referencias de estudio.

| Área | Qué muestran los mini-proyectos |
| --- | --- |
| [Big O y análisis de algoritmos](./projects/big-o) | medir una función y nombrar su curva de crecimiento, el teorema maestro, por qué los ordenamientos por comparación no pueden superar n log n |
| [Algoritmos](./projects/algorithms) | los mismos seis ordenamientos en siete lenguajes, programación dinámica, dónde se detiene la fuerza bruta, quicksort híbrido |
| [Estructuras de datos](./projects/data-structures) | un hash map desde cero, algoritmos de grafos, un árbol B en disco, caché LRU, filtro de Bloom, trie, árboles balanceados |
| [Sistemas operativos](./projects/operating-systems) | planificación de CPU, paginación y TLB, asignadores de memoria, detección de interbloqueos, un mini shell |
| [Redes](./projects/networks) | entrega confiable sobre un canal con pérdidas, un mini TCP, ALOHA y CSMA/CD, un resolvedor DNS, subredes |
| [Bases de datos (teoría)](./projects/databases) | un mini motor relacional con tres algoritmos de join, una herramienta de normalización |
| [Transacciones](./projects/transactions) | niveles de aislamiento y sus anomalías, sobreventa bajo carga, lo que cuesta un ORM, outbox y saga |
| [Concurrencia](./projects/concurrency) | una condición de carrera en un contador y cuatro arreglos, cena de los filósofos, diez mil conexiones en tres runtimes |
| [Paralelismo](./projects/parallelism) | aceleración por núcleos y la ley de Amdahl |
| [Seguridad](./projects/security) | laboratorios defensivos y solo locales: inyección SQL, XSS y CSP, CSRF, control de acceso, SSRF, contraseñas y sesiones, JWT, cargas de archivos |
| [Compiladores](./projects/compilers) | un lexer y un parser, un intérprete que recorre el árbol, una VM de bytecode, un motor de expresiones regulares |
| [Máquinas de estado](./projects/state-machines) | el ciclo de vida de un pedido dirigido por una sola tabla de transiciones |
| [Teoría de la información](./projects/information-theory) | entropía, Huffman y LZ77, códigos CRC y Hamming |
| [Lógica digital](./projects/digital-logic) | compuertas, minimización con Karnaugh, sumadores, una ALU solo con NAND y una CPU de 4 bits |
| [Programación orientada a objetos](./projects/oop) | el mismo dominio en estilo OOP y funcional, un catálogo de code smells |
| [Programación funcional](./projects/functional-programming) | funciones puras y pruebas basadas en propiedades |
| [Patrones de diseño y SOLID](./projects/design-patterns) | patrones de back end donde valen la pena, SOLID antes y después |
| [Arquitectura de software](./projects/software-architecture) | una aplicación con arquitectura limpia y su regla de dependencia |
| [Testing](./projects/testing) | la pirámide de pruebas completa, un kata de TDD, pruebas de mutación, pruebas inestables, un framework de pruebas desde cero |
| [Protocolos](./projects/protocols) | REST, GraphQL y JSON-RPC, de HTTP/1.1 a HTTP/3, un servidor HTTP sobre TCP puro |
| [Mensajería](./projects/messaging) | colas comparadas, idempotencia y dead letters, pub/sub y contrapresión |
| [Balanceo de carga](./projects/load-balancing) | NGINX frente a Caddy, un balanceador de capa 7 escrito a mano |
| [Rendimiento](./projects/performance) | Bun frente a Node, escenarios de pruebas de carga con k6, código amigable con la caché |
| [Caché](./projects/cache) | estrategias de caché y el cache stampede |
| [Limitación de tasa](./projects/rate-limiting) | los cuatro algoritmos clásicos, en memoria y en Redis |
| [Sistemas de archivos](./projects/file-systems) | registros e índices dentro de un archivo, ordenamiento externo |
| [Observabilidad](./projects/observability) | trazas, métricas y logs juntos, ids de correlación, SLOs y alertas, flame graphs |
| [Blockchain](./projects/blockchain) | hashing, prueba de trabajo y una regla de cadena más larga |
| [Integración continua](./projects/continuous-integration) | el pipeline de este repositorio, explicado |
| [Inteligencia artificial y LLMs](./projects/artificial-intelligence) | un tokenizador, una red neuronal desde cero, embeddings, un modelo de lenguaje diminuto, un juguete de difusión |
| Electrónica | solo teoría: un quiz de 170 preguntas |
| Ingeniería de software | solo teoría: un quiz de 150 preguntas |

No todas las áreas están terminadas todavía. La
[página de estado](./docs/es/README.md) indica cuáles lo están, y
[PLAN.md](./PLAN.md) tiene la hoja de ruta completa con criterios de
aceptación.

## Hoja de ruta para principiantes

No necesitas seguir las áreas en el orden de arriba. Este orden construye cada
paso sobre el anterior. Para cada paso: lee la página del área, responde el quiz
en el nivel básico, ejecuta el primer mini-proyecto y luego vuelve por las
preguntas más difíciles.

1. **Cómo pensar en el costo.** [Big O](./projects/big-o), luego
   [Algoritmos](./projects/algorithms) (empieza con la carrera de ordenamientos).
2. **Cómo se organizan los datos.** [Estructuras de datos](./projects/data-structures):
   listas, pilas, colas, árboles, tablas hash, grafos.
3. **Cómo se construye una computadora.** [Lógica digital](./projects/digital-logic),
   luego el quiz de Electrónica si quieres la capa física.
4. **Qué ejecuta tu programa.** [Sistemas operativos](./projects/operating-systems),
   luego [Sistemas de archivos](./projects/file-systems).
5. **Cómo hablan las computadoras.** [Redes](./projects/networks), luego
   [Protocolos](./projects/protocols).
6. **Dónde viven los datos.** [Bases de datos](./projects/databases), luego
   [Transacciones](./projects/transactions).
7. **Hacer muchas cosas a la vez.** [Concurrencia](./projects/concurrency), luego
   [Paralelismo](./projects/parallelism).
8. **Escribir código que dure.** [OOP](./projects/oop),
   [Programación funcional](./projects/functional-programming),
   [Patrones de diseño y SOLID](./projects/design-patterns),
   [Testing](./projects/testing),
   [Arquitectura de software](./projects/software-architecture), y el quiz de
   Ingeniería de software.
9. **Mantener los sistemas seguros.** [Seguridad](./projects/security).
10. **Operar sistemas a escala.** [Caché](./projects/cache),
    [Limitación de tasa](./projects/rate-limiting),
    [Balanceo de carga](./projects/load-balancing),
    [Mensajería](./projects/messaging), [Rendimiento](./projects/performance),
    [Observabilidad](./projects/observability),
    [Integración continua](./projects/continuous-integration).
11. **Cómo funcionan los lenguajes.** [Máquinas de estado](./projects/state-machines),
    [Teoría de la información](./projects/information-theory),
    [Compiladores](./projects/compilers).
12. **Temas modernos.** [Inteligencia artificial y LLMs](./projects/artificial-intelligence),
    [Blockchain](./projects/blockchain).

Los libros, cursos, papers y videos de cada paso están en
[REFERENCES.es.md](./REFERENCES.es.md).

## Inicio rápido

El único requisito es [Docker](https://docs.docker.com/get-docker/).

Ejecuta el quiz:

```sh
./quiz/setup-unix-quiz.sh        # Linux and macOS
./quiz/setup-windows-quiz.ps1    # Windows
```

Luego abre <http://localhost:3000>.

Ejecuta un mini-proyecto (cada uno trae sus propios scripts de instalación, que
construyen imágenes fijadas y corren las pruebas):

```sh
./projects/big-o/big-o-lab/setup-unix-big-o-lab.sh
```

Su README explica qué enseña, cómo ejecutar la demo y qué temas del quiz
demuestra.

Para trabajar en el repositorio mismo también necesitas [Bun](https://bun.sh) 1.4.2:

```sh
bun install
bun run lint && bun run typecheck
bun test quiz/tests/unit tools
bun run quiz:validate
```

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| App del quiz | [Next.js](https://nextjs.org) con generación estática de sitios, [Tailwind CSS v4](https://tailwindcss.com), sin back end |
| Validación de contenido | [Zod](https://zod.dev) |
| Lenguajes de los mini-proyectos | TypeScript ([Bun](https://bun.sh)), Python, Go, Rust, C++, Java, Elixir |
| Entorno | [Docker](https://www.docker.com) y docker-compose, una imagen fijada por lenguaje |
| Bases de datos y brokers | PostgreSQL, SQLite, Redis, RabbitMQ, Kafka, LocalStack |
| Servidores web y proxies | [ElysiaJS](https://elysiajs.com), Caddy, NGINX |
| Benchmarks y pruebas de carga | [hyperfine](https://github.com/sharkdp/hyperfine), [k6](https://k6.io), solo objetivos locales |
| Pruebas | `bun:test`, [Playwright](https://playwright.dev), y el ejecutor de pruebas de cada lenguaje |
| Lint y formato | [Biome](https://biomejs.dev), ruff, rustfmt y clippy, gofmt y golangci-lint, clang-format, mix format, Spotless |
| CI | GitHub Actions |

## Documentación

| Documento | Qué cubre |
| --- | --- |
| [docs/es/README.md](./docs/es/README.md) | estado en vivo de cada área, con enlaces a cada mini-proyecto |
| [REFERENCES.es.md](./REFERENCES.es.md) | libros, cursos, papers, documentación y videos, por área |
| [PLAN.md](./PLAN.md) | la hoja de ruta, con listas de verificación y criterios de aceptación |
| [docs/es/quiz.md](./docs/es/quiz.md) | diseño del quiz |
| [docs/es/quiz-authoring.md](./docs/es/quiz-authoring.md) | cómo se escriben las preguntas y se revisan a ciegas |
| [docs/es/environment.md](./docs/es/environment.md) | imágenes de Docker fijadas y formateadores |
| [docs/es/benchmarks.md](./docs/es/benchmarks.md) | el contrato de benchmarks y el runner |
| [docs/es/decisions.md](./docs/es/decisions.md) | decisiones del proyecto y sus razones |
| [quiz/README.md](./quiz/README.es.md) | la app del quiz |
| [CHANGELOG.md](./CHANGELOG.md) | historial de versiones |
| [SECURITY.md](./SECURITY.md) | alcance de los laboratorios de seguridad y de las pruebas de carga |
| [AGENTS.md](./AGENTS.md) | guía de incorporación para agentes de código con IA |

Cada documento de `docs/en/` tiene un equivalente en `docs/pt/` y en `docs/es/`.

## Estructura del repositorio

```text
/quiz/         la app del quiz y sus preguntas (quiz/content/<area>/<tema>.json)
/projects/     mini-proyectos, por área, cada uno con pruebas, demo y tres READMEs
/benchmarks/   cargas de benchmark entre lenguajes y su dashboard (en progreso)
/docs/         documentación por área, en inglés (en/), portugués (pt/) y español (es/)
/tools/        runner de benchmarks y generador de mini-proyectos
/docker/       una imagen base fijada por lenguaje
/.github/      integración continua
/.claude/      reglas y notas para agentes de código con IA
```

## Cómo se construye este proyecto

- **Escrito con un agente de código con IA.** El desarrollo comenzó en octubre de
  2026 con Claude Code (Claude Opus 5.5), trabajando en git worktrees
  paralelos, un área completa por worktree.
- **Cada pregunta se revisa a ciegas.** Un segundo agente responde cada área sin
  ver la clave de respuestas. Donde discrepa con la clave, o señala un
  enunciado ambiguo, la pregunta se corrige y la resolución se registra en el
  `review.md` del área.
- **Cada casilla tiene un criterio de aceptación.** [PLAN.md](./PLAN.md) indica
  un comando o un hecho observable para cada elemento, y una casilla se marca
  solo después de haberlo ejecutado. Donde un criterio no pudo cumplirse tal
  como estaba escrito, el plan lo dice.
- **Todo se verifica en Linux con CI**, incluidas las pruebas de cada
  mini-proyecto cuya carpeta cambia.
- **El contenido de seguridad es defensivo.** Los laboratorios corren solo en
  local, en Docker, en redes internas, y cada ejemplo vulnerable incluye su
  arreglo y una prueba que lo demuestra. Las pruebas de carga nunca apuntan a
  hosts de terceros.
- **El material escrito por IA puede estar equivocado.** Si encuentras un error
  en una pregunta o en una explicación, por favor abre un issue: es la
  contribución más útil.

## Cómo contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md). Los commits siguen
[Conventional Commits](https://www.conventionalcommits.org/), las versiones
siguen [SemVer](https://semver.org/), y cada área del quiz o mini-proyecto
terminado tiene su propio release.

## Créditos

Construido por [Alex Galhardo](https://github.com/AlexGalhardo), con Claude Code.

Licenciado bajo la [Licencia MIT](./LICENSE).
