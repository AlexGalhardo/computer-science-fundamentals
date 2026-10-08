# Blind review: software-architecture

- Date: 2026-10-08
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

Three independent reviewer agents took part, none of which saw the answer key, the explanations or the repository:

1. The English export of `quiz:blind`, all 100 questions: 100 agreements, 7 notes.
2. The Portuguese export (`quiz:blind software-architecture --lang pt`), all 100 questions: 100 agreements, 13 notes. This pass exists because the default export is English only, so the first reviewer could not judge the Portuguese text.
3. After the edits below, a third reviewer answered the 8 questions whose statement or alternatives had changed: 8 agreements, no note. The result above is the comparison of the first reviewer's answers, with these 8 replaced by the third reviewer's, against the final key.

No reviewer claimed a wrong key. Every note and its resolution:

- `software-architecture-interface-adapters-10` (both reviewers): alternative 3, the interface adapters layer, matches Martin's original text, which keeps gateways and SQL in that layer. Resolution: **key kept**. The statement asks explicitly about the layering presented by Otávio Lemos, where an adapter that talks directly to an external library goes to the outermost layer. The explanation of alternative 3 now says that the authors differ and why the statement fixes the answer.
- `software-architecture-event-driven-cqrs-04` (both reviewers): recording the `eventId` is only correct when it happens in the same transaction as the `UPDATE`. Resolution: **question rewritten**. The correct alternative now says "in the same transaction as the UPDATE", in both languages. The key did not change.
- `software-architecture-clean-architecture-dependency-rule-09`, `software-architecture-interface-adapters-06`, `software-architecture-entities-use-cases-05` (both reviewers): three near-duplicates asking what crosses the boundary into a use case. Resolution: **question rewritten** for `clean-architecture-dependency-rule-09`, which now asks what "independence of frameworks" means, a sub-topic of the coverage map that had no question. The key index did not change. The other two are kept: one is asked from the side of the controller, the other from the side of the use case that defines the DTO.
- `software-architecture-entities-use-cases-06`, `-07` and `software-architecture-interface-adapters-08` (both reviewers): the limit of `Title` was 256 characters in two questions and 100 in the third. Resolution: **question rewritten**. All three now use 80 characters, the limit of the mini-project. No key changed.
- `software-architecture-architecture-quality-attributes-08` (both reviewers): the correct alternative was the only one with an example in parentheses. Resolution: **question rewritten**. The parentheses became a plain clause ("such as loans or payroll"). It is still the longest alternative of that question, which is intended: see the authoring pass below.
- `software-architecture-trade-offs-adrs-05` (Portuguese reviewer): Nygard's format has no section for alternatives, and "Status: aceita" reads better as "aceito". Resolution: **key kept**. The explanation of the correct alternative now says where the rejected alternatives and the downsides go in that format, and the Portuguese snippets of the three ADR questions use "aceito" and "substituído".
- `software-architecture-clean-architecture-dependency-rule-14` and `software-architecture-interface-adapters-04` (Portuguese reviewer): awkward Portuguese in one alternative each. Resolution: **question rewritten**. Both alternatives were reworded (the second one in English too, to keep the two languages equal). No key changed.
- `software-architecture-architecture-quality-attributes-06`, `software-architecture-domain-driven-design-05`, `software-architecture-layered-hexagonal-02`, `software-architecture-architecture-quality-attributes-10` (Portuguese reviewer): inconsistent spelling, "on-line" against "online" and "back end" against "back-end". Resolution: **question rewritten**. The area now uses "online", "back-end" and "front-end" everywhere.

After these edits `bun run quiz:validate software-architecture --strict` ran again with 0 errors and 0 warnings.

## Authoring pass before the review

The first draft followed "the correct alternative must not be the longest" too well: it was never the longest and was the shortest of the five in 46 of the 100 English questions, which is a tell in the other direction. 42 questions were reworded, without changing any key, so that the length rank of the correct alternative looks random. In the final English text it is the longest in 21 questions, second in 21, third in 20, fourth in 24 and the shortest in 14. The correct index is 20 questions for each position, drawn pseudo-randomly.

Limits of this review: the reviewers are language models of the same family as the authors, so a shared misconception would not show up as a disagreement. The Portuguese reviewer answered the first version of `clean-architecture-dependency-rule-09`; the rewritten version was checked in English only.
