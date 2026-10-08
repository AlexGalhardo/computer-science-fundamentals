# Same domain with objects and with functions

> Versão em português: [docs/pt/oop/oop-vs-functional.md](../../pt/oop/oop-vs-functional.md)

Mini-project MP-OOP-1, in [`projects/oop/oop-vs-functional`](../../../projects/oop/oop-vs-functional). It teaches what changes when the same rules are written with objects or with functions. Languages: Java, TypeScript and Elixir.

## One problem, four programs

A shopping cart has lines, an ordered list of discount rules (percent coupon, fixed coupon, bulk discount, take and pay) and a tax policy. The rules are in the README of the mini-project. The cart is written four times:

| Style | Language | Where |
| --- | --- | --- |
| Objects | Java | `java/src/cart/` |
| Objects | TypeScript | `ts/src/oop/` |
| Functions | TypeScript | `ts/src/functional/cart.ts` |
| Functions | Elixir | `elixir/lib/cart.ex` |

TypeScript appears twice on purpose: with the language held fixed, every difference between `ts/src/oop` and `ts/src/functional` comes from the style. Java shows the object style in a language built around it, with nominal types, records and checked access modifiers. Elixir shows the functional style in a language where it is the only one: there is no class and no way to change a value in place.

All four read [`scenarios.txt`](../../../projects/oop/oop-vs-functional/scenarios.txt), a plain text file with 15 scenarios, and must produce the same receipts. That file is what makes "the same rules" a checked statement and not an intention.

## Where the state lives

With objects, the cart is a thing with an identity. Its lines are a private field, `add` changes the object, and every variable that refers to the cart sees the new line. Encapsulation is what keeps this safe: nobody outside the class can touch the list, and `lines()` hands out a copy (TypeScript) or a read-only view (Java).

With functions, the cart is a value. `addLine(cart, line)` builds a new cart and leaves the one it received as it was. There is nothing to protect, because there is nothing that can be changed. Building a cart is a chain: each step takes the value the previous step returned.

```ts
// objects                                  // functions
const cart = new Cart();                    const cart = addLine(emptyCart, line);
cart.add(new CartLine("PEN", 250, 4));      // emptyCart is still empty
```

The tests make the difference observable. The functional version in TypeScript runs on deeply frozen input, so a single write anywhere would throw. In Elixir the guarantee comes from the language, and the test only shows it.

## How a rule is chosen

With objects, each rule is a class that implements `DiscountRule`. The cart loops over the list and calls `discountCents` and `describe`. Which code runs is decided at run time by the class of each object: dynamic dispatch. The cart never names a concrete rule.

With functions, a rule is data with a tag: `{ kind: "bulk", ... }` in TypeScript, `{:bulk, sku, min, percent}` in Elixir. The function `discountCents` looks at the tag and picks the branch: a `switch` in TypeScript, one function clause per shape in Elixir. This is pattern matching, and it does the job of dynamic dispatch from the other side: the function knows all the variants, instead of each variant knowing its code.

## How an invalid value is refused

With objects, the constructor validates and throws. `new CartLine("PEN", 250, 0)` never returns, so no invalid line exists and no other class checks again.

With functions, data is just data, so an invalid line can be written down. `price` validates and returns either `{ ok: true, receipt }` or `{ ok: false, error }` (`{:ok, receipt}` or `{:error, code}` in Elixir). The error is a value, and the type forces the caller to look at which one came back.

## Which change is cheap

"Take and pay" was added last, to measure this. With objects it is one new file and no edit to existing production code: the open-closed principle at work. With functions it is four edits inside one existing file: the type, the validation, `discountCents` and `describe`.

The opposite change has the opposite cost. A new operation on every rule is one new function in the functional versions, and an edit to the interface and to all four classes in the object versions. Objects group code by variant, functions group code by operation, and each makes one direction of growth cheap. This is the expression problem. The question to ask of a design is which direction is expected to grow.

When a case is forgotten, the object versions do not compile (the class is missing a method). The functional TypeScript version does not compile either, thanks to an exhaustiveness check on every `switch`. In Elixir the gap shows up at run time, so the tests carry that weight.

## Measured comparison

`docker compose run --rm compare` counts files, lines of code and named types of the production code of each version and prints the table committed in `results/comparison.md`. A test fails if the table and the code disagree. The current numbers and the reading of them are in the [README](../../../projects/oop/oop-vs-functional/README.md#comparison).

Read the numbers with care: they describe four small programs, not two paradigms. The object versions are longer mostly because they name more things, and names are also where a reader finds their way in a large system.

## Run

```sh
./setup-unix-oop-vs-functional.sh        # Linux and macOS
./setup-windows-oop-vs-functional.ps1    # Windows
```

Only Docker is required. The script runs the tests of the three languages, the demo and the comparison.

## Related quiz topics

`oop`: `classes-objects-encapsulation`, `polymorphism-dynamic-dispatch`, `abstraction-interfaces-abstract-classes`, `composition-vs-inheritance`, `oop-across-languages`.
