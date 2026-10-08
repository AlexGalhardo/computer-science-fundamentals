# code-smells

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

An executable catalogue of code smells. Each entry has a `before` version that works and smells, an `after` version with the smell removed, and **one test suite that runs on both**. It teaches **how to recognise common smells and remove them without changing behaviour**: the tests that pass before the refactoring are the same tests that pass after it.

Full explanation: [docs/en/oop/code-smells.md](../../../docs/en/oop/code-smells.md).

## The catalogue

| Smell | The symptom in `before` | Refactoring in `after` | Language |
| --- | --- | --- | --- |
| [Long Method](ts/src/long-method) | one function validates, computes and formats, split by comments | Extract Method | TypeScript |
| [God Class](ts/src/god-class) | one class holds stock, prices, order numbers, e-mails and the report | Extract Class | TypeScript |
| [Feature Envy](ts/src/feature-envy) | a printer that only reads other objects, three dots deep | Move Method | TypeScript |
| [Shotgun Surgery](ts/src/shotgun-surgery) | the money format is copied in three modules | one module owns the knowledge | TypeScript |
| [Primitive Obsession](ts/src/primitive-obsession) | e-mail and phone are strings, checked again in every function | small types (value objects) | TypeScript, Java |
| [Conditional chain on a type code](ts/src/conditional-to-polymorphism) | the same `if / else if` on the delivery kind in three files | Replace Conditional with Polymorphism | TypeScript, Java |

TypeScript is the reference and has all six. Java repeats the two entries where the language changes the lesson: its types are nominal, so two records that each hold one `String` are different types with no extra work, and the compiler rejects swapped arguments; and `enum` plus `interface` are the idiomatic pair for the conditional example.

## Quiz topics it demonstrates

- `oop` / `coupling-cohesion-code-smells`: cohesion, what a code smell is, God Class, Feature Envy, Shotgun Surgery, Primitive Obsession, Long Method and Extract Method.
- `oop` / `polymorphism-dynamic-dispatch`: replacing a conditional chain with one class per variant, so that a new variant is new code and not an edit.

## Run

The only requirement is Docker.

```sh
./setup-unix-code-smells.sh        # Linux and macOS
./setup-windows-code-smells.ps1    # Windows
```

The script builds the two images (type check, format check and a negative compile test happen during the build), runs the tests of both languages and prints the catalogue.

## Structure

| Path | What it is |
| --- | --- |
| `ts/src/<smell>/contract.ts` | the behaviour both versions must have, as a type |
| `ts/src/<smell>/before.ts` or `before/` | the version with the smell, labelled `SMELL` in a comment |
| `ts/src/<smell>/after.ts` or `after/` | the refactored version, labelled `REFACTORED` |
| `ts/tests/<smell>.test.ts` | the shared suite, plus what only the refactored version allows |
| `ts/src/demo.ts` | prints the catalogue with the size of each version |
| `java/src/primitive_obsession/`, `java/src/conditional_to_polymorphism/` | the two Java entries, both versions side by side |
| `java/src/tests/SmellTests.java` | the same checks called once per version |
| `java/negative/SwappedArguments.java` | a file that must not compile |

Images: `oven/bun:1.4.2` and `gradle:9.8.0-jdk25` (Spotless 8.10.3 with google-java-format, used only to check the format). The TypeScript side has two development dependencies, pinned: `typescript` 7.0.2 and `@types/bun` 1.4.2, the same versions as the repository root. They are there so that the image can run `tsc`, which is what proves the type-level claims. There is no runtime dependency.

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm java-test
```

- **The same tests on both versions.** Every suite is written against the contract and runs once on `before` and once on `after` (`describe.each` in TypeScript, one method called twice in Java). 57 tests in TypeScript, 30 checks in Java.
- **What only `after` allows.** The shipping rule tested without a receipt, the stock rule tested without prices or e-mails, an address label with no invoice.
- **The smell, measured.** For Shotgun Surgery a test reads the sources and counts the files that contain the currency symbol: three before, one after.
- **A new variant from outside.** For the conditional example a fourth delivery kind is written inside the test file. The refactored checkout serves it with no edit; the version with conditionals throws.
- **Type-level tests.** In TypeScript a `@ts-expect-error` line states that passing a `Phone` where an `Email` is expected must not compile, and the image build runs `tsc`. In Java the build runs `javac` on `negative/SwappedArguments.java` and fails if the file is accepted.

## Demo

```sh
docker compose run --rm ts-demo
```

```
== god-class -> Extract Class
  before: 1 file(s), 60 lines of code
  after:  1 file(s), 105 lines of code
  output: To: ana@shop.example | Order ORD-1: 2 x PEN, total 5.00 / To: stock@shop.example | PEN is sold out
  same output in both versions: yes
== shotgun-surgery -> Move the knowledge to one place
  before: 4 file(s), 37 lines of code
  after:  5 file(s), 24 lines of code
  output: Total: R$ 1.234,61
  same output in both versions: yes
```

Sizes of both versions, from the demo (comments and blank lines not counted):

| Smell | Before | After |
| --- | --- | --- |
| long-method | 1 file, 45 lines | 1 file, 46 lines |
| god-class | 1 file, 60 lines | 1 file, 105 lines |
| feature-envy | 1 file, 54 lines | 1 file, 76 lines |
| shotgun-surgery | 4 files, 37 lines | 5 files, 24 lines |
| primitive-obsession | 1 file, 42 lines | 1 file, 57 lines |
| conditional-to-polymorphism | 5 files, 44 lines | 4 files, 45 lines |

Only one refactoring made the code shorter, the one that removed duplication. The others kept the size or grew, because they give names to things that had none: a method, a class, a type. What improves is where a change lands, which the next section measures.

## Polymorphism instead of a conditional chain: the diff

Both versions of the delivery example were extended with a fourth kind, `drone`, in a scratch copy, and compared with `git diff --stat`.

**Before**, with conditionals: 4 existing files edited.

```
 before/cost.ts     | 2 ++
 before/eta.ts      | 2 ++
 before/kind.ts     | 2 +-
 before/tracking.ts | 2 ++
 4 files changed, 7 insertions(+), 1 deletion(-)
```

```diff
--- a/before/kind.ts
-export type Kind = "standard" | "express" | "pickup";
+export type Kind = "standard" | "express" | "pickup" | "drone";
--- a/before/cost.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 4000 + 2 * grams;
 	}
--- a/before/eta.ts
 	} else if (kind === "pickup") {
 		return 0;
+	} else if (kind === "drone") {
+		return 0;
 	}
--- a/before/tracking.ts
 	} else if (kind === "pickup") {
 		return `PK-${number}`;
+	} else if (kind === "drone") {
+		return `DR-${number}`;
 	}
```

If one of the three chains is forgotten the code still compiles, and the order fails at run time with `unknown delivery kind: drone`.

**After**, with polymorphism: 1 new file, no existing file touched.

```
 after/drone.ts | 14 ++++++++++++++
 1 file changed, 14 insertions(+)
```

```diff
--- /dev/null
+++ b/after/drone.ts
+import type { DeliveryMethod } from "./delivery-method";
+
+export class Drone implements DeliveryMethod {
+	readonly name = "drone";
+	readonly trackingPrefix = "DR";
+
+	costCents(grams: number): number {
+		return 4000 + 2 * grams;
+	}
+
+	days(): number {
+		return 0;
+	}
+}
```

If a method is forgotten the class does not compile. The test "adding a variant" in [`conditional-to-polymorphism.test.ts`](ts/tests/conditional-to-polymorphism.test.ts) keeps this claim checked: it declares `Drone` inside the test file and the refactored `shippingLine` handles it.

The cost is the mirror image: a fourth question asked of every kind (say, "is it insured?") is one new function in the version with conditionals, and an edit to the interface and to every class in the refactored one. Polymorphism pays off when kinds are added more often than questions.
