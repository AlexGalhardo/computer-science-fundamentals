# Quiz authoring guide

> Versão em português: [docs/pt/quiz-authoring.md](../pt/quiz-authoring.md)

How to write a question for the quiz, and how a batch is accepted. The design of the quiz is in [quiz.md](quiz.md).

## Files

```
quiz/content/
  areas.json            the 31 areas (slug, names, target)
  mini-projects.json    the 78 mini-projects (path, status)
  <area>/
    coverage.json       topics of the area, source and target count per topic
    <topic>.json        a JSON list of questions of that topic
    review.md           log of the blind review
```

The file name is the topic slug, and it must exist in `coverage.json`.

## Coverage map

```json
{
	"area": "big-o",
	"sources": ["USP Algorithm Analysis lectures, parts 1 and 2"],
	"topics": [
		{
			"slug": "asymptotic-notation",
			"name": { "en": "Asymptotic notation", "pt": "Notação assintótica" },
			"source": "USP Algorithm Analysis, part 1",
			"target": 15
		}
	]
}
```

The topics and the targets come from the table of the area in `PLAN.md`. The targets add up to the target of the area.

## Question

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
		"concept": "...",
		"example": { "kind": "code", "language": "ts", "content": "..." }
	},
	"en": { "...": "same shape, same meaning" }
}
```

| Field | Rule |
| --- | --- |
| `id` | `<area>-<topic>-<nn>`, unique in the whole quiz, never reused. The browser stores progress by id |
| `difficulty` | `basic`, `intermediate` or `advanced`. Aim for 40%, 40% and 20% in each area |
| `answer` | index of the correct alternative, 0 to 4. Spread the correct position: no index should hold more than about 30% of an area |
| `source` | the book or lecture and the chapter the question covers |
| `miniProject` | optional. A path listed in `mini-projects.json`. Required when the concept is shown by a mini-project |
| `alternatives` | exactly 5, all different, one correct |
| `explanations` | exactly 5, in the same order: explanation `i` says why alternative `i` is right or wrong |
| `concept` | the idea behind the question, in two to four sentences, readable without the alternatives |
| `example` | optional code (`kind: "code"`, with `language`) or text diagram (`kind: "diagram"`). Present in both languages or in neither |

## Writing a good question

- **One idea per question.** If the statement needs "and", it is probably two questions.
- **The statement stands alone.** A reader who knows the subject should be able to answer before reading the alternatives.
- **Wrong alternatives are real misconceptions.** Each distractor is the answer of someone who made a specific reasoning mistake: confusing the worst case with the average, a mutex with a semaphore, authentication with authorisation. Its explanation names that mistake. Fillers nobody would pick teach nothing.
- **Exactly one alternative is defensible.** Avoid "all of the above", "none of the above", and pairs that are both right depending on the reading. Say which convention is used when the answer depends on one (base of a logarithm, zero-based index, a specific isolation level implementation).
- **Similar length and form.** The correct alternative must not be the longest or the only precise one.
- **No trick wording.** Avoid double negatives, and write "NOT" or "EXCEPT" in capitals when a question asks for the wrong item.
- **Levels.** Basic: recall and recognise a definition. Intermediate: apply the concept to a case, compute, compare two ideas. Advanced: combine concepts, find the flaw, reason about an edge case.
- **Numbers are checked.** Every computed answer is worked out twice, and the worked steps go in the explanation or in the concept.
- **Portuguese and English say the same thing.** Write both at the same time. Keep code, identifiers and established technical terms identical in both.

## No copying

Questions are written from the chapter map and from knowledge of the subject. Never copy a sentence, an exercise or a figure from a book or lecture. Citing the chapter in `source` is how the question points at the material.

## Acceptance of a batch

1. `bun run quiz:validate <area> --strict` passes: schema, unique ids, known topics, targets reached.
2. `bun run quiz:blind <area>` exports `quiz/.review/<area>.blind.json`, without answer key and explanations.
3. A reviewer who did not write the questions answers the file and saves `{ "<id>": <index> }`, or `{ "<id>": { "answer": <index>, "note": "..." } }` to flag an ambiguous question.
4. `bun run quiz:compare <area> <answers.json>` writes `quiz/content/<area>/review.md` with every disagreement.
5. Each disagreement is resolved in `review.md` as `key kept`, `key fixed` or `question rewritten`, with the reason. A disagreement is never overruled without a written reason.
