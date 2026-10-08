defmodule PureFunctionsProperties.NormalizeTest do
  use ExUnit.Case, async: true

  alias PureFunctionsProperties.{Cases, Normalize, Prop}

  test "every shared example" do
    for [name, code] <- Cases.load()["normalize"]["examples"] do
      assert Normalize.normalize_code(name) == code
    end
  end

  # EN: Idempotence: applying the function twice equals applying it once. The alphabet has
  #     spaces, a tab, both letter cases and a hyphen, the characters the function treats
  #     differently.
  # PT: Idempotência: aplicar a função duas vezes é igual a aplicar uma. O alfabeto tem
  #     espaços, tabulação, letras maiúsculas e minúsculas e hífen, os caracteres que a
  #     função trata de forma diferente.
  test "normalizing twice equals normalizing once" do
    names = Prop.run_string("a B\t-", 8, 3)

    property = fn name ->
      once = Normalize.normalize_code(name)
      Normalize.normalize_code(once) == once
    end

    assert Prop.check(names, property, runs: 500) == {:ok, 500}
  end
end
