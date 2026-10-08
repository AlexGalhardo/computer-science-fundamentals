"""The framework tests itself: TestCase, the assertions and TestSuite."""

from __future__ import annotations

from pathlib import Path

from fixtures import BrokenSetUp, Counted, WasRun

from mini_xunit import Failure, TestCase, TestResult, TestSuite, test_method_names

# EN: THE FRAMEWORK TESTS ITSELF. These classes extend the TestCase they are testing, and they
#     are found and run by the same discovery and the same loop. The trick that makes it
#     possible: the subject of each test is ANOTHER test case (WasRun), run by hand with its own
#     TestResult, so its failures stay inside that result and do not leak into the real run.
# PT: O FRAMEWORK TESTA A SI MESMO. Estas classes estendem o TestCase que estão testando, e são
#     encontradas e rodadas pela mesma descoberta e pelo mesmo laço. O truque que torna isso
#     possível: o objeto de cada teste é OUTRO caso de teste (WasRun), rodado à mão com o seu
#     próprio TestResult, então as falhas dele ficam dentro daquele resultado e não vazam para a
#     execução de verdade.

FIXTURES = Path(__file__).with_name("fixtures.py")


def line_of(marker: str) -> int:
    lines = FIXTURES.read_text(encoding="utf-8").splitlines()
    return next(number for number, line in enumerate(lines, 1) if f"marker: {marker}" in line)


class TestCaseTest(TestCase):
    def set_up(self) -> None:
        self.result = TestResult()

    def test_template_method_order(self) -> None:
        test = WasRun("test_method")
        test.run(self.result)
        self.assert_equal(test.log, "set_up test_method tear_down ")

    def test_passing_test_is_counted(self) -> None:
        WasRun("test_method").run(self.result)
        self.assert_equal(self.result.summary(), "1 run, 0 failed")
        self.assert_true(self.result.was_successful())

    def test_failing_test_is_counted_as_failed(self) -> None:
        WasRun("test_broken_method").run(self.result)
        self.assert_equal(self.result.summary(), "1 run, 1 failed")
        self.assert_true(not self.result.was_successful())

    def test_tear_down_runs_even_when_the_test_fails(self) -> None:
        test = WasRun("test_broken_method")
        test.run(self.result)
        self.assert_equal(test.log, "set_up test_broken_method tear_down ")

    def test_failing_set_up_is_reported_and_skips_the_test(self) -> None:
        test = BrokenSetUp("test_method")
        test.run(self.result)
        self.assert_equal(self.result.summary(), "1 run, 1 failed")
        self.assert_equal(test.log, "")
        self.assert_equal(self.result.failures[0].message, "set_up failed")

    def test_unknown_method_is_a_failure_not_a_crash(self) -> None:
        WasRun("test_that_does_not_exist").run(self.result)
        self.assert_equal(
            self.result.failures[0].message, "no test method named test_that_does_not_exist"
        )

    def test_failure_carries_name_message_and_location(self) -> None:
        WasRun("test_broken_method").run(self.result)
        expected = Failure(
            "WasRun.test_broken_method", "boom", f"selftest/fixtures.py:{line_of('boom')}"
        )
        self.assert_equal(self.result.failures, [expected])

    def test_assertion_failure_points_at_the_test_not_at_the_framework(self) -> None:
        WasRun("test_failed_assertion").run(self.result)
        failure = self.result.failures[0]
        self.assert_equal(failure.message, "expected 5 but got 4")
        self.assert_equal(failure.location, f"selftest/fixtures.py:{line_of('assertion')}")


class AssertionTest(TestCase):
    def test_assert_equal_compares_structures(self) -> None:
        self.assert_equal({"a": [1, 2]}, {"a": [1, 2]})

    def test_assert_equal_raises_on_difference(self) -> None:
        self.assert_raises(
            Exception, lambda: self.assert_equal([1], [2]), "expected [2] but got [1]"
        )

    def test_assert_true_raises_with_the_given_message(self) -> None:
        self.assert_raises(
            Exception, lambda: self.assert_true(False, "custom message"), "custom message"
        )

    def test_assert_raises_fails_when_nothing_is_raised(self) -> None:
        self.assert_raises(
            Exception,
            lambda: self.assert_raises(ValueError, lambda: None),
            "nothing was raised",
        )

    def test_assert_raises_lets_other_exception_types_through(self) -> None:
        def wrong_type() -> None:
            self.assert_raises(ValueError, lambda: 1 / 0)

        self.assert_raises(ZeroDivisionError, wrong_type)


class TestSuiteTest(TestCase):
    def test_suite_runs_every_test_and_keeps_going_after_a_failure(self) -> None:
        suite = TestSuite()
        suite.add(WasRun("test_broken_method"))
        suite.add(WasRun("test_method"))
        result = TestResult()
        suite.run(result)
        self.assert_equal(result.summary(), "2 run, 1 failed")

    def test_suites_can_be_nested(self) -> None:
        inner = TestSuite()
        inner.add(WasRun("test_method"))
        outer = TestSuite()
        outer.add(inner)
        outer.add(WasRun("test_method"))
        result = TestResult()
        outer.run(result)
        self.assert_equal(result.summary(), "2 run, 0 failed")

    def test_only_methods_starting_with_test_are_discovered(self) -> None:
        self.assert_equal(
            test_method_names(WasRun),
            ["test_broken_method", "test_failed_assertion", "test_method"],
        )

    def test_each_test_method_gets_a_fresh_instance(self) -> None:
        Counted.created = 0
        Counted.seen = []
        result = TestResult()
        TestSuite.from_class(Counted).run(result)
        self.assert_equal(result.summary(), "2 run, 0 failed")
        self.assert_equal(Counted.seen, [1, 2])
