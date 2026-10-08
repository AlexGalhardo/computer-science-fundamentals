"""Turns a TestResult into text for people and into an exit code for scripts."""

from __future__ import annotations

from mini_xunit.core import TestResult

# EN: The exit code is the contract with scripts and CI, which do not read text:
#       0  every test passed
#       1  at least one test failed
#       2  no test was found (a run with zero tests must not look like a success)
# PT: O código de saída é o contrato com scripts e CI, que não leem texto:
#       0  todos os testes passaram
#       1  pelo menos um teste falhou
#       2  nenhum teste foi encontrado (uma execução com zero testes não pode parecer sucesso)


def format_report(result: TestResult) -> str:
    lines: list[str] = []
    for failure in result.failures:
        lines.append(f"FAIL {failure.test}")
        lines.append(f"     {failure.message}")
        lines.append(f"     at {failure.location}")
    lines.append(result.summary())
    return "\n".join(lines)


def exit_code_for(result: TestResult) -> int:
    if result.run_count == 0:
        return 2
    return 0 if result.was_successful() else 1
