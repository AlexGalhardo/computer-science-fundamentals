# Back-end design patterns

> Versão em português: [docs/pt/design-patterns/backend-patterns.md](../../pt/design-patterns/backend-patterns.md)

Mini-project MP-PAT-1, in [`projects/design-patterns/backend-patterns`](../../../projects/design-patterns/backend-patterns). It teaches which pain each of ten design patterns removes, by showing the failing design first.

## How to read it

A pattern is a named answer to a problem that keeps coming back. Learning the answer without the problem produces code full of patterns nobody needed. So every folder in `ts/src/` has two files:

- `before.ts`: a design that works and hurts. The header comment says where it hurts.
- `after.ts`: the same behaviour, with the pattern.

The tests in `ts/tests/` run both. The `before` block of each file pins the flaw down with an assertion, so the flaw is a fact and not an opinion.

## The ten patterns

| Pattern | Kind | The pain in `before.ts` | What `after.ts` changes |
| --- | --- | --- | --- |
| Strategy | behavioural | a branch per shipping kind; a new kind means editing the function | each kind is an object with the same interface, and a new one is written anywhere |
| Observer | behavioural | the order calls every reaction to its own payment | the order publishes an event; reactions subscribe |
| Command | behavioural | each operation is split between a method and a branch of `undo` | each operation is an object that knows how to run and to reverse itself |
| State | behavioural | the status is tested in every method | each status is an object that answers every operation |
| Factory | creational | the decision of which class to create is copied, and one copy is out of date | one table makes the decision, and the compiler checks that it is complete |
| Builder | creational | seven positional parameters, no validation between fields | named steps, and `build` refuses an incoherent request |
| Singleton | creational | **it is the failing design** | an ordinary class, injected |
| Adapter | structural | the business rule speaks the vendor's vocabulary | the rule owns a contract, and one small class per vendor translates |
| Decorator | structural | one subclass per combination of features | one wrapper per feature, combined at assembly time |
| Repository | architectural | the use case writes SQL | the use case sees a collection, and storage is behind an interface |

## Details that the tests show

**Strategy.** The test adds a `drone` strategy inside the test file. Nothing in `src/` changes: that is the open-closed principle seen from the outside.

**Observer.** The bus publishes over a snapshot of its list. A listener that cancels itself during delivery does not make the next one be skipped, and a listener subscribed during delivery waits for the next event. Each listener is isolated, so one that throws does not stop the others, and its error is returned to the publisher. Subscribing returns the function that cancels, because a listener that lives less than the bus would otherwise never be collected.

**Factory.** In the failing design `welcome` supports the push channel and `orderShipped` does not. The factory version types its table as `Record<Channel, ...>`, so adding a channel to the list without a creator is a compile error.

**Adapter.** Two made-up vendors do the same job with different method names, units (currency units against cents) and answers. The rule is tested with both adapters and with a plain object, with no vendor at all.

**Decorator.** With two features, inheritance already needs three classes and repeats the cache code; with n features it needs 2ⁿ − 1. The order of the wrappers is part of the behaviour: `Logged` outside records every call, `Cached` outside records only the calls that reach the store. A decorator is a subtype of what it wraps, so the same contract (a read after a write returns what was written) runs against every combination.

**Repository.** The test double of the failing design has to recognise three exact SQL strings. The pattern version tests the same rule with a `Map` behind an interface.

**Command.** The history has two stacks. Undo reverses the most recent command first, and running a new command clears the redo stack. The test adds a `DoubleQuantity` command without editing the cart or the history.

**State.** One transition table is written in the test and both designs must obey it: 12 cases each (4 statuses × 3 operations). A last test reads the two source files and counts the conditionals on the status: three in `before.ts`, none in `after.ts`.

**Builder.** `build` is the only door: a POST with no body, a GET with a body and a non-positive timeout are refused there. The product is frozen and its headers are a copy, so a builder that keeps being used cannot change a request it already delivered.

## Singleton, and why to avoid it

A Singleton joins two decisions: there is only one instance, and it is reachable from anywhere. The first is often legitimate. The second is a global variable.

In `singleton/before.ts`, `RateLimiter` has a constructor that takes only a limit. It looks independent. Inside `allow` it calls `RequestCounter.getInstance()`, and so two limiters that were never introduced to each other count on the same numbers. The tests show it twice:

1. Three calls through the `login` limiter make the first call through a brand new `search` limiter be refused.
2. The next test creates a fresh limiter and is refused at once, because the state survived from the previous test. That test passes only when it runs after the first one.

`singleton/after.ts` keeps the class and drops the pattern. `RequestCounter` is an ordinary class and the limiter receives it through the constructor. Limiters with their own counters are independent, a new counter starts from zero in every test, and "only one instance" is still available as a visible decision: `createApp`, the composition root, gives the same counter to `login` and `passwordReset` on purpose.

## Running it

```sh
cd projects/design-patterns/backend-patterns
docker compose run --rm ts-test    # tests
docker compose run --rm ts-demo    # one scenario per pattern, on both designs
```

There is no dependency and no network: the image is `oven/bun:1.4.2` and both services run with `network_mode: none`.

## Acceptance criteria

| Item | Criterion | Where it is verified |
| --- | --- | --- |
| MP-PAT-1.1 | Strategy, Observer, Factory, Adapter and Decorator each have a failing-design version, the pattern version and tests | `ts/src/<pattern>/before.ts`, `after.ts`, `ts/tests/<pattern>.test.ts` |
| MP-PAT-1.2 | Repository, Command, State and Builder have the same structure | same paths |
| MP-PAT-1.3 | a test shows the hidden shared state, and the injected version removes it | `ts/tests/singleton.test.ts` |

## Related quiz topics

`design-patterns` / `creational-patterns`, `structural-patterns`, `behavioural-patterns`, `repository-dependency-injection`.
