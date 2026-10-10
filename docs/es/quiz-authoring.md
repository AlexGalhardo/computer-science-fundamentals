# Guía de autoría del quiz

> English version: [docs/en/quiz-authoring.md](../en/quiz-authoring.md) · Versão em português: [docs/pt/quiz-authoring.md](../pt/quiz-authoring.md)

Cómo escribir una pregunta del quiz, y cómo se acepta un lote. El diseño del quiz está en [quiz.md](quiz.md).

## Archivos

```text
quiz/content/
  areas.json            the 31 areas (slug, names, target)
  mini-projects.json    the 78 mini-projects (path, status)
  <area>/
    coverage.json       topics of the area, source and target count per topic
    <topic>.json        a JSON list of questions of that topic
    review.md           log of the blind review
```

El nombre del archivo es el slug del tema, y debe existir en `coverage.json`.

## Mapa de cobertura

```json
{
	"area": "big-o",
	"sources": ["USP Algorithm Analysis lectures, parts 1 and 2"],
	"topics": [
		{
			"slug": "asymptotic-notation",
			"name": { "en": "Asymptotic notation", "pt": "Notação assintótica", "es": "Notación asintótica" },
			"source": "USP Algorithm Analysis, part 1",
			"target": 15
		}
	]
}
```

Los temas y los objetivos vienen de la tabla del área en `PLAN.md`. Los objetivos suman el objetivo del área.

## Pregunta

```json
{
	"id": "big-o-asymptotic-notation-01",
	"area": "big-o",
	"topic": "asymptotic-notation",
	"difficulty": "basic",
	"answer": 1,
	"source": "USP Algorithm Analysis, part 1 (asymptotic notation)",
	"miniProject": "projects/big-o/big-o-lab",
	"pt": {
		"statement": "...",
		"alternatives": ["...", "...", "...", "...", "..."],
		"explanations": ["...", "...", "...", "...", "..."],
		"snippet": { "kind": "code", "language": "ts", "content": "..." },
		"concept": "...",
		"example": { "kind": "code", "language": "ts", "content": "..." }
	},
	"en": { "...": "same shape, same meaning" },
	"es": { "...": "same shape, same meaning" }
}
```

| Campo | Regla |
| --- | --- |
| `id` | `<area>-<topic>-<nn>`, único en todo el quiz, nunca reutilizado. El navegador guarda el progreso por id |
| `difficulty` | `basic`, `intermediate` o `advanced`. Apunta a 40%, 40% y 20% en cada área |
| `answer` | índice de la alternativa correcta, 0 a 4. Reparte la posición correcta: ningún índice debe tener más de cerca del 30% de un área |
| `source` | el libro o la clase y el capítulo que cubre la pregunta |
| `miniProject` | opcional. Una ruta listada en `mini-projects.json`. Obligatorio cuando el concepto lo muestra un mini-proyecto |
| `alternatives` | exactamente 5, todas distintas, una correcta |
| `explanations` | exactamente 5, en el mismo orden: la explicación `i` dice por qué la alternativa `i` es correcta o incorrecta |
| `concept` | la idea detrás de la pregunta, en dos a cuatro oraciones, legible sin las alternativas |
| `snippet` | código o diagrama de texto opcional que el estudiante debe leer para responder. Se muestra con el enunciado, antes de la respuesta, y va al revisor a ciegas. Presente en los tres idiomas o en ninguno |
| `example` | código opcional (`kind: "code"`, con `language`) o diagrama de texto (`kind: "diagram"`). Presente en los tres idiomas o en ninguno |

## Escribir una buena pregunta

- **Una idea por pregunta.** Si el enunciado necesita "y", probablemente son dos preguntas.
- **El enunciado se sostiene solo.** Un lector que conoce la materia debería poder responder antes de leer las alternativas.
- **Las alternativas incorrectas son concepciones erróneas reales.** Cada distractor es la respuesta de alguien que cometió un error de razonamiento específico: confundir el peor caso con el caso promedio, un mutex con un semáforo, autenticación con autorización. Su explicación nombra ese error. Los rellenos que nadie elegiría no enseñan nada.
- **Exactamente una alternativa es defendible.** Evita "todas las anteriores", "ninguna de las anteriores", y pares que son ambos correctos según la lectura. Indica qué convención se usa cuando la respuesta depende de una (base de un logaritmo, índice desde cero, la implementación de un nivel de aislamiento concreto).
- **El enunciado nunca depende de `example`.** El ejemplo pertenece a la explicación y aparece solo después de la respuesta. Todo lo necesario para responder (un fragmento de código, una tabla, una planificación, un grafo) va en `snippet`, o en el propio enunciado. Un snippet no debe delatar la respuesta.
- **Longitud y forma similares.** La alternativa correcta no debe ser la más larga ni la única precisa.
- **Sin redacción tramposa.** Evita las dobles negaciones, y escribe "NO" o "EXCEPTO" en mayúsculas cuando una pregunta pide el elemento incorrecto.
- **Niveles.** Básico: recordar y reconocer una definición. Intermedio: aplicar el concepto a un caso, calcular, comparar dos ideas. Avanzado: combinar conceptos, encontrar el defecto, razonar sobre un caso límite.
- **Los números se comprueban.** Cada respuesta calculada se resuelve dos veces, y los pasos se incluyen en la explicación o en el concepto.
- **El portugués, el inglés y el español dicen lo mismo.** Escribe los tres al mismo tiempo. Mantén idénticos en todos el código, los identificadores y los términos técnicos establecidos.

## Resumen teórico

Cada página de área muestra, debajo del formulario que empieza el quiz, un resumen teórico que el estudiante lee antes de responder (pedido del dueño, 2026-10-10). Está en `quiz/content/<area>/theory/en.json`, `pt.json` y `es.json`.

```json
{
	"area": "big-o",
	"intro": ["Primer párrafo.", "Segundo párrafo."],
	"sections": [
		{
			"id": "binary-search",
			"title": "Búsqueda binaria",
			"blocks": [
				{ "type": "paragraph", "text": "En una lista ordenada, ábrela por la **mitad**." },
				{ "type": "callout", "tone": "analogy", "text": "Como abrir un diccionario por la mitad." }
			]
		}
	]
}
```

- Empieza con una introducción (`intro`). La app arma el índice a partir de las secciones, y cada entrada apunta a `#<id>`.
- Es completo y está escrito para un principiante, como si el lector tuviera 10 años: analogías de la vida diaria, frases cortas, toda palabra técnica explicada la primera vez que aparece. Cada tema de `coverage.json` se enseña en una sección, y el resumen enseña todas las ideas que preguntan las preguntas, sin citar las preguntas.
- Al menos 3 secciones. El `id` es un slug en inglés, en kebab-case, único en el archivo.
- Los tres idiomas tienen el mismo esqueleto: los mismos ids de sección en el mismo orden y, en cada sección, los mismos tipos de bloque en el mismo orden. Solo cambian las palabras.

| Bloque | Campos | Uso |
| --- | --- | --- |
| `paragraph` | `text` | texto normal |
| `heading` | `text` | subtítulo dentro de una sección |
| `list` | `items`, `ordered` opcional | pasos, propiedades |
| `table` | `headers`, `rows`, `caption` opcional | comparación lado a lado. Cada fila tiene una celda por encabezado |
| `code` | `language`, `content`, `caption` opcional | un ejemplo corto |
| `diagram` | `content`, `caption` opcional | una figura dibujada con texto |
| `callout` | `tone` (`analogy`, `tip`, `warning`, `remember`), `text` | la comparación de la vida diaria, un error común, la frase para recordar |
| `chart` | `title`, `unit` opcional, `bars` (`label`, `value`) | un gráfico de barras. Solo números exactos o derivables, o resultados medidos en este repositorio |
| `video` | `title`, `url` (https) | un enlace a un video, tomado de `REFERENCES.md` o abierto y confirmado por el autor. Es un enlace, no un reproductor embebido |

Dentro de cualquier texto se leen cuatro marcas, y nada más (el HTML queda como texto simple): `**negrita**`, `` `código` ``, `[texto](https://...)` y `[[término|significado]]`, un tooltip que muestra el significado de un término.

`bun run quiz:validate <area>` revisa el formato y el esqueleto. Un resumen ausente es un aviso, y un error con `--strict`. La regla contra copiar también vale aquí.

## Sin copiar

Las preguntas se escriben a partir del mapa de capítulos y del conocimiento de la materia. Nunca copies una oración, un ejercicio o una figura de un libro o una clase. Citar el capítulo en `source` es como la pregunta apunta al material.

## Aceptación de un lote

1. `bun run quiz:validate <area> --strict` pasa: esquema, ids únicos, temas conocidos, objetivos alcanzados.
2. `bun run quiz:blind <area>` exporta `quiz/.review/<area>.blind.json`, sin clave de respuestas ni explicaciones.
3. Un revisor que no escribió las preguntas responde el archivo y guarda `{ "<id>": <index> }`, o `{ "<id>": { "answer": <index>, "note": "..." } }` para marcar una pregunta ambigua.
4. `bun run quiz:compare <area> <answers.json>` escribe `quiz/content/<area>/review.md` con cada discrepancia.
5. Cada discrepancia se resuelve en `review.md` como `key kept`, `key fixed` o `question rewritten`, con el motivo. Una discrepancia nunca se descarta sin un motivo escrito.
