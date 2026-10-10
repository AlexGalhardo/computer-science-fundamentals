"""Checks the most basic promises of the framework without using the framework."""

from __future__ import annotations

import sys

from mini_xunit import TestCase, TestResult, TestSuite

# EN: THE BOOTSTRAP PROBLEM. The framework is tested with itself, and a broken framework could
#     report its own tests as passing: if failures were silently swallowed, every self-test would
#     be "green". So before trusting it, this file checks the most basic promises with nothing
#     but `if` and `sys.exit`: a failing test is counted as failed, a passing test is not, and
#     every test is counted. Only after this does the self-test run mean anything.
# PT: O PROBLEMA DO BOOTSTRAP. O framework é testado com ele mesmo, e um framework quebrado
#     poderia relatar os próprios testes como aprovados: se as falhas fossem engolidas em
#     silêncio, todo autoteste ficaria "verde". Então, antes de confiar nele, este arquivo confere
#     as promessas mais básicas só com `if` e `sys.exit`: um teste que falha é contado como falha,
#     um que passa não é, e todo teste é contado. Só depois disso a execução dos autotestes
#     significa alguma coisa.
# ES: EL PROBLEMA DEL BOOTSTRAP. El framework se prueba con él mismo, y un framework roto
#     podría reportar sus propias pruebas como aprobadas: si los fallos se tragaran en
#     silencio, toda autoprueba quedaría "verde". Así que, antes de confiar en él, este archivo
#     comprueba las promesas más básicas solo con `if` y `sys.exit`: una prueba que falla se cuenta
#     como fallo, una que pasa no, y toda prueba se cuenta. Solo después de eso la ejecución de
#     las autopruebas significa algo.


class Probe(TestCase):
    def test_passes(self) -> None:
        pass

    def test_fails(self) -> None:
        raise RuntimeError("on purpose")


def check(condition: bool, message: str) -> None:
    if not condition:
        print(f"bootstrap: FAILED - {message}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    passing = TestResult()
    Probe("test_passes").run(passing)
    check(passing.run_count == 1, "a test that ran must be counted")
    check(passing.was_successful(), "a passing test must not be reported as a failure")

    failing = TestResult()
    Probe("test_fails").run(failing)
    check(failing.run_count == 1, "a failing test must still be counted")
    check(not failing.was_successful(), "a failing test must be reported as a failure")
    check(failing.failures[0].message == "on purpose", "the failure must keep the message")

    both = TestResult()
    TestSuite.from_class(Probe).run(both)
    check(
        both.summary() == "2 run, 1 failed", f'a suite must run every test, got "{both.summary()}"'
    )

    print("bootstrap: ok")


if __name__ == "__main__":
    main()
