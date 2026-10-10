# SOLID before and after

> Versão em português: [docs/pt/design-patterns/solid-before-after.md](../../pt/design-patterns/solid-before-after.md) · Versión en español: [docs/es/design-patterns/solid-before-after.md](../../es/design-patterns/solid-before-after.md)

Mini-project MP-PAT-2, in [`projects/design-patterns/solid-before-after`](../../../projects/design-patterns/solid-before-after). It teaches what each SOLID principle prevents, by measuring the cost of one new requirement on a module that violates the principle and on its refactor.

## The method

Principles are easy to recite and hard to feel. This project makes each one observable in three steps:

1. **A violating module**, small enough to read in a minute, with tests that document what it does.
2. **A refactor** that follows the principle. The tests of step 1 run against it unchanged, which is the definition of a refactor: the shape of the code changes and the behaviour does not.
3. **One new requirement**, and the diff it needs in each version. The principle is the difference between the two diffs.

The same five modules exist in TypeScript (`ts/`) and in Java (`java/`).

## The five modules

### Single responsibility: an invoice

`before` is one function that computes the tax, writes the receipt and builds the record to store. Three subjects, three groups of people who may ask for a change, one place to edit. `after` has `calculateTotals`, `formatReceipt` and `toRecord`, and an `issueInvoice` that only calls them in order.

What it prevents: a change to the receipt layout that breaks the tax, because both live among the same local variables.

### Open-closed: a discount

`before` is a chain of `if` on the customer kind. `after` is a list of `DiscountRule` objects and a calculator that walks the list it received. A test adds a `student` rule from outside, with no edit to `src/`.

What it prevents: reopening tested code for every new case. Note the limit: the list of default rules is still edited somewhere when the application is assembled. The principle does not remove change, it chooses where change lands.

### Liskov substitution: bank accounts

`before` models a fixed-term account as a subclass of `Account` whose `withdraw` throws. From then on no client can trust an `Account`, and both clients test `instanceof FixedTermAccount`. `after` has two types: every `Account` has a balance, and only a `Withdrawable` can be withdrawn. A fixed-term account is simply not a `Withdrawable`. The factory sorts each account once, and the clients receive lists whose types already say what can be done.

What it prevents: a subtype that breaks code written for its base type, and the `instanceof` checks that spread to compensate. A test reads the source and counts them: two in `before`, none in `after`.

### Interface segregation: a product catalog

`before` has one `ProductCatalog` with `find`, `list`, `save` and `remove`. A catalog built on a supplier's CSV file cannot write, so its `save` and `remove` throw. A report that only lists still depends on the four methods, and handing the CSV catalog to `increasePrices` compiles and fails when it runs. `after` has `ProductReader` and `ProductWriter`. The CSV catalog is a reader, the report asks for a reader, and `increasePrices` asks for both, so the mistake is a compile error.

What it prevents: implementers forced to write methods they cannot honour, and clients that depend on methods they never call. The test doubles show it: four methods for the report in `before`, two in `after`.

### Dependency inversion: a checkout

`before` has a `CheckoutService` that creates an SMTP client and a SQL table by name. `after` has the service declare what it needs in its own words, `OrderStore` and `CustomerNotifier`, and receive them through the constructor. `createCheckout` is the composition root: the only place that names the concrete details and fits them to those interfaces.

What it prevents: a business rule that cannot be tested or reused without its infrastructure, and that changes when the infrastructure does. The interfaces belong to the rule, not to the details: that ownership is what "inversion" means.

## Cost of change

| Principle | New requirement | `before` | `after` |
| --- | --- | --- | --- |
| SRP | the receipt also in HTML | 4 edits inside the function that holds the tax rule | 1 new function, nothing edited |
| OCP | students get 15% | the tested function is edited | 1 new rule, nothing edited |
| LSP | an escrow account that cannot be withdrawn | 1 new class, the factory and every client | 1 new class and the factory |
| ISP | the catalog can archive a product | the interface, both implementers, every test double | the writer interface and the class that writes |
| DIP | confirm through a message queue | the business rule and its tests | the composition root |

The diffs themselves are in the [README](../../../projects/design-patterns/solid-before-after/README.md#cost-of-change). They are illustrations and are not applied in the repository, except the open-closed one, which a test performs.

A fair reading of the table: `after` has more types and more lines than `before` in every module. That is the price. It pays off where requirements like these really arrive, and it is waste where they never do.

## What changes in Java

- **A refused method.** `FixedTermAccount.withdraw` throws `UnsupportedOperationException`, the same exception an unmodifiable `List` throws on `add`. The JDK collections are a well-known example of this compromise.
- **Reader and writer.** TypeScript writes the parameter as `ProductReader & ProductWriter`. Java has no such type for a parameter, and uses a generic bound: `<C extends ProductReader & ProductWriter> void increasePrices(C catalog, int percent)`. No third interface is needed.
- **Composition root.** Method references and lambdas (`table::insert`) play the role of the object literals of the TypeScript version.
- **Tests.** There is no test library: `SolidTest` has a `main`, and `Check` is a 30-line harness. Each suite is a method that receives the module as a function and is called twice.

## Running it

```sh
cd projects/design-patterns/solid-before-after
docker compose run --rm ts-test      # TypeScript tests
docker compose run --rm java-test    # Java tests
docker compose run --rm ts-demo      # same call on both versions, answers compared
```

Building the Java image runs `gradle spotlessCheck testClasses`: Spotless 8.10.3 with google-java-format, and `javac -Xlint:all -Werror`. That step needs the network once, to download the plugin. Every container runs with `network_mode: none`.

## Acceptance criteria

| Item | Criterion | Where it is verified |
| --- | --- | --- |
| MP-PAT-2.1 | one violating module per principle, with tests that document the current behaviour | `before` blocks of `ts/tests/*.test.ts`, `* before` lines of `SolidTest` |
| MP-PAT-2.2 | the same tests pass after each refactor | the same function called with `after` in each file |
| MP-PAT-2.3 | the README shows, per principle, the diff needed for one new requirement before and after | section "Cost of change" of both READMEs |

## Related quiz topics

`design-patterns` / `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion`.
