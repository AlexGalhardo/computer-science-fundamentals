# Quiz

The quiz is the main product of the repository. Full design: `docs/en/quiz.md`.

- App in `quiz/`: Next.js with static site generation (SSG), Base UI (`@base-ui/react`) for the interactive components and Tailwind CSS v4 for the styling, no back end. Progress is stored in the browser.
- Interactive controls (buttons, toggles, selects, meters, popups) are Base UI components styled with Tailwind classes built from the theme tokens of `quiz/src/app/globals.css`, never a raw colour and never a hand-rolled widget (owner's decision, 2026-10-10). Links stay links, and static markup is not wrapped in Base UI.
- Three features are mandatory: i18n in English, Portuguese and Spanish, a light and dark theme toggle, and a mobile-friendly layout (usable from 320 px wide).
- Theory-only areas (Electronics, Software engineering) have no mini-project: their quiz is the whole deliverable and follows the source book chapter by chapter. Every other area has runnable mini-projects too, and quiz and mini-project link to each other.
- Questions in `quiz/content/<area>/<topic>.json`, validated by a schema.
- Every question has exactly **5 alternatives**, one correct, a difficulty (`basic`, `intermediate`, `advanced`), a `source` (book or lecture and chapter) and, when one exists, the related `miniProject`.
- Every question is written in **English, Portuguese and Spanish** at the same time (blocks `en`, `pt`, `es`). The schema refuses a question with a missing language.
- The explanation has: the concept and why the right alternative is right, one line for **each** wrong alternative, an optional code example or diagram, and links to the mini-project and the source.
- Screen: one question per screen, two-column grid, question and alternatives on the left, explanation on the right after the answer. Columns stack on a phone.
- Target: at least 100 questions per area (170 for Electronics, 150 for Software engineering), following the coverage map of the area (chapters and topics, with the number of questions for each).
- Questions are written from the chapter map and subject knowledge. Never copy text from the books.
- No question is accepted before both checks pass: the format validation script, and an independent reviewer agent that answers the batch without seeing the answer key. Disagreements are reviewed, not overruled.
- Production order: the app and 5 complete areas first, then waves of 5 areas.

## Lessons from the first waves (2026-10-07)

- **A statement never depends on `example`.** The example belongs to the explanation and is shown only after the answer. Code, tables, graphs or schedules needed to answer go in `snippet` (shown with the statement and exported to the blind reviewer) or in the statement itself. The first blind review caught 23 questions that broke this.
- **Correct index**: spread it evenly and pseudo-randomly over 0 to 4. A fixed rotation (+1 per question) is a pattern a student can learn. Do not put numeric answers always in the middle.
- **Length**: the correct alternative must not be the longest more often than chance (about 20%).
- **State the convention** whenever the answer depends on one: who counts the first round-trip, whether the root is black, SQL standard against a product.
- **Blind review**: `bun run quiz:blind <area>`, a reviewer that reads only `quiz/.review/<area>.blind.json`, `bun run quiz:compare <area> <answers>`, and every disagreement and reviewer note resolved in `review.md`. A reviewer note with no disagreement still gets a resolution.
- After content changes run `bun run docs:index`, which CI checks.
