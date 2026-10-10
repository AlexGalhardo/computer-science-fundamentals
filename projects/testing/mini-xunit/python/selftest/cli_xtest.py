"""The framework tests itself: discovery, the report and the command line."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

from mini_xunit import (
    Failure,
    TestCase,
    TestResult,
    discover,
    exit_code_for,
    format_report,
)

# EN: Discovery and reporting, checked from the outside: the command line is started as a real
#     process on the example folders, and the test looks at what a user or a CI job would see,
#     the printed report and the exit code.
# PT: Descoberta e relatório, conferidos por fora: a linha de comando é iniciada como um processo
#     de verdade nas pastas de exemplo, e o teste olha o que um usuário ou um job de CI veria, o
#     relatório impresso e o código de saída.
# ES: Descubrimiento e informe, comprobados desde fuera: la línea de comandos se inicia como un
#     proceso de verdad en las carpetas de ejemplo, y la prueba mira lo que vería un usuario o un
#     job de CI, el informe impreso y el código de salida.

ROOT = Path(__file__).resolve().parent.parent


def run_cli(directory: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-m", "mini_xunit", directory],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class DiscoveryTest(TestCase):
    def test_finds_every_test_method_of_every_test_file(self) -> None:
        result = TestResult()
        discover(ROOT / "examples" / "passing").run(result)
        self.assert_equal(result.summary(), "4 run, 0 failed")

    def test_finds_nothing_in_a_folder_without_test_files(self) -> None:
        result = TestResult()
        discover(ROOT / "mini_xunit").run(result)
        self.assert_equal(result.run_count, 0)


class ReportTest(TestCase):
    def test_report_lists_name_message_location_and_summary(self) -> None:
        result = TestResult()
        result.test_started()
        result.test_started()
        result.failures.append(Failure("CartTest.test_total", "expected 1 but got 2", "cart.py:7"))
        self.assert_equal(
            format_report(result),
            "FAIL CartTest.test_total\n"
            "     expected 1 but got 2\n"
            "     at cart.py:7\n"
            "2 run, 1 failed",
        )

    def test_exit_codes(self) -> None:
        empty = TestResult()
        self.assert_equal(exit_code_for(empty), 2)
        green = TestResult()
        green.test_started()
        self.assert_equal(exit_code_for(green), 0)
        red = TestResult()
        red.test_started()
        red.test_failed("X.test_y", RuntimeError("no"))
        self.assert_equal(exit_code_for(red), 1)


class CommandLineTest(TestCase):
    def test_passing_folder_exits_with_zero(self) -> None:
        run = run_cli("examples/passing")
        self.assert_equal(run.returncode, 0)
        self.assert_equal(run.stdout.strip(), "4 run, 0 failed")

    def test_failing_test_reports_name_message_location_and_exits_non_zero(self) -> None:
        source = (ROOT / "examples" / "failing" / "cart_xtest.py").read_text(encoding="utf-8")
        line = next(
            number
            for number, text in enumerate(source.splitlines(), 1)
            if "marker: wrong expectation" in text
        )

        run = run_cli("examples/failing")

        self.assert_equal(run.returncode, 1)
        self.assert_equal(
            run.stdout.strip(),
            "FAIL CartTest.test_total_with_discount\n"
            "     expected 100 but got 90.0\n"
            f"     at examples/failing/cart_xtest.py:{line}\n"
            "2 run, 1 failed",
        )

    def test_folder_with_no_tests_exits_with_two(self) -> None:
        with tempfile.TemporaryDirectory() as empty:
            run = run_cli(empty)
        self.assert_equal(run.returncode, 2)
        self.assert_equal(run.stdout.strip(), "0 run, 0 failed")
