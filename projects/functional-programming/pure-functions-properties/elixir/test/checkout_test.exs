defmodule PureFunctionsProperties.CheckoutTest do
  use ExUnit.Case, async: true

  alias PureFunctionsProperties.{Cases, Checkout, Prop}

  describe "the pure version is tested with plain values" do
    # EN: No mock, no fake clock, no setup: the instant is just another argument.
    # PT: Sem mock, sem relógio falso, sem preparação: o instante é só mais um argumento.
    test "every shared example" do
      %{"now" => now, "examples" => examples} = Cases.load()["checkout"]

      for example <- examples do
        assert Checkout.price_order(Cases.order(example["order"]), now) ==
                 Cases.price(example["expected"]),
               example["name"]
      end
    end

    test "the same arguments always give the same result" do
      order = %{items: [%{unit_cents: 250, quantity: 4}], coupon: %{percent: 20, expires_at: 50}}
      assert Checkout.price_order(order, 10) == Checkout.price_order(order, 10)
    end
  end

  describe "the impure version" do
    # EN: Same order, two calls, two different answers: the hidden counter leaks into the
    #     result. This is the definition of "not referentially transparent".
    # PT: Mesmo pedido, duas chamadas, duas respostas diferentes: o contador oculto vaza para
    #     o resultado. É a definição de "não é referencialmente transparente".
    test "returns different values for the same argument" do
      order = %{items: [%{unit_cents: 100, quantity: 1}], coupon: nil}
      first = Checkout.price_order_impure(order)
      second = Checkout.price_order_impure(order)
      assert second != first
      assert second.receipt_number == first.receipt_number + 1
    end
  end

  describe "invariants" do
    # EN: A generated order: up to 8 items and maybe a coupon. The generator works with
    #     tuples, and `to_order/1` gives them names.
    # PT: Um pedido gerado: até 8 itens e talvez um cupom. O gerador trabalha com tuplas, e
    #     `to_order/1` dá nome a elas.
    defp orders do
      Prop.tuple([
        Prop.list_of(Prop.tuple([Prop.int(0, 100_000), Prop.int(0, 20)]), 8),
        Prop.one_of([false, true]),
        Prop.int(0, 100),
        Prop.int(0, 2000),
        Prop.int(0, 2000)
      ])
    end

    defp to_order({items, has_coupon, percent, expires_at, _now}) do
      %{
        items:
          Enum.map(items, fn {unit_cents, quantity} ->
            %{unit_cents: unit_cents, quantity: quantity}
          end),
        coupon: if(has_coupon, do: %{percent: percent, expires_at: expires_at})
      }
    end

    # EN: Invariants are facts that hold for every order, whatever the numbers: the discount
    #     is never negative and never larger than the subtotal, and the three fields add up.
    # PT: Invariantes são fatos que valem para todo pedido, quaisquer que sejam os números: o
    #     desconto nunca é negativo nem maior que o subtotal, e os três campos fecham a conta.
    test "0 <= discount <= subtotal and total = subtotal - discount" do
      property = fn generated ->
        price = Checkout.price_order(to_order(generated), elem(generated, 4))

        price.discount_cents >= 0 and price.discount_cents <= price.subtotal_cents and
          price.total_cents == price.subtotal_cents - price.discount_cents
      end

      assert Prop.check(orders(), property, runs: 300) == {:ok, 300}
    end

    test "an expired coupon never changes the total" do
      property = fn generated ->
        order = to_order(generated)
        after_expiry = if order.coupon, do: order.coupon.expires_at + 1, else: 1
        Checkout.price_order(order, after_expiry).discount_cents == 0
      end

      assert Prop.check(orders(), property, runs: 300) == {:ok, 300}
    end
  end
end
