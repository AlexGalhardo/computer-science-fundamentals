defmodule SortingRaceTest do
  use ExUnit.Case, async: true

  @max_value 2_147_483_647

  # EN: Linear congruential generator with a fixed seed, so the test is reproducible.
  # PT: Gerador congruente linear com semente fixa, para o teste ser reproduzível.
  defp random_values(n, seed) do
    {values, _} =
      Enum.map_reduce(1..n, seed, fn _, state ->
        next = rem(state * 1_103_515_245 + 12_345, 2_147_483_648)
        {next, next}
      end)

    values
  end

  # EN: Same six cases as the TypeScript reference. The oracle is Enum.sort: being equal to it
  #     means ordered and a permutation of the input.
  # PT: Mesmos seis casos da referência em TypeScript. O oráculo é o Enum.sort: ser igual a ele
  #     significa estar em ordem e ser uma permutação da entrada.
  defp cases do
    [
      {"empty", []},
      {"single element", [42]},
      {"sorted", [1, 2, 3, 4, 5, 6, 7, 8]},
      {"reversed", [8, 7, 6, 5, 4, 3, 2, 1]},
      {"duplicated", [5, 3, 5, 1, 3, 3, 0, @max_value, 5, 0, @max_value]},
      {"random", random_values(1000, 7)}
    ]
  end

  for name <- ["bubble", "insertion", "merge", "quick", "heap", "radix"] do
    test "#{name} sorts every case" do
      sort = Map.fetch!(SortingRace.sorts(), unquote(name))

      for {label, input} <- cases() do
        assert sort.(input) == Enum.sort(input), "#{unquote(name)}: #{label}"
      end
    end
  end

  test "checksum depends on the order" do
    assert SortingRace.checksum([1, 2, 3]) == "1026"
    refute SortingRace.checksum([3, 2, 1]) == SortingRace.checksum([1, 2, 3])
  end
end
