# Quiz

> English version: [docs/en/quiz.md](../en/quiz.md) · Versão em português: [docs/pt/quiz.md](../pt/quiz.md)

El quiz es la puerta de entrada del repositorio: una sola app que cubre todas las áreas. Los mini-proyectos siguen en el plan, y la explicación de cada pregunta apunta al mini-proyecto que demuestra el concepto. Decisiones tomadas el 2026-10-07.

## Formato de las preguntas

- Opción múltiple con **5 alternativas** y una sola correcta.
- Después de responder, la explicación del concepto aparece junto a la pregunta.
- Cada pregunta tiene un nivel: básico, intermedio o avanzado.
- Cada pregunta existe en inglés, portugués y español desde el principio.

## Pantalla

Una pregunta por pantalla, en una cuadrícula de dos columnas. En un teléfono las columnas se apilan.

```text
+---------------------------+---------------------------+
| Big O  ·  question 3/20   |  EXPLANATION              |
|                           |                           |
| What is the complexity    |  (empty until answered)   |
| of binary search?         |                           |
|                           |  Correct: B, O(log n)     |
| ( ) A  O(1)               |  Each step halves the     |
| (x) B  O(log n)   right   |  interval...              |
| ( ) C  O(n)               |                           |
| ( ) D  O(n log n)         |  Why not C: ...           |
| ( ) E  O(n^2)             |  See: projects/big-o-lab  |
|                           |                           |
|                 [ Next > ]|                           |
+---------------------------+---------------------------+
```

## Qué contiene la explicación

1. El concepto y por qué la alternativa correcta es correcta.
2. Una línea para cada alternativa incorrecta, señalando el error de razonamiento.
3. Un ejemplo de código o un diagrama, cuando ayuda.
4. Un enlace al mini-proyecto que demuestra el concepto y a la fuente (resumen o capítulo del libro).

## Funciones obligatorias

- **i18n**: toda la app, interfaz y preguntas, en inglés, portugués y español, con un selector de idioma.
- **Tema claro y oscuro**, con un interruptor. La primera visita sigue la preferencia del sistema.
- **Apto para móviles**: usable desde 320 px de ancho, con controles de tamaño táctil.

## Otras funciones de la primera versión

- Progreso guardado en el navegador, con aciertos y errores por área.
- Modo "repasar solo las que fallé".
- Filtro por nivel de dificultad.
- Preguntas y alternativas mezcladas en cada intento.

## Tecnología

- Next.js con generación estática de sitios (SSG, cada página se pre-renderiza en el build), sin back end.
- Base UI (`@base-ui/react`) para los componentes interactivos: botones, los interruptores de idioma y de tema, los selects, el medidor de progreso de un área y el popup de un término en el resumen teórico. Base UI no tiene estilos, así que Tailwind CSS v4 es la capa de estilo, con los tokens de tema de `quiz/src/app/globals.css` como única fuente de colores.
- La app vive en `quiz/`, en la raíz del repositorio.
- Las preguntas viven en archivos JSON, en `quiz/content/<area>/<topic>.json`, validados por un esquema.

Campos de cada pregunta:

| Campo | Contenido |
| --- | --- |
| `id` | identificador estable, por ejemplo `big-o-binary-search-01` |
| `area`, `topic` | área y tema |
| `difficulty` | `basic`, `intermediate` o `advanced` |
| `answer` | índice de la alternativa correcta (0 a 4) |
| `source` | libro o clase y capítulo que cubre la pregunta |
| `miniProject` | ruta del mini-proyecto relacionado, cuando existe |
| `pt`, `en`, `es` | para cada idioma: enunciado, 5 alternativas, 5 explicaciones (una por alternativa), concepto y ejemplo opcional |

## Volumen y cobertura

- **Al menos 100 preguntas por área**, con el objetivo de cubrir todo el contenido de los libros y las clases. Hay 31 áreas y 3 220 preguntas planeadas.
- **Las áreas solo teóricas** (Electrónica con 170 preguntas, Ingeniería de software con 150) no tienen mini-proyecto, así que su quiz es más grande y sigue el libro fuente capítulo por capítulo.
- **Las áreas de teoría y práctica** (las otras 29) también tienen mini-proyectos ejecutables. El quiz y el mini-proyecto se complementan: la explicación enlaza al mini-proyecto, y el README del mini-proyecto lista los temas del quiz que demuestra.
- Cada área tiene un **mapa de cobertura**: la lista de capítulos y temas de los libros y clases de esa área, con el número de preguntas que cubre cada uno.
- Las preguntas se escriben a partir del mapa de capítulos y del conocimiento de la materia, no de una lectura página por página: los PDF no están en el repositorio y los resúmenes de los libros largos se hicieron a partir de una muestra del texto. Cada pregunta cita el capítulo que cubre.

## Producción

1. Primero la app del quiz y 5 áreas completas, con 100 preguntas cada una, para validar el formato y la calidad.
2. Luego las áreas restantes en oleadas de 5.

## Aseguramiento de la calidad

- **Validación automática**: un script comprueba que cada pregunta tenga 5 alternativas, exactamente una correcta, una explicación para cada alternativa, y los textos en PT, EN y ES.
- **Revisor independiente**: un segundo agente responde cada lote sin ver la clave de respuestas. Cada discrepancia se revisa antes de aceptar la pregunta.
- **Revisión del dueño** por muestreo.
