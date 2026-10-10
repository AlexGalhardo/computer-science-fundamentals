# Mini xUnit from scratch (MP-TEST-5)

> Versão em português: [docs/pt/testing/mini-xunit.md](../../pt/testing/mini-xunit.md) · Versión en español: [docs/es/testing/mini-xunit.md](../../es/testing/mini-xunit.md)

Mini-project: [`projects/testing/mini-xunit`](../../../projects/testing/mini-xunit/README.md). Quiz topic: `unit-tests-isolation`.

## The concept

Almost every test framework in use (JUnit, pytest, NUnit, the runner of Bun) descends from one small design, called xUnit. It has four parts:

```text
                      +--------------+
   discovery ------>  |  TestSuite   |  a list of things that can run
                      +--------------+
                        | run(result)          for each test:
                        v
                      +--------------+        1. result.test_started()
                      |  TestCase    |        2. set_up()            build the fixture
                      |  (one test)  |        3. the test method     may raise
                      +--------------+        4. tear_down()         always, in a finally
                        | records                5. on exception: result.test_failed(...)
                        v
                      +--------------+
                      |  TestResult  |  -> report -> exit code
                      +--------------+
```

The mini-project builds this in Python and in TypeScript with no test library, and tests the result with itself.

## Three ideas worth the whole project

**1. A test is an object, and its name is a method name.** `WasRun("test_method")` is one test. `run` looks the method up by name at run time (`getattr` in Python, `Reflect.get` in TypeScript) and calls it. That is why one class can hold many tests, and why a framework can list them: it asks the class for every method whose name starts with `test`.

**2. The order set-up, test, tear-down is fixed by the framework, not by the test.** `run` is a template method:

```python
result.test_started()
try:
    self.set_up()
    try:
        method()
    finally:
        self.tear_down()
except Exception as error:
    result.test_failed(self.label(), error)
```

Every line has a consequence:

- `tear_down` is in a `finally`, so the clean-up happens even when the test fails.
- `tear_down` is inside the `try` that starts after `set_up`, so it does not run when `set_up` itself failed: there is nothing to clean.
- The exception is caught and recorded, never re-raised. One failing test cannot stop the ones after it.

**3. A fresh fixture per test.** `TestSuite.from_class` creates **one new instance for each test method**. Attributes set by one test do not exist in the next one. This is where test isolation comes from, and it is why state kept in class or module variables breaks it.

## Assertions, location and exit code

An assertion is an `if` that raises an exception with a message that says what was expected and what arrived.

The **location** of a failure is taken from the stack: the deepest frame that is not inside the framework. Without that filter every failed assertion would point at the line of `assert_equal` itself.

The **exit code** is what scripts and CI read: 0 for green, 1 for red, and 2 when no test was found, because a run with zero tests must not look like success.

```text
FAIL CartTest.test_total_with_discount
     expected 100 but got 90.0
     at examples/failing/cart_xtest.py:28
2 run, 1 failed
```

## How a framework can test itself

The self-tests are test cases of the framework, about the framework. The subject of each test is **another test case**, run by hand with its own `TestResult`:

```python
def test_failing_test_is_counted_as_failed(self) -> None:
    WasRun("test_broken_method").run(self.result)  # the inner test fails, on purpose
    self.assert_equal(self.result.summary(), "1 run, 1 failed")
```

The inner failure stays inside `self.result` and does not reach the real run. `WasRun` writes what happened to it in a `log` string, so the order `set_up test_method tear_down` can be asserted.

There is a trap. If the framework swallowed failures, all of its tests would be green. So a `bootstrap` file runs first and checks, with plain `if` statements and no framework at all, that a failing test is reported as failed, that a passing test is not, and that tests are counted. The self-tests are trusted only after that.

The examples and the fixtures show a second detail of discovery: only files that follow the naming convention are loaded as tests, and only classes defined in them. `WasRun` lives in `fixtures`, outside the convention, because its broken test must not be run as a real test.

## Python and TypeScript side by side

| | Python | TypeScript (Bun) |
| --- | --- | --- |
| Call a method by name | `getattr(self, name)` | `Reflect.get(this, name)` |
| Test methods of a class | `dir(cls)` | prototype chain and `Object.getOwnPropertyNames` |
| Location of a failure | `traceback.extract_tb` gives structured frames | `error.stack` is text and must be parsed |
| Asynchronous tests | not supported | every step is awaited |
| Test files | `*_xtest.py`, loaded with `importlib` | `*.xunit.ts`, loaded with `import()` |

## Run

```sh
./setup-unix-mini-xunit.sh        # Linux and macOS
./setup-windows-mini-xunit.ps1    # Windows
```

The self-tests: `docker compose run --rm python-test` and `ts-test`. The red run: `python-demo` and `ts-demo`, which exit with 1 by design.
