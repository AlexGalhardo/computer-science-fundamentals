defmodule PureFunctionsProperties.PropTest do
  use ExUnit.Case, async: true

  alias PureFunctionsProperties.Prop

  describe "the generator is pure" do
    test "the same seed gives the same value and the same next seed" do
      assert Prop.random_int(42, 0, 99) == Prop.random_int(42, 0, 99)
      assert Prop.next_seed(42) == 1_083_814_273
    end

    test "values stay inside the bounds" do
      assert Prop.check(Prop.int(-5, 5), &(&1 >= -5 and &1 <= 5), runs: 500) == {:ok, 500}
    end
  end

  describe "shrinking" do
    # EN: The property "every number is below 50" is false. Whatever large number the
    #     generator finds first, shrinking must end at the boundary, 50.
    # PT: A propriedade "todo número é menor que 50" é falsa. Qualquer que seja o número
    #     grande que o gerador ache primeiro, a redução precisa terminar na fronteira, 50.
    test "an integer shrinks to the smallest failing value" do
      assert {:error, %{shrunk: 50}} = Prop.check(Prop.int(0, 1000), &(&1 < 50))
    end

    # EN: "No list has three elements or more" is false, and the smallest list that shows it
    #     is three zeros.
    # PT: "Nenhuma lista tem três elementos ou mais" é falsa, e a menor lista que mostra isso
    #     são três zeros.
    test "a list shrinks to the shortest failing list of the simplest elements" do
      assert {:error, %{shrunk: [0, 0, 0]}} =
               Prop.check(Prop.list_of(Prop.int(0, 100), 10), &(length(&1) < 3))
    end
  end
end
