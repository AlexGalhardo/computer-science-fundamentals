"""Fails on purpose: the demo of a red run."""

from __future__ import annotations

from examples.cart import Cart
from mini_xunit import TestCase

# EN: FAILS ON PURPOSE. One test has a wrong expectation, so the framework must print its name,
#     the message and the file and line, and the process must exit with a non-zero code. This
#     folder is never part of the self-test folder.
# PT: FALHA DE PROPÓSITO. Um teste tem uma expectativa errada, então o framework precisa imprimir
#     o nome, a mensagem e o arquivo com a linha, e o processo precisa sair com um código
#     diferente de zero. Esta pasta nunca faz parte da pasta de autotestes.
# ES: FALLA A PROPÓSITO. Una prueba tiene una expectativa errónea, así que el framework debe
#     imprimir el nombre, el mensaje y el archivo con la línea, y el proceso debe salir con un
#     código distinto de cero. Esta carpeta nunca forma parte de la carpeta de autopruebas.


class CartTest(TestCase):
    def set_up(self) -> None:
        self.cart = Cart()

    def test_empty_cart_costs_nothing(self) -> None:
        self.assert_equal(self.cart.total(), 0)

    def test_total_with_discount(self) -> None:
        self.cart.add(100)
        self.assert_equal(self.cart.total(), 100)  # marker: wrong expectation
