defmodule CartTest do
  use ExUnit.Case, async: true

  # EN: The acceptance test of the mini-project: one test per scenario of the shared file, the
  #     same file the Java and TypeScript versions read. The tests are generated at compile
  #     time from the file.
  # PT: O teste de aceitação do mini-projeto: um teste por cenário do arquivo compartilhado, o
  #     mesmo arquivo que as versões em Java e TypeScript leem. Os testes são gerados em tempo
  #     de compilação a partir do arquivo.
  # ES: La prueba de aceptación del miniproyecto: una prueba por escenario del archivo compartido,
  #     el mismo archivo que leen las versiones en Java y TypeScript. Las pruebas se generan en
  #     tiempo de compilación a partir del archivo.
  @external_resource Scenarios.path()
  scenarios = Scenarios.load()

  test "the shared file has receipts and rejections" do
    outcomes =
      Enum.map(unquote(Macro.escape(scenarios)), fn {_name, _cart, {kind, _}} -> kind end)

    assert length(outcomes) >= 15
    assert :ok in outcomes
    assert :error in outcomes
  end

  for {name, cart, expected} <- scenarios do
    test "scenario: #{name}" do
      assert Cart.price(unquote(Macro.escape(cart))) == unquote(Macro.escape(expected))
    end
  end

  describe "no input is mutated" do
    # EN: In Elixir this is a property of the language, not of this module: there is no
    #     operation that changes a map or a list in place. The test makes it visible. The name
    #     `cart` stays bound to the same value while four functions "change" it.
    # PT: Em Elixir isto é uma propriedade da linguagem, não deste módulo: não existe operação
    #     que altere um mapa ou uma lista no lugar. O teste torna isso visível. O nome `cart`
    #     continua ligado ao mesmo valor enquanto quatro funções o "alteram".
    # ES: En Elixir esto es una propiedad del lenguaje, no de este módulo: no existe ninguna
    #     operación que modifique un mapa o una lista en el mismo lugar. La prueba lo hace visible.
    #     El nombre `cart` sigue ligado al mismo valor mientras cuatro funciones lo "modifican".
    test "the cart given to each function is still the same value afterwards" do
      cart =
        Cart.new()
        |> Cart.add_line("PEN", 250, 4)
        |> Cart.add_rule({:percent_coupon, "WELCOME10", 10})

      snapshot = :erlang.term_to_binary(cart)

      bigger = Cart.add_line(cart, "BOOK", 4000, 1)
      with_coupon = Cart.add_rule(cart, {:fixed_coupon, "FIVE", 500})
      taxed = Cart.with_tax(cart, {:flat, 825})
      {:ok, receipt} = Cart.price(cart)

      assert :erlang.term_to_binary(cart) == snapshot
      assert length(cart.lines) == 1 and length(bigger.lines) == 2
      assert length(cart.rules) == 1 and length(with_coupon.rules) == 2
      assert cart.tax == :none and taxed.tax == {:flat, 825}
      assert receipt.total_cents == 900
    end

    test "every shared scenario leaves its cart unchanged and gives the same answer twice" do
      for {_name, cart, _expected} <- unquote(Macro.escape(scenarios)) do
        snapshot = :erlang.term_to_binary(cart)
        first = Cart.price(cart)
        assert Cart.price(cart) == first
        assert :erlang.term_to_binary(cart) == snapshot
      end
    end
  end

  describe "errors are values" do
    test "the first invalid part decides the error" do
      cart =
        Cart.new() |> Cart.add_line("PEN", 250, 0) |> Cart.add_rule({:percent_coupon, "X", 120})

      assert Cart.price(cart) == {:error, :invalid_quantity}
    end

    test "an unknown rule shape is rejected instead of crashing" do
      cart = Cart.new() |> Cart.add_line("PEN", 250, 1) |> Cart.add_rule({:mystery, 1})
      assert Cart.price(cart) == {:error, :invalid_rule}
    end
  end

  test "the demo formats a receipt and a rejection" do
    receipt = %{
      subtotal_cents: 500,
      discounts: [{"coupon FIVE: 5.00 off", 500}],
      tax_cents: 0,
      total_cents: 0
    }

    assert Scenarios.format({:ok, receipt}) ==
             "  subtotal 5.00\n  - 5.00  coupon FIVE: 5.00 off\n  tax 0.00\n  total 0.00"

    assert Scenarios.format({:error, :invalid_tax}) == "  rejected: invalid-tax"
  end
end
