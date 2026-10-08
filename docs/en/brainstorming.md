# Brainstorming record

> Versão em português: [docs/pt/brainstorming.md](../pt/brainstorming.md)

> Note (2026-10-08): the `references/` folder mentioned in this document was removed from the tree and remains in the git history (`git show eef7847:references/<path>`). Study references are in [REFERENCES.md](../../REFERENCES.md).

Record of the questions asked in the Phase 2 brainstorming, on 2026-10-07, with the chosen option and the discarded ones. The consolidated decisions are in [decisions.md](decisions.md), the quiz design in [quiz.md](quiz.md) and the backlog in [mini-project-catalog.md](mini-project-catalog.md).

## Context used

- Code, notes and two legacy projects imported into `references/`.
- Summaries of 254 PDFs (books, articles and lectures) in `references/summaries/`. Long books were summarised from a sample of the text.
- One scanned PDF (Modern Operating Systems, 3rd edition) could not be read and was deleted; the 4th edition of the same book is summarised.

## Round 1: repository structure

| Question | Choice | Discarded options |
| --- | --- | --- |
| Folder layout | By area: `projects/<area>/<mini-project>/` | By language; flat list |
| Languages per mini-project | TypeScript reference plus the ones that change the lesson | Always all 7; one per mini-project |
| Environment | Everything in Docker | Local toolchain; both paths |
| Benchmarks | JSON contract + hyperfine | Own runner; native tool of each language |
| Dashboards | Static page per mini-project | One Next.js site; CLI only |
| Legacy projects | Rebuild as new mini-projects | Port and adapt; reference only |
| README and comments | Two files + one comment block per concept | One file; line-by-line comments |
| Images in `references/images/` | Remove from git | Keep; keep only the owner's own |
| Compilers | Interpreter + bytecode VM | Up to WebAssembly; up to native code; front end only |
| Design patterns | Selection of about 10 back-end patterns | Full GoF catalogue; only inside other mini-projects |
| Security labs | One isolated lab per flaw | One app with every flaw; both |
| Observability | OpenTelemetry + Prometheus, Grafana, Loki, Tempo | OpenTelemetry + Jaeger + Prometheus; console output only |
| Extra areas | All eight: cache, rate limiter, file systems, digital logic, networks, operating systems, blockchain, CI | none discarded |
| First wave of mini-projects | Mix of areas: sorting, race condition, SQL injection, lexer + parser, queues | Web back-end focus; classic computer science focus |
| Order after the first wave | Breadth first | Depth first; choose at each wave |

## Round 2: quiz

After reading the PDFs, the main idea became a quiz: questions with 5 alternatives and, after the answer, the explanation of the concept, in a two-column grid (question on the left, explanation on the right).

| Question | Choice | Discarded options |
| --- | --- | --- |
| Role of the quiz | Central quiz + mini-projects | Quiz first and mini-projects later; quiz only; one quiz per mini-project |
| Screen | One question per screen | Scrollable list with a fixed panel; question per screen with a side map |
| Technology | Next.js with static export | Plain HTML; Next.js + API + database |
| Explanation content | All four items: concept, why each wrong one is wrong, code example or diagram, link to mini-project and source | none discarded |
| Volume | At least 100 questions per area, aiming to cover the whole content of the books (owner's answer) | 10, 20 or 30 per area; variable |
| Language | PT and EN from the start | PT first; PT only |
| New areas | All four: electronics, software architecture, databases (theory), software engineering | none discarded |
| Features | All four: saved progress, review wrong ones, difficulty level, shuffling | none discarded |
| Source of the questions | Chapter map + own knowledge | Put the PDF back for each area; mixed |
| Production | App + 5 complete areas, then waves of 5 | All areas with 20 and then complete; everything at once |
| Review | Independent reviewer + automatic validation | Format validation only; the owner reviews everything |

## Round 3: instructions for the final plan

Given by the owner when asking for the final `PLAN.md`.

| Topic | Instruction |
| --- | --- |
| Theory-only content | A very complete web quiz covering every aspect of the content, no mini-project. Applied to Electronics and Software engineering |
| Technical content | Runnable practical examples (Docker, shell scripts, CLI or web) plus the quiz, one complementing the other. Applied to the other 29 areas |
| Quiz features | i18n in Portuguese and English, light and dark theme toggle, mobile friendly, built with Next.js SSG and Tailwind CSS v4 |
| First 5 quiz areas | Big O and algorithm analysis, data structures, operating systems, networks, databases (theory) |

## Ideas added by the summaries

They went into the mini-project catalog, in the section "Ideas from the books and lectures".

- **Operating systems:** CPU scheduling simulator, paging and TLB, memory allocator, deadlock detector with the banker's algorithm, mini shell.
- **Networks:** sliding window over a lossy channel, mini TCP over UDP, ALOHA and CSMA/CD, DNS resolver, subnet calculator.
- **Databases:** mini DBMS with joins, normalisation tool, external sorting, on-disk indexes.
- **Compilers:** garbage collector, optimisations over three-address code, blocked matrix multiplication.
- **Algorithm analysis:** interactive master theorem, the Ω(n lg n) bound, hybrid quicksort.
- **Digital logic and electronics:** Karnaugh, NAND-only ALU, 4-bit mini CPU, circuit calculators.
- **Testing and design:** money kata, mini xUnit, code smell catalogue, clean architecture application.

## Open points

None. The first 5 quiz areas and the coverage map of every area are in `PLAN.md`.
