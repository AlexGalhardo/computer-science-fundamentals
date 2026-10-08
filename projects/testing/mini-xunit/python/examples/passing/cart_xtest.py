"""What using the framework looks like."""

from __future__ import annotations

from examples.cart import Cart
from mini_xunit import TestCase

# EN: Extend TestCase, build the fixture in `set_up`, write methods whose names start with
#     "test_". Each method gets its own new Cart.
# PT: Estenda TestCase, monte a fixture no `set_up`, escreva métodos cujos nomes começam com
#     "test_". Cada método recebe um Cart novo só dele.


class CartTest(TestCase):
    def set_up(self) -> None:
        self.cart = Cart()

    def test_empty_cart_costs_nothing(self) -> None:
        self.assert_equal(self.cart.total(), 0)

    def test_total_below_the_discount(self) -> None:
        self.cart.add(40)
        self.cart.add(59)
        self.assert_equal(self.cart.total(), 99)

    def test_total_with_discount(self) -> None:
        self.cart.add(100)
        self.assert_equal(self.cart.total(), 90)

    def test_rejects_a_negative_price(self) -> None:
        self.assert_raises(ValueError, lambda: self.cart.add(-1), "must be positive")
