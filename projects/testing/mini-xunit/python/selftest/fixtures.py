"""Test cases used as subjects by the self-tests."""

from __future__ import annotations

from typing import ClassVar

from mini_xunit import TestCase

# EN: These classes are not tests of the framework themselves, so they live in a file that
#     discovery does not pick up (it is not named `*_xtest.py`). Each one records what happened
#     to it in `log`.
# PT: Estas classes não são testes do framework, então moram em um arquivo que a descoberta não
#     pega (não se chama `*_xtest.py`). Cada uma registra em `log` o que aconteceu com ela.
# ES: Estas clases no son pruebas del framework, así que viven en un archivo que el
#     descubrimiento no toma (no se llama `*_xtest.py`). Cada una registra en `log` lo que le
#     ocurrió.


class WasRun(TestCase):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.log = ""

    def set_up(self) -> None:
        self.log += "set_up "

    def tear_down(self) -> None:
        self.log += "tear_down "

    def test_method(self) -> None:
        self.log += "test_method "

    def test_broken_method(self) -> None:
        self.log += "test_broken_method "
        raise RuntimeError("boom")  # marker: boom

    def test_failed_assertion(self) -> None:
        self.assert_equal(2 + 2, 5)  # marker: assertion

    def helper(self) -> None:
        pass


class BrokenSetUp(TestCase):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.log = ""

    def set_up(self) -> None:
        raise RuntimeError("set_up failed")

    def tear_down(self) -> None:
        self.log += "tear_down "

    def test_method(self) -> None:
        self.log += "test_method "


class Counted(TestCase):
    # EN: Every instance gets a number. If two tests shared one instance, they would share it.
    # PT: Cada instância recebe um número. Se dois testes dividissem uma instância, dividiriam
    #     o número.
    # ES: Cada instancia recibe un número. Si dos pruebas compartieran una instancia, compartirían
    #     el número.
    created: ClassVar[int] = 0
    seen: ClassVar[list[int]] = []

    def __init__(self, name: str) -> None:
        super().__init__(name)
        Counted.created += 1
        self.serial = Counted.created
        self.touched = False

    def record(self) -> None:
        self.assert_true(not self.touched, "the fixture was already used by another test")
        self.touched = True
        Counted.seen.append(self.serial)

    def test_first(self) -> None:
        self.record()

    def test_second(self) -> None:
        self.record()
