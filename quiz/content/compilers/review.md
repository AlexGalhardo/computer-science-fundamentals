# Blind review: compilers

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer, an agent that did not write the questions, read only `quiz/.review/compilers.blind.json` and agreed with the key on all 100 questions. It flagged seven questions as improvable. None had a second defensible alternative. Each note is resolved below.

| Question | Note of the reviewer | Resolution |
| --- | --- | --- |
| `compilers-code-generation-04` | The answer relies on `*` binding tighter than `−`, which the statement did not say | **question rewritten**: the statement now says "with the usual precedence (* before −)", in both languages. Key unchanged |
| `compilers-parallelism-and-locality-02` | The pair (1)/(4) is dependent only through an antidependence, and the statement did not say which kinds of dependence count | **question rewritten**: the statement now says that true dependences, antidependences and output dependences all count, in both languages. Key unchanged |
| `compilers-parallelism-and-locality-03` | Same point: alternative 2 is excluded only by a loop-carried antidependence | **question rewritten**: same sentence added to the statement, in both languages. Key unchanged |
| `compilers-run-time-environments-09` | The explanation should say that the cycle E/F was already garbage and is never freed by reference counting | **question rewritten** (explanation only): the explanation of the correct alternative now says so, in both languages. Key unchanged |
| `compilers-intermediate-code-generation-03` | Alternative 0 (renaming) is true of SSA form, though not of the φ-function | **key kept**: the statement asks for the role of the φ-function, and the explanation of alternative 0 already says that renaming defines SSA but happens at the assignments |
| `compilers-intermediate-code-generation-04` | The statement gives the definition and asks only for the name, so elimination is easy | **key kept**: it is a `basic` question, whose level is recalling a definition. The distractors are the neighbouring terms students mix up (cast, inference, synthesis, overloading) |
| `compilers-lexical-analysis-10` | Correct with the O(n·r) bound of the source; a naive simulation that costs O(r²) per character has no matching alternative | **key kept**: the statement fixes the model (an NFA with O(r) states and transitions, simulated while keeping the set of current states), which is the O(n·r) algorithm, and the explanation justifies the bound |

## Notes of the authors, checked after the review

The authors of the batches flagged these questions as the most likely to cause disagreement. The reviewer agreed with the key on all of them, and each was read again:

- `compilers-run-time-environments-11`: alternative 2 (a full collection on every write) would be correct but is excluded by "without tracing the old generation" in the statement. **key kept**.
- `compilers-syntax-analysis-14`: alternatives 1 and 2 generate the same language but do not remove the common prefix, and the statement asks for the correct result of left factoring. **key kept**.
- `compilers-syntax-analysis-16`: "merging LALR states creates reduce/reduce but not shift/reduce conflicts" holds because the statement assumes a conflict-free canonical LR(1) table. **key kept**.
- `compilers-syntax-directed-translation-08`, `compilers-intermediate-code-generation-09`, `compilers-lexical-analysis-09`, `compilers-machine-independent-optimisations-09`: worked answers recomputed by hand (7 against 3, truelist {100, 102} and falselist {103}, 9 states, natural loop {B2, B3, B5}). **key kept**.

## Limits of this review

- The blind export holds the English text only, so the reviewer could not compare the Portuguese and English versions. Both were written together by the same author, question by question, and the validator checks that both have the same shape (5 alternatives, 5 explanations, snippet and example in both or in neither).
- The 100 questions were written by three author agents, one group of topics each, from a shared brief: same rules, difficulty split and answer positions drawn in advance. The reviewer was a fourth agent.
