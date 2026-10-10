"""A tiny piece of "application code" for the example tests."""

from __future__ import annotations

# EN: A cart with a 10% discount from 100 upwards.
# PT: Um carrinho com 10% de desconto a partir de 100.
# ES: Un carrito con 10% de descuento a partir de 100.


class Cart:
    def __init__(self) -> None:
        self.prices: list[float] = []

    def add(self, price: float) -> None:
        if price <= 0:
            raise ValueError("a price must be positive")
        self.prices.append(price)

    def total(self) -> float:
        total = sum(self.prices)
        return total * 0.9 if total >= 100 else total
