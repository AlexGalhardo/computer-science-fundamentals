# Quiz

The quiz is the main product of the repository. Full design: `docs/en/quiz.md`.

- App in `quiz/`: Next.js with static site generation (SSG) and Tailwind CSS v4, no back end. Progress is stored in the browser.
- Three features are mandatory: i18n in Portuguese and English, a light and dark theme toggle, and a mobile-friendly layout (usable from 320 px wide).
- Theory-only areas (Electronics, Software engineering) have no mini-project: their quiz is the whole deliverable and follows the source book chapter by chapter. Every other area has runnable mini-projects too, and quiz and mini-project link to each other.
- Questions in `quiz/content/<area>/<topic>.json`, validated by a schema.
- Every question has exactly **5 alternatives**, one correct, a difficulty (`basic`, `intermediate`, `advanced`), a `source` (book or lecture and chapter) and, when one exists, the related `miniProject`.
- Every question is written in **Portuguese and English** at the same time.
- The explanation has: the concept and why the right alternative is right, one line for **each** wrong alternative, an optional code example or diagram, and links to the mini-project and the source.
- Screen: one question per screen, two-column grid, question and alternatives on the left, explanation on the right after the answer. Columns stack on a phone.
- Target: at least 100 questions per area (170 for Electronics, 150 for Software engineering), following the coverage map of the area (chapters and topics, with the number of questions for each).
- Questions are written from the chapter map and subject knowledge. Never copy text from the books.
- No question is accepted before both checks pass: the format validation script, and an independent reviewer agent that answers the batch without seeing the answer key. Disagreements are reviewed, not overruled.
- Production order: the app and 5 complete areas first, then waves of 5 areas.
