# backend-patterns

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

Ten design patterns in back-end situations where they pay off. Each pattern has a folder with **the failing design** (`before.ts`), **the pattern version** (`after.ts`) and tests that run both, so you can see the problem before the solution. It teaches **which pain each pattern removes**, and, for Singleton, why the pattern is the pain.

Full explanation: [docs/en/design-patterns/backend-patterns.md](../../../docs/en/design-patterns/backend-patterns.md).

## Quiz topics it demonstrates

- `design-patterns` / `creational-patterns`: Factory, Builder, Singleton and its hidden shared state.
- `design-patterns` / `structural-patterns`: Adapter and Decorator (stacking order, the contract a decorator must keep).
- `design-patterns` / `behavioural-patterns`: Strategy, Observer, Command and State.
- `design-patterns` / `repository-dependency-injection`: Repository, constructor injection and the composition root.

## Run

The only requirement is Docker.

```sh
./setup-unix-backend-patterns.sh        # Linux and macOS
./setup-windows-backend-patterns.ps1    # Windows
```

The script builds the image, runs the tests and runs the demo.

## Structure

| Path | Failing design (`before.ts`) | Pattern version (`after.ts`) |
| --- | --- | --- |
| `ts/src/strategy/` | one function with a branch per shipping kind | one object per kind, chosen from outside |
| `ts/src/observer/` | the order calls every reaction to its payment | an event bus: reactions subscribe |
| `ts/src/factory/` | the creation decision copied in two functions, one out of date | one typed table decides the class |
| `ts/src/adapter/` | the rule calls the vendor SDK and returns its types | a `PaymentGateway` and one adapter per vendor |
| `ts/src/decorator/` | one subclass per combination of features | `Logged` and `Cached` wrappers, stacked in any order |
| `ts/src/repository/` | the use case writes SQL | a `UserRepository` interface and an in-memory implementation |
| `ts/src/command/` | operations as methods, undone by one `switch` | command objects with `execute` and `undo`, and a history with redo |
| `ts/src/state/` | a status field tested in every method | one state object per status |
| `ts/src/builder/` | a constructor with seven positional parameters | named steps and a `build` that validates |
| `ts/src/singleton/` | **the Singleton itself**: `getInstance()` and hidden shared state | an ordinary class, injected, wired in a composition root |

`ts/src/demo.ts` is the demo, and `ts/tests/` has one test file per pattern.

TypeScript on the pinned image `oven/bun:1.4.2`, with no dependency: Bun is the runtime and the test runner.

## Tests

```sh
docker compose run --rm ts-test
```

Each test file has a `before` block and an `after` block. The `before` block proves that the failing design works **and** pins down its flaw: a shipping kind that cannot be added from outside, a forgotten copy of a creation decision, a POST request created with no body. The `after` block shows the same behaviour with the flaw gone. Where both designs must behave identically (State, Decorator), one contract runs against both.

`tests/singleton.test.ts` is special: its two `before` tests depend on the order in which they run. That is deliberate. It is the hidden shared state, shown by a test.

## Demo

```sh
docker compose run --rm ts-demo
```

It prints one scenario per pattern, run on both designs:

```
strategy
  before: throws "unknown shipping kind: drone"
  after:  drone shipping added from outside: total 15300 cents
...
singleton
  before: after 3 logins, the first search is allowed: false
  after:  after 3 logins, the first search is allowed: true
```

There is no dashboard: the lesson is in the code and in the tests, and the demo is a command-line tour of them.
