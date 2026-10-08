defmodule Mix.Tasks.Cart.Demo do
  @shortdoc "Prints the receipt of every shared scenario"
  @moduledoc """
  `mix cart.demo` prints the receipt of every scenario of `scenarios.txt`, computed by `Cart`.
  """

  use Mix.Task

  @impl Mix.Task
  def run(_args) do
    for {name, cart, _expected} <- Scenarios.load() do
      IO.puts("== #{name}")
      IO.puts(Scenarios.format(Cart.price(cart)))
    end
  end
end
