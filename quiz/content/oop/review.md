# Blind review: oop

- Date: 2026-10-07
- Questions answered without the answer key: 100
- Agreements: 100
- Disagreements: 0

Every disagreement below must end with a resolution: `key kept`, `key fixed` or `question rewritten`, and the reason.

No disagreement.

## Reviewer notes

The reviewer was an independent agent that read only `quiz/.review/oop.blind.json`, ran no code and answered from its own reasoning. It agreed with the key on all 100 questions and flagged two statements.

### oop-inheritance-02

- Reviewer note: "exactly one direct superclass" holds for every class except `java.lang.Object` itself, which has none. The statement did not mention the exception.
- Resolution: **question rewritten**. The statement now asks about a Java class "`Object` itself excepted", and the explanation of the "none or one" distractor names the exception. Key kept.

### oop-streams-io-serialisation-05

- Reviewer note: 6 bytes assumes precomposed characters (NFC) and no byte order mark. In decomposed form (NFD) the word `ação` takes 8 bytes in UTF-8, and 8 is also an alternative.
- Resolution: **question rewritten**. The statement now says that the accented letters are in precomposed form (NFC) and that the file has no byte order mark and no line break, so 6 is the only defensible count. Key kept.

## Checks made by the author before the review

- Every Java fragment with an output was compiled and run on `gradle:9.8.0-jdk25` (JDK 25), and the printed value matched the key: 33 fragments.
- Every fragment whose answer is "does not compile" was given to `javac`, which rejected it for the reason stated in the explanation: 8 fragments. The fixed versions shown in the `example` fields compile.
- Correct position: 20 questions on each index from 0 to 4. The correct alternative is the longest in 13 of the 100 questions in English.
