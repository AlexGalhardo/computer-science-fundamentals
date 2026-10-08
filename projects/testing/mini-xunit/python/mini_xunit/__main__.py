"""`python -m mini_xunit <folder>`: discover, run, report."""

from __future__ import annotations

import sys
from pathlib import Path

from mini_xunit.core import TestResult
from mini_xunit.discovery import discover
from mini_xunit.reporter import exit_code_for, format_report


def main(arguments: list[str]) -> int:
    if len(arguments) != 1:
        print("usage: python -m mini_xunit <folder>", file=sys.stderr)
        return 2
    suite = discover(Path(arguments[0]))
    result = TestResult()
    suite.run(result)
    print(format_report(result))
    return exit_code_for(result)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
