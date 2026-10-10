# Blind review: software-engineering

- Date: 2026-10-10
- Questions answered without the answer key: 150
- Agreements: 150
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

<!-- quiz:compare keeps everything below this line -->

## How the review was run

One round, in English, by a fresh reviewer agent that received only the blind file (`bun run quiz:blind software-engineering`) and never saw `quiz/content/`.

| Round | Blind file | Result |
| --- | --- | --- |
| 1 | `quiz/.review/software-engineering.blind.json` (English) | 150 answered, 0 disagreements, 15 questions flagged with a note |

The fixes below were made after the round. None changes a key or the position of a correct alternative. Every change was made in English, Portuguese and Spanish. `bun run quiz:validate software-engineering` passes after them with no warning.

## Notes raised by the reviewer and their resolution

| Question | Note | Resolution |
| --- | --- | --- |
| `software-engineering-agile-lean-startup-07` | The correct alternative is the only one that stacks three warning signs (safety-critical, distributed teams, regulator) | question rewritten: the correct alternative now has one situation (a safety-critical system whose documentation a regulator must approve) and is no longer the longest. The explanation follows it. Key kept |
| `software-engineering-agile-lean-startup-10` | The correct alternative is much longer and the only rate; the four distractors are cumulative totals | question rewritten: the correct alternative lost its tail ("compared before and after the change", which the statement already implies). The distractor about cumulative page views became a rate too, the share of all users since launch who have ever paid, which is wrong because it blends every cohort. Key kept |
| `software-engineering-architectural-design-08` | `architectural-design-03` states the maintainability half of this answer and its distractor 1 states the performance half | question rewritten: it no longer asks why the two requirements conflict. It now asks what Sommerville suggests when both are critical (a compromise, for example different architectural styles for different parts), with five new alternatives. `architectural-design-03` did not change and no longer gives this one away. Key kept at the same position |
| `software-engineering-brooks-11` | The correct alternative is the longest and the only hedged, precise one; the distractors are absolute claims | question rewritten: the correct alternative is shorter (one tenfold gain in productivity within a decade), and three distractors now use the same form of claim (object-oriented programming within a decade, formal verification and reliability, accidental difficulties and better tools). Key kept |
| `software-engineering-brooks-12` | "Changing over time" in the statement also points to changeability | question rewritten: the phrase was removed from the statement, and the explanation of "Changeability" no longer says it is part of the case. Key kept |
| `software-engineering-design-implementation-clean-code-06` | Edition dependent: the 9th edition lists three activities in the implementation chapter, and release management as a fourth appears in the 10th | question rewritten: the statement no longer gives a count ("Sommerville describes fundamental configuration management activities"), and the concept says that the count differs between editions. The answer is the same in both editions. Key kept |
| `software-engineering-design-implementation-clean-code-15` | "Readable" is not a F.I.R.S.T. property, so it can be discarded without reading the scenario | question rewritten: the distractor is now "Repeatable". To keep one defensible answer, the statement says that the behaviour is the same on every machine and that the test always fails when run alone, so the result does not depend on the environment, which is what Repeatable is about. Key kept |
| `software-engineering-process-models-06` | Edition dependent: "requirements modification" belongs to the reuse-oriented model of the 9th edition | question rewritten: the statement now says "(9th edition)". Key kept |
| `software-engineering-process-models-14` | Sommerville says incremental delivery supports both change avoidance and change tolerance | question rewritten: the statement now asks which strategy the effect described in each practice illustrates, and practice (1) states its effect too. The explanation of "both are change avoidance" and the concept say that the book gives incremental delivery as support for both. Key kept |
| `software-engineering-project-management-estimation-01` | The developer has already announced she is leaving, which makes "an issue, no longer a risk" defensible | question rewritten: the statement is now a possibility noted while planning (the developer may leave before the end). The distractor that depended on the old wording became "not a risk yet, because a risk is recorded only after the event has happened", the reverse confusion between a risk and a problem. Key kept |
| `software-engineering-project-management-estimation-13` | The correct alternative is the only one with the approximation sign | question rewritten: the statement asks for the factor "to two decimal places" and the five alternatives have the same form (2.00, 2.20, 2.14, 1.10, 4.00). Worked again: 2^1.1 = 2.1435. Key kept |
| `software-engineering-quality-configuration-management-05` | The correct alternative is by far the longest and the only nuanced one | question rewritten: the correct alternative is shorter and no longer the longest (complexity is only an internal proxy for maintainability, and rewards invite gaming). The explanation keeps the full reasoning. The distractors were kept: softer versions of them would be defensible weaknesses too. Key kept |
| `software-engineering-requirements-engineering-12` | The pair with `requirements-engineering-06` does not give each other away; the phrase "design checks for each requirement" is close to a definition of the answer | question rewritten for the second part: the statement is now a case (a specification says "the system shall respond quickly" and nobody can say how that would be checked) and no longer describes the technique. For the first part, key kept: the two questions share terms only |
| `software-engineering-simplicity-technical-debt-10` | Answer holds. The statement should say that the 8 days of replacement are in addition to the shortcut, and the explanation should stress the "retired after 6 changes" condition | question rewritten: the statement now says "on top of the work already spent on the shortcut", and the explanation of the correct alternative says that the result holds only because the module is retired after 6 changes. The numbers of the reviewer match ours (3, 5, 8 and 9.5 days of extra cost). Key kept |
| `software-engineering-uml-modelling-10` | The correct alternative is the longest and the only qualified one; the distractors are absolute impossibility claims | question rewritten: the correct alternative is shorter (the cost of translators moved to the explanation), and the distractor "generated systems cannot be tested by any technique" became "code generated from models is usually too slow for business systems", a plausible claim that is not the reason the book gives. Key kept |

## Source citations

The question writer cited chapter and section numbers from memory in the two newest topic files. They were checked on 2026-10-10.

Made less specific in `testing-evolution-maintenance.json`: the chapter numbers of Sommerville, 9th edition (8, Software testing, and 9, Software evolution) are sure, but no table of contents of the 9th edition with section numbers could be opened on the web (the publisher lists only the 10th edition). The section numbers were removed and the section titles kept.

| Question | Before | Now |
| --- | --- | --- |
| `testing-evolution-maintenance-02` | ch. 8.1 (Development testing) | ch. 8 (Development testing) |
| `testing-evolution-maintenance-03` | ch. 8.2 (Test-driven development) | ch. 8 (Test-driven development) |
| `testing-evolution-maintenance-04` | ch. 9.3 (Software maintenance: types of maintenance) | ch. 9 (Software maintenance: types of maintenance) |
| `testing-evolution-maintenance-05` | ch. 8.1 and 8.2 (regression testing and test automation) | ch. 8 (regression testing and test automation) |
| `testing-evolution-maintenance-06` | ch. 8.1.2 (Choosing unit test cases: partition testing and guidelines) | ch. 8 (Development testing: choosing unit test cases, partition testing and guidelines) |
| `testing-evolution-maintenance-07` | ch. 9.2 (Program evolution dynamics: Lehman's laws) | ch. 9 (Program evolution dynamics: Lehman's laws) |
| `testing-evolution-maintenance-08` | ch. 8.3 (Release testing) | ch. 8 (Release testing) |
| `testing-evolution-maintenance-09` | ch. 9.4 (Legacy system management) | ch. 9 (Legacy system management) |
| `testing-evolution-maintenance-10` | ch. 9.3.2 (Software reengineering) and 9.3.3 (Preventative maintenance by refactoring) | ch. 9 (Software maintenance: software reengineering and preventative maintenance by refactoring) |
| `testing-evolution-maintenance-11` | ch. 8.1 (Development testing: unit testing and coverage of the code) | ch. 8 (Development testing: unit testing and coverage of the code) |
| `testing-evolution-maintenance-12` | ch. 9.3 (Software maintenance: why maintenance costs more than development) | ch. 9 (Software maintenance: why maintenance costs more than development) |

`testing-evolution-maintenance-01` had no section number and did not change. `design-implementation-clean-code-06`, rewritten above, lost its section number for the same reason: "ch. 7.3.2" is now "ch. 7 (Implementation issues: configuration management)".

Corrected in `simplicity-technical-debt.json`: the chapter numbers of Code Simplicity were wrong by one, and one chapter title did not exist. They were checked against the table of contents of the free edition published by the author (<https://www.codesimplicity.com/book/>): 1 Introduction, 2 The Purpose of Software, 3 The Future, 4 Change, 5 Defects and Design, 6 Simplicity, 7 Complexity, 8 Testing.

| Question | Before | Now |
| --- | --- | --- |
| `simplicity-technical-debt-03` | ch. 7 (Simplicity: the law of simplicity) | ch. 6 (Simplicity: the Law of Simplicity) |
| `simplicity-technical-debt-04` | ch. 3 (The driving forces of software design) | ch. 2 (The Purpose of Software) |
| `simplicity-technical-debt-05` | ch. 4 (The future: the equation of software design) | ch. 3 (The Future: the Equation of Software Design) |
| `simplicity-technical-debt-06` | ch. 5 (Change: the three flaws) | ch. 4 (Change: the three flaws) |
| `simplicity-technical-debt-07` | ch. 6 (Defects and design: the law of defect probability) | ch. 5 (Defects and Design: the Law of Defect Probability) |

The citations of Clean Code, chapter 1, in the same file name parts of the chapter and carry no section number, so they were kept. `coverage.json` still says "Code Simplicity, ch. 3 to 7" for this topic and should say "ch. 2 to 6". It was outside the scope of this review and is left to the main session.

## Questions changed after the round

The reviewer did not see these in their new form.

- What is asked or what an alternative says changed: `agile-lean-startup-10`, `architectural-design-08`, `brooks-11`, `design-implementation-clean-code-15`, `project-management-estimation-01`, `uml-modelling-10`.
- The statement was tightened or the correct alternative shortened, with no new claim: `agile-lean-startup-07`, `brooks-12`, `design-implementation-clean-code-06`, `process-models-06`, `process-models-14`, `project-management-estimation-13`, `quality-configuration-management-05`, `requirements-engineering-12`, `simplicity-technical-debt-10`.

## Second round (rewritten questions only)

The questions rewritten after the first round were exported again (`bun run quiz:blind software-engineering`) and the 15 of them went to a fresh reviewer agent that received only those questions, with no answer key and no access to `quiz/content/`. Its answers replaced the first-round answers of the same ids in `quiz/.review/software-engineering.answers.json`, and `bun run quiz:compare` was run again: 150 questions, 0 disagreements.

| Question | Note of the second reviewer | Resolution |
| --- | --- | --- |
| `software-engineering-requirements-engineering-12` | Test-case generation is the best of the five, but a requirements review with a verifiability check would expose the vague requirement just as directly, so "the one most likely" overstates it | question rewritten: the statement now asks which of these techniques exposes the requirement, without the superlative. Wording only, key kept, same three languages |
| `software-engineering-project-management-estimation-01` | No note. The reviewer was less sure because "the usual classification" does not say which of Sommerville's two risk taxonomies is meant | key kept: the alternatives name project, product and business risks, which is the classification by what the risk affects, and the explanation says so |
