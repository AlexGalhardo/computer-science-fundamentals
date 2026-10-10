"""The core of the framework: TestCase, TestResult, TestSuite and the assertions."""

from __future__ import annotations

import traceback
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

# EN: A whole xUnit framework with no test library: only classes, exceptions and a loop.
#       TestCase    one test: a name, a method with that name, and a fixture around it
#       TestResult  the collector: how many ran, which failed and why
#       TestSuite   a list of things that can run (tests or other suites)
#       assertions  methods that raise when an expectation is not met
# PT: Um framework xUnit inteiro sem biblioteca de testes: só classes, exceções e um laço.
#       TestCase    um teste: um nome, um método com esse nome e uma fixture em volta
#       TestResult  o coletor: quantos rodaram, quais falharam e por quê
#       TestSuite   uma lista de coisas que sabem rodar (testes ou outras suítes)
#       asserções   métodos que lançam quando uma expectativa não é atendida
# ES: Un framework xUnit entero sin biblioteca de pruebas: solo clases, excepciones y un bucle.
#       TestCase    una prueba: un nombre, un método con ese nombre y un fixture alrededor
#       TestResult  el recolector: cuántas se ejecutaron, cuáles fallaron y por qué
#       TestSuite   una lista de cosas que saben ejecutarse (pruebas u otras suites)
#       aserciones  métodos que lanzan cuando no se cumple una expectativa

FRAMEWORK_DIR = Path(__file__).resolve().parent


class AssertionFailure(Exception):
    """Raised by the assert methods of TestCase."""


@dataclass(frozen=True)
class Failure:
    test: str
    message: str
    location: str


def location_of(error: BaseException) -> str:
    # EN: The location of a failure is the deepest frame of the traceback that is NOT inside the
    #     framework. An assertion raises from `assert_equal`, in this file, but what the reader
    #     needs is the line of the test that called it.
    # PT: O local de uma falha é o quadro mais profundo do traceback que NÃO está dentro do
    #     framework. Uma asserção lança de dentro do `assert_equal`, neste arquivo, mas o que o
    #     leitor precisa é da linha do teste que a chamou.
    # ES: El lugar de un fallo es el marco más profundo del traceback que NO está dentro del
    #     framework. Una aserción lanza desde dentro de `assert_equal`, en este archivo, pero lo que
    #     el lector necesita es la línea de la prueba que la llamó.
    for frame in reversed(traceback.extract_tb(error.__traceback__)):
        file = Path(frame.filename).resolve()
        if FRAMEWORK_DIR in file.parents:
            continue
        try:
            shown = file.relative_to(Path.cwd())
        except ValueError:
            shown = file
        return f"{shown.as_posix()}:{frame.lineno}"
    return "unknown location"


class TestResult:
    def __init__(self) -> None:
        self.run_count = 0
        self.failures: list[Failure] = []

    def test_started(self) -> None:
        self.run_count += 1

    def test_failed(self, test: str, error: BaseException) -> None:
        self.failures.append(Failure(test, str(error), location_of(error)))

    def was_successful(self) -> bool:
        return not self.failures

    def summary(self) -> str:
        return f"{self.run_count} run, {len(self.failures)} failed"


class TestCase:
    def __init__(self, name: str) -> None:
        self.name = name

    # EN: The fixture: `set_up` builds what the test needs, `tear_down` cleans it up. Subclasses
    #     override them. The defaults do nothing.
    # PT: A fixture: o `set_up` monta o que o teste precisa, o `tear_down` limpa. As subclasses os
    #     sobrescrevem. Os padrões não fazem nada.
    # ES: El fixture: `set_up` arma lo que la prueba necesita, `tear_down` limpia. Las subclases los
    #     sobrescriben. Los valores por defecto no hacen nada.
    def set_up(self) -> None:
        pass

    def tear_down(self) -> None:
        pass

    def label(self) -> str:
        return f"{type(self).__name__}.{self.name}"

    def run(self, result: TestResult) -> None:
        # EN: The Template Method at the heart of xUnit: set_up, the test method, tear_down,
        #     always in that order. Two details matter:
        #       - `tear_down` is in a `finally`, so it runs even when the test fails
        #       - an exception is CAUGHT and recorded, never re-raised, so one failing test
        #         cannot stop the tests that come after it
        #     The method to call is looked up by name at run time with `getattr` (Pluggable
        #     Selector): that is how one class holds many tests.
        # PT: O Template Method no coração do xUnit: set_up, o método de teste, tear_down, sempre
        #     nessa ordem. Dois detalhes importam:
        #       - o `tear_down` fica em um `finally`, então roda mesmo quando o teste falha
        #       - uma exceção é CAPTURADA e registrada, nunca relançada, então um teste que falha
        #         não consegue parar os testes que vêm depois
        #     O método a chamar é procurado pelo nome em tempo de execução com `getattr`
        #     (Pluggable Selector): é assim que uma classe guarda vários testes.
        # ES: El Template Method en el corazón de xUnit: set_up, el método de prueba, tear_down,
        #     siempre en ese orden. Dos detalles importan:
        #       - `tear_down` va en un `finally`, así que se ejecuta incluso cuando la prueba falla
        #       - una excepción se CAPTURA y se registra, nunca se relanza, así que una prueba que
        #         falla no puede detener las pruebas que vienen después
        #     El método a llamar se busca por nombre en tiempo de ejecución con `getattr`
        #     (Pluggable Selector): así es como una clase guarda varias pruebas.
        result.test_started()
        try:
            self.set_up()
            try:
                method = getattr(self, self.name, None)
                if not callable(method):
                    raise LookupError(f"no test method named {self.name}")
                method()
            finally:
                self.tear_down()
        except Exception as error:
            result.test_failed(self.label(), error)

    # EN: An assertion is just an `if` that raises. The message says what was expected and what
    #     arrived, because that is the first thing the reader of a red test wants to know.
    # PT: Uma asserção é só um `if` que lança. A mensagem diz o que era esperado e o que chegou,
    #     porque é a primeira coisa que o leitor de um teste vermelho quer saber.
    # ES: Una aserción es solo un `if` que lanza. El mensaje dice qué se esperaba y qué llegó,
    #     porque es lo primero que quiere saber quien lee una prueba en rojo.
    def assert_equal(self, actual: object, expected: object) -> None:
        if actual != expected:
            raise AssertionFailure(f"expected {expected!r} but got {actual!r}")

    def assert_true(
        self, condition: bool, message: str = "expected the condition to be true"
    ) -> None:
        if not condition:
            raise AssertionFailure(message)

    def assert_raises(
        self, expected: type[BaseException], action: Callable[[], object], message: str = ""
    ) -> None:
        try:
            action()
        except expected as error:
            if message not in str(error):
                raise AssertionFailure(
                    f'expected an error containing "{message}" but got "{error}"'
                ) from error
            return
        raise AssertionFailure(f"expected {expected.__name__} but nothing was raised")


def test_method_names(test_class: type[TestCase]) -> list[str]:
    # EN: Discovery inside a class: every callable attribute whose name starts with "test_" is a
    #     test. `dir` already includes the methods inherited from parent classes, and sorts them.
    # PT: Descoberta dentro de uma classe: todo atributo chamável cujo nome começa com "test_" é
    #     um teste. O `dir` já inclui os métodos herdados das classes mães, e os ordena.
    # ES: Descubrimiento dentro de una clase: todo atributo invocable cuyo nombre empieza con
    #     "test_" es una prueba. `dir` ya incluye los métodos heredados de las clases madre, y los
    #     ordena.
    return [
        name
        for name in dir(test_class)
        if name.startswith("test_") and callable(getattr(test_class, name))
    ]


class TestSuite:
    # EN: Anything with `run(result)` can be put in a suite: a single test or another suite. From
    #     outside they look the same (the Composite pattern).
    # PT: Qualquer coisa com `run(result)` pode entrar em uma suíte: um teste sozinho ou outra
    #     suíte. Por fora eles têm a mesma cara (o padrão Composite).
    # ES: Cualquier cosa con `run(result)` puede entrar en una suite: una prueba sola u otra
    #     suite. Por fuera se ven iguales (el patrón Composite).
    def __init__(self) -> None:
        self.tests: list[TestCase | TestSuite] = []

    @classmethod
    def from_class(cls, test_class: type[TestCase]) -> TestSuite:
        # EN: ONE NEW INSTANCE PER TEST METHOD, so each test starts from a fresh fixture and
        #     cannot see attributes changed by another test.
        # PT: UMA INSTÂNCIA NOVA POR MÉTODO DE TESTE, então cada teste parte de uma fixture nova
        #     e não enxerga atributos alterados por outro teste.
        # ES: UNA INSTANCIA NUEVA POR MÉTODO DE PRUEBA, así cada prueba parte de un fixture
        #     nuevo y no ve atributos modificados por otra prueba.
        suite = cls()
        for name in test_method_names(test_class):
            suite.add(test_class(name))
        return suite

    def add(self, test: TestCase | TestSuite) -> None:
        self.tests.append(test)

    def run(self, result: TestResult) -> None:
        for test in self.tests:
            test.run(result)
