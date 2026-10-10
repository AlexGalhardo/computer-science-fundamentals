# Decisiones del proyecto

> English version: [docs/en/decisions.md](../en/decisions.md) · Versão em português: [docs/pt/decisions.md](../pt/decisions.md)
>
> Nota (2026-10-08): la carpeta `references/` mencionada en este documento se eliminó del repositorio y de su historial. Las referencias de estudio están en [REFERENCES.es.md](../../REFERENCES.es.md).

Decisiones tomadas en el brainstorming de la Fase 2 el 2026-10-07. Son la entrada para `PLAN.md`. La lista de mini-proyectos por área está en el [catálogo de mini-proyectos](mini-project-catalog.md), el diseño del quiz en [quiz.md](quiz.md), y las preguntas planteadas con las opciones descartadas en el [registro del brainstorming](brainstorming.md).

## Quiz

El producto principal del repositorio es un **quiz**: una sola app que cubre todas las áreas, con 5 alternativas por pregunta y la explicación del concepto mostrada junto a la pregunta después de responder. Los mini-proyectos siguen en el plan y cada explicación enlaza al mini-proyecto que demuestra el concepto. Al menos 100 preguntas por área, en inglés, portugués y español. Diseño completo en [quiz.md](quiz.md).

La app del quiz debe tener i18n (inglés, portugués y español), un interruptor de tema claro y oscuro y un diseño apto para móviles, construida con Next.js SSG y Tailwind CSS v4.

## Teoría y práctica

- **El contenido solo teórico** recibe un quiz web muy completo que cubre todos los aspectos del contenido, y ningún mini-proyecto. Esto se aplica a Electrónica e Ingeniería de software.
- **El contenido técnico que puede mostrarse con una CLI o una página web** recibe ejemplos prácticos ejecutables (Docker, scripts de shell) **y** el quiz. Uno complementa al otro. Esto se aplica a las otras 29 áreas.

## Estructura

| Tema | Decisión | Razón |
| --- | --- | --- |
| Estructura de carpetas | `projects/<area>/<mini-project>/`, con una subcarpeta por lenguaje (`ts/`, `go/`, `rust/`) | El mismo concepto se mantiene unido y los lenguajes pueden compararse lado a lado |
| Lenguajes por mini-proyecto | Una implementación de referencia en TypeScript, más los lenguajes en los que cambia la lección | Implementar todo en los 7 lenguajes multiplica el trabajo sin enseñar más |
| Entorno | Todo corre en Docker, con versiones de imagen fijadas. Los scripts de instalación requieren solo Docker. Tener las herramientas instaladas localmente es opcional | Siete lenguajes en una máquina es de donde sale el "en mi máquina funciona" |
| README | Tres archivos por mini-proyecto: `README.md` (inglés), `README.pt-BR.md` (portugués) y `README.es.md` (español) | Cada lector recibe un documento completo en un solo idioma |
| Comentarios de código | Trilingües (inglés, portugués y español), un bloque por concepto, no línea por línea | Didáctico sin duplicar ni triplicar la longitud del código |
| Dashboards | Una página estática por mini-proyecto (HTML + Tailwind CSS v4 que lee el JSON de resultados). Next.js solo donde el concepto necesita un servidor | Simple de abrir y de mantener |

## Benchmarks

- Un contrato para cada implementación: leer la misma entrada, imprimir JSON con al menos `n`, tiempo transcurrido y memoria.
- [hyperfine](https://github.com/sharkdp/hyperfine) mide los procesos. Es la única herramienta de benchmark añadida al stack.
- Un runner compara los archivos JSON y escribe la tabla de resultados. Los resultados se confirman en el repositorio como Markdown.
- Las pruebas de carga siguen usando k6, y solo contra servicios locales.

## Alcance por área

| Área | Decisión |
| --- | --- |
| Compiladores | Lexer, parser, AST e intérprete que recorre el árbol en TypeScript, una VM de bytecode en Rust y un motor de expresiones regulares (NFA a DFA) en Go. Sin WebAssembly ni generación de código nativo |
| Patrones de diseño | Una selección de unos 10 patrones que aparecen en los back ends web: Strategy, Observer, Factory, Adapter, Decorator, Repository, Command, State, Builder y Singleton con las razones para evitarlo |
| Seguridad | Un laboratorio aislado por falla, cada uno con su propio docker-compose en una red interna: versión vulnerable, versión corregida y una prueba que demuestra el arreglo |
| Observabilidad | OpenTelemetry con Prometheus, Grafana, Loki y Tempo, todo local en docker-compose. Estas cuatro herramientas se añaden al stack |

## Proyectos heredados

`references/projects/load-stress-tests` y `references/projects/message-queues-pubsub` se **reconstruyen como nuevos mini-proyectos**, no se portan. El código antiguo queda en `references/` para consulta. En las versiones reconstruidas la API serverless corre en LocalStack y los generadores de carga pasan a ser escenarios locales de k6.

## Áreas adicionales

Se añadieron al plan ocho áreas sugeridas por el material importado: caché, limitador de tasa, sistemas de archivos, lógica digital, redes, sistemas operativos, una blockchain didáctica y CI para este repositorio con GitHub Actions.

Cuatro más salieron de los libros: electrónica, arquitectura de software, teoría de bases de datos e ingeniería de software. El plan tiene 31 áreas.

## Imágenes

Las 120 imágenes de `references/images/` no están rastreadas por git. Varias son infografías de terceros que no pueden redistribuirse bajo MIT. La carpeta está ignorada por git y queda solo en la máquina del dueño.

## Orden de trabajo

- **Primero el quiz**: la app del quiz y 5 áreas completas (100 preguntas cada una), luego las áreas restantes en oleadas de 5.
- **Primera oleada de mini-proyectos** (5 mini-proyectos, un worktree cada uno): carrera de ordenamientos, laboratorio de condiciones de carrera, laboratorio de inyección SQL, lexer y parser del mini lenguaje, comparación de colas.
- **Después, primero a lo ancho**: un mini-proyecto por área hasta que cada área tenga al menos uno, y luego profundizar.
