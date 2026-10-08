defmodule Mix.Tasks.Demo do
  @shortdoc "Prints the three lessons of the mini-project"
  @moduledoc """
  EN: `mix demo` prints the three lessons of the mini-project, one after the other. This task
      is part of the imperative shell: it prints, and everything it prints was computed by
      pure functions.
  PT: `mix demo` imprime as três lições do mini-projeto, uma depois da outra. Esta task faz
      parte da casca imperativa: ela imprime, e tudo o que imprime foi calculado por funções
      puras.
  """

  use Mix.Task

  alias PureFunctionsProperties.{Cases, Checkout, Codec, Pipeline, Prop}

  @impl Mix.Task
  def run(_args) do
    cases = Cases.load()
    order = %{items: [%{unit_cents: 1500, quantity: 2}], coupon: %{percent: 10, expires_at: 1000}}

    IO.puts("1. Impure and pure versions of the same rule")
    IO.puts("   impure, same order twice: #{inspect(Checkout.price_order_impure(order))}")
    IO.puts("                             #{inspect(Checkout.price_order_impure(order))}")
    IO.puts("   pure, now = 1000 twice:   #{inspect(Checkout.price_order(order, 1000))}")
    IO.puts("                             #{inspect(Checkout.price_order(order, 1000))}")
    IO.puts("   pure, now = 1001:         #{inspect(Checkout.price_order(order, 1001))}")
    IO.puts("   shell (reads the clock):  #{Checkout.checkout_now(order)}")

    IO.puts("\n2. A property finds the seeded bug that the examples miss")
    examples = cases["codec"]["examples"]

    all_pass =
      Enum.all?(examples, fn [plain, encoded] -> Codec.decode_buggy(encoded) == plain end)

    verdict = if all_pass, do: "all pass", else: "FAIL"
    IO.puts("   #{length(examples)} example tests against the buggy decoder: #{verdict}")

    texts = Prop.run_string("abc", 6, 12)

    case Prop.check(texts, &(Codec.decode_buggy(Codec.encode(&1)) == &1), runs: 500) do
      {:error, failure} ->
        encoded = Codec.encode(failure.shrunk)

        IO.puts(
          "   round trip, buggy decoder: FAILED on run #{failure.run} (seed #{failure.seed})"
        )

        IO.puts("     original counterexample: #{inspect(failure.original)}")
        IO.puts("     shrunk in #{failure.shrink_steps} steps to:   #{inspect(failure.shrunk)}")

        IO.puts(
          "     encode -> #{inspect(encoded)}, buggy decode -> #{inspect(Codec.decode_buggy(encoded))}"
        )

      {:ok, runs} ->
        IO.puts("   round trip, buggy decoder: passed #{runs} runs (unexpected)")
    end

    case Prop.check(texts, &(Codec.decode(Codec.encode(&1)) == &1), runs: 500) do
      {:ok, runs} -> IO.puts("   round trip, fixed decoder: passed #{runs} runs")
      {:error, _failure} -> IO.puts("   round trip, fixed decoder: FAILED")
    end

    IO.puts(
      "\n3. The same pipeline as in TypeScript: paid orders -> line totals -> by category -> ranked -> top 3"
    )

    cases["pipeline"]["orders"]
    |> Enum.map(&Cases.sales_order/1)
    |> Pipeline.sales_report(cases["pipeline"]["top"])
    |> Enum.each(fn row ->
      IO.puts(
        "   #{String.pad_trailing(row.category, 8)} #{String.pad_leading("#{row.total_cents}", 6)}"
      )
    end)
  end
end
