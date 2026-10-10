# oop-vs-functional

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

One shopping cart, with discounts, coupons and taxes, written four times: with objects in Java and in TypeScript, and with functions over immutable data in TypeScript and in Elixir. It teaches **what changes when the same rules are written with objects or with functions**: where the state lives, how a rule is chosen (dynamic dispatch or pattern matching), how an invalid value is refused (exception or value), and which kind of change is cheap in each style.

All four implementations read the same file, [`scenarios.txt`](scenarios.txt), and must print the same receipts.

Full explanation: [docs/en/oop/oop-vs-functional.md](../../../docs/en/oop/oop-vs-functional.md).

## The domain

Amounts are integer cents. A cart has lines (product, unit price, quantity), an ordered list of discount rules and one tax policy.

| Rule | Example in `scenarios.txt` | Takes off |
| --- | --- | --- |
| Percent coupon | `rule percent-coupon WELCOME10 10` | 10% of what is still to pay |
| Fixed coupon | `rule fixed-coupon FIVE 500` | 5.00, never more than what is still to pay |
| Bulk discount | `rule bulk PEN 10 20` | 20% of the PEN lines with 10 units or more |
| Take and pay | `rule take-pay TEE 3 2` | one free TEE in every complete group of 3 |

Rules are applied in the order they were added, each one on what the previous ones left, so the order changes the total. The tax (`tax flat 825` is 8.25%) is charged after the discounts and rounds half a cent up.

## Quiz topics it demonstrates

- `oop` / `classes-objects-encapsulation`: private state, a getter that hands out a copy, objects that are valid from the constructor on, "tell, don't ask", immutable values.
- `oop` / `polymorphism-dynamic-dispatch`: a list of rules behind one interface, each object answering the same call in its own way.
- `oop` / `abstraction-interfaces-abstract-classes`: the interface as a contract, and depending on an abstraction instead of a concrete class.
- `oop` / `composition-vs-inheritance`: the cart has a tax policy and can replace it on a living object.
- `oop` / `oop-across-languages`: structural typing in TypeScript, and the same polymorphism through pattern matching in Elixir (the expression problem).

## Run

The only requirement is Docker.

```sh
./setup-unix-oop-vs-functional.sh        # Linux and macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

The script builds the three images, runs the tests of the three languages, prints the receipt of every scenario and prints the comparison table.

## Structure

| Path | What it is |
| --- | --- |
| `scenarios.txt` | the shared acceptance scenarios: 10 receipts and 5 rejections |
| `java/src/cart/` | objects in Java: `Cart`, `CartLine`, the `DiscountRule` interface with four classes, the `TaxPolicy` interface with two |
| `ts/src/oop/` | the same design in TypeScript, one rule per file in `rules/` |
| `ts/src/functional/cart.ts` | functions in TypeScript: read-only types, a union of rule variants, pure functions |
| `elixir/lib/cart.ex` | functions in Elixir: maps, tagged tuples, one function clause per variant |
| `ts/src/run.ts` | the client code of the two TypeScript versions, side by side |
| `ts/src/compare.ts`, `results/comparison.md` | the measurement behind the table below |
| `java/src/support/`, `ts/src/scenarios.ts`, `elixir/lib/scenarios.ex` | readers of `scenarios.txt`, tests and demos (not measured) |

Images: `gradle:9.8.0-jdk25` (Spotless 8.10.3 with google-java-format, used only to check the format), `oven/bun:1.4.2` and `elixir:1.20.4-otp-28-slim`. No implementation has a library dependency.

## Tests

```sh
docker compose run --rm java-test
docker compose run --rm elixir-test
docker compose run --rm ts-test
```

- **Shared scenarios.** Each language runs the 15 scenarios of `scenarios.txt`. In TypeScript each scenario runs twice, once per style.
- **No input is mutated.** In TypeScript the functional version receives deeply frozen input (`Object.freeze` at every level, so any write would throw) and the arguments are compared with a snapshot taken before the calls. In Elixir immutability belongs to the language; the test shows the same name still bound to the same value after four functions "changed" it.
- **The contrast.** A second reference to the object cart sees the added line. The functional cart held before the addition does not.
- **Encapsulation and polymorphism.** The list returned by the cart cannot be used to change it, and the cart accepts a rule it has never seen.
- **The table is current.** A test fails when `results/comparison.md` no longer matches the code.

The Java image build also runs `spotlessCheck` and compiles with `-Xlint:all -Werror`. The Elixir run also checks `mix format --check-formatted`.

## Demo

```sh
docker compose run --rm ts-demo       # every receipt, and whether the two styles agree
docker compose run --rm java-demo     # the same receipts, from Java
docker compose run --rm elixir-demo   # the same receipts, from Elixir
```

```text
== everything together
  subtotal 160.00
  - 6.00  bulk PEN: 20% off from 10 units
  - 30.00  TEE: take 3, pay 2
  - 12.40  coupon WELCOME10: 10% off
  - 5.00  coupon FIVE: 5.00 off
  tax 8.79
  total 115.39
  objects and functions agree: yes
```

## Comparison

Measured by `docker compose run --rm compare` on the production code of the cart only: no tests, no scenario reader, no comments, no blank lines. The checked copy is [`results/comparison.md`](results/comparison.md).

| Implementation | Files | Lines of code | Named types |
| --- | --- | --- | --- |
| Java, objects | 13 | 196 | 13 |
| TypeScript, objects | 8 | 196 | 14 |
| TypeScript, functions | 1 | 136 | 9 |
| Elixir, functions | 1 | 116 | 7 |

The numbers describe this code, not the paradigms in general. What they show: the object versions spend their extra lines on naming things (a class and a file per rule, private fields, constructors), and the functional versions keep every rule of one operation in one place.

| Question | Objects (Java, TypeScript) | Functions (TypeScript, Elixir) |
| --- | --- | --- |
| Where is the state? | Inside the cart, private. `add` changes the object | In the value passed around. `addLine` returns a new cart |
| How is the rule chosen? | Dynamic dispatch on the class of the rule object | `switch` on `kind` (TypeScript), function clause on the tag (Elixir) |
| How is an invalid value refused? | The constructor throws: the invalid object never exists | `price` returns an error value that the caller must check |
| **How is a new rule added?** | **One new file. No existing production file is edited** | **No new file. One existing file is edited in four places** |
| How is a new operation on rules added? | The interface and every rule class are edited | One new function. No existing function is edited |
| Who finds a forgotten case? | The compiler: the new class does not compile without both methods | TypeScript: the `never` check in each `switch`. Elixir: a test, at run time |

### Adding a rule, measured

"Take and pay" was the last rule added. These are the changes it needed in production code.

With objects, one new file, [`TakePayDiscount.java`](java/src/cart/TakePayDiscount.java) (and [`take-pay-discount.ts`](ts/src/oop/rules/take-pay-discount.ts)), and nothing else:

```diff
+ public final class TakePayDiscount implements DiscountRule {
+   public TakePayDiscount(String sku, int take, int pay) { ... }
+   @Override public int discountCents(List<CartLine> lines, int runningCents) { ... }
+   @Override public String describe() { ... }
+ }
```

With functions, four edits inside the existing [`cart.ts`](ts/src/functional/cart.ts) (and the same four in [`cart.ex`](elixir/lib/cart.ex)):

```diff
  export type Rule =
  	| Readonly<{ kind: "bulk"; sku: string; minQuantity: number; percent: number }>
+ 	| Readonly<{ kind: "take-pay"; sku: string; take: number; pay: number }>;

  function ruleError(rule: Rule): CartErrorCode | undefined {
+ 		case "take-pay":
+ 			return isCount(rule.take, 1) && isCount(rule.pay, 1) && rule.pay < rule.take ? undefined : "invalid-rule";

  export function discountCents(rule: Rule, lines: readonly Line[], runningCents: number): number {
+ 		case "take-pay":
+ 			return lines.filter(...).reduce(...);

  export function describe(rule: Rule): string {
+ 		case "take-pay":
+ 			return `${rule.sku}: take ${rule.take}, pay ${rule.pay}`;
```

In both styles one more line is needed where the rule is created from the scenario file, which is support code.

The opposite change has the opposite cost. A third operation on rules, for example `explain`, would be one new function in the functional versions, and one new method in the interface plus one in each of the four classes in the object versions. This trade-off is known as the expression problem.
