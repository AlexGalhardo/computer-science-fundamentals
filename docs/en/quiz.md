# Quiz

> Versão em português: [docs/pt/quiz.md](../pt/quiz.md)

The quiz is the front door of the repository: one app covering every area. The mini-projects stay in the plan, and the explanation of each question points to the mini-project that demonstrates the concept. Decisions taken on 2026-10-07.

## Question format

- Multiple choice with **5 alternatives** and a single correct one.
- After the answer, the explanation of the concept appears next to it.
- Every question has a level: basic, intermediate or advanced.
- Every question exists in Portuguese and in English from the start.

## Screen

One question per screen, in a two-column grid. On a phone the columns stack.

```
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

## What the explanation contains

1. The concept and why the correct alternative is correct.
2. One line for each wrong alternative, pointing at the reasoning mistake.
3. A code example or diagram, when it helps.
4. A link to the mini-project that demonstrates the concept and to the source (summary or book chapter).

## Required features

- **i18n**: the whole app, interface and questions, in Portuguese and English, with a language selector.
- **Light and dark theme**, with a toggle. The first visit follows the system preference.
- **Mobile friendly**: usable from 320 px wide, with touch-sized controls.

## Other features of the first version

- Progress saved in the browser, with right and wrong answers per area.
- "Review only the ones I got wrong" mode.
- Filter by difficulty level.
- Questions and alternatives shuffled on every attempt.

## Technology

- Next.js with static site generation (SSG, every page pre-rendered at build time) and Tailwind CSS v4, no back end.
- The app lives in `quiz/`, at the repository root.
- Questions live in JSON files, in `quiz/content/<area>/<topic>.json`, validated by a schema.

Fields of each question:

| Field | Content |
| --- | --- |
| `id` | stable identifier, for example `big-o-binary-search-01` |
| `area`, `topic` | area and topic |
| `difficulty` | `basic`, `intermediate` or `advanced` |
| `answer` | index of the correct alternative (0 to 4) |
| `source` | book or lecture and chapter the question covers |
| `miniProject` | path of the related mini-project, when there is one |
| `pt`, `en` | for each language: statement, 5 alternatives, 5 explanations (one per alternative), concept and optional example |

## Volume and coverage

- **At least 100 questions per area**, aiming to cover the whole content of the books and lectures. There are 31 areas and 3,220 questions planned.
- **Theory-only areas** (Electronics with 170 questions, Software engineering with 150) have no mini-project, so their quiz is larger and follows the source book chapter by chapter.
- **Theory-and-practice areas** (the other 29) have runnable mini-projects as well. Quiz and mini-project complement each other: the explanation links to the mini-project, and the mini-project README lists the quiz topics it demonstrates.
- Each area has a **coverage map**: the list of chapters and topics of the books and lectures of that area, with the number of questions covering each one.
- Questions are written from the chapter map and from knowledge of the subject, not from a page-by-page reading: the PDFs are not in the repository and the summaries of long books were made from a sample of the text. Each question cites the chapter it covers.

## Production

1. First the quiz app and 5 complete areas, with 100 questions each, to validate format and quality.
2. Then the remaining areas in waves of 5.

## Quality assurance

- **Automatic validation**: a script checks that every question has 5 alternatives, exactly one correct, an explanation for each alternative, and the texts in PT and EN.
- **Independent reviewer**: a second agent answers each batch without seeing the answer key. Every disagreement is reviewed before the question is accepted.
- **Owner review** by sampling.
