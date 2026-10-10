# Quiz

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

The main product of this repository: one quiz covering every area of computer science fundamentals. Each question has 5 alternatives, and after the answer the explanation appears next to it: the concept, why the right alternative is right, why each of the others is wrong, an optional example, and links to the mini-project that shows the concept running and to the source.

Design: [docs/en/quiz.md](../docs/en/quiz.md). How to write questions: [docs/en/quiz-authoring.md](../docs/en/quiz-authoring.md).

## Run

The only requirement is Docker.

```sh
./setup-unix-quiz.sh        # Linux and macOS
./setup-windows-quiz.ps1    # Windows
```

The quiz is then at <http://localhost:3000> (set `QUIZ_PORT` to change the port). Stop it with `docker compose down`.

## What it is made of

| Part | Choice | Why |
| --- | --- | --- |
| Framework | Next.js with static site generation (`output: "export"`) | every page is pre-rendered at build time into plain files in `out/` |
| Components | Base UI (`@base-ui/react`), unstyled | the interactive controls (buttons, toggles, selects, the progress meter and the popup of a term) get keyboard use, focus handling and ARIA from the library instead of hand-written code |
| Styles | Tailwind CSS v4, colour tokens per theme | Base UI has no styles: Tailwind gives the look, through tokens only, so light and dark themes share the same components |
| Server | none. A plain static file server (Caddy) serves `out/` | no back end, no API route, no data fetched at run time |
| Content | JSON files in `content/<area>/<topic>.json`, validated with Zod | a broken question fails the build |
| Storage | `localStorage` for progress, `sessionStorage` for the current run | progress stays in the browser, no account |

## Features

- **Three languages.** English, Portuguese and Spanish for the interface and for every question, under `/en/`, `/pt/` and `/es/`. The first visit follows the browser language and the choice is remembered. Switching language in the middle of a question keeps the question, the chosen answer and the explanation.
- **Light and dark theme.** The first visit follows the system preference. The theme is applied before the first paint, so a reload never flashes the other theme.
- **Mobile friendly.** One column below 768 px, with the explanation under the alternatives, and two columns from there up. Usable from 320 px wide, with touch targets of at least 44 by 44 px.
- **Progress** per area, with a reset button.
- **Review only the ones I got wrong.** A question leaves that list when it is answered correctly.
- **Difficulty filter**: basic, intermediate, advanced.
- **Shuffle** of questions and alternatives on every attempt.
- **Keyboard**: keys 1 to 5 or A to E choose an alternative, Enter goes to the next question.

## Structure

```text
quiz/
  content/            questions, coverage maps and the two catalogs
  scripts/            validate, blind and compare (content pipeline)
  src/app/            routes: /[lang], /[lang]/[area], .../quiz, .../result
  src/components/     header, area list and panel, question screen, explanation, result
  src/content/        Zod schemas, repository checks, blind review
  src/i18n/           one typed dictionary per language
  src/lib/            shuffle, run, progress, highlight, build-time content loader
  tests/unit/         schema, shuffle, run, scoring, progress, dictionaries
  tests/e2e/          Playwright flows against the static build
  tests/fixtures/     a small area with three questions, used by the tests
```

## Tests

```sh
./setup-unix-quiz.sh test        # or: ./setup-windows-quiz.ps1 test
```

This builds the site from the test fixture and runs, inside Docker, the unit tests (`bun test`) and the end-to-end tests (`playwright test`): question flow at phone and desktop widths, keyboard-only run, automated accessibility and contrast checks in both themes, language switch in the middle of a question, progress, review mode, difficulty filter, and no horizontal overflow at 320, 390, 768 and 1280 px.

## Content commands

Run from the repository root, with Bun installed:

```sh
bun run quiz:validate [area] [--strict]      # schema, unique ids, topics and targets
bun run quiz:blind <area>                    # export questions without the answer key
bun run quiz:compare <area> <answers.json>   # write review.md with the disagreements
```

## Local development

```sh
bun install
cd quiz
bun run dev          # http://localhost:3000
bun run build        # static site in out/
bun test tests/unit
```
