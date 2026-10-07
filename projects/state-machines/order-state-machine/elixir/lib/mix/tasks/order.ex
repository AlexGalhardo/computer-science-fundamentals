defmodule Mix.Tasks.Order do
  @shortdoc "Walks an order through the given events"
  @moduledoc """
  EN: `mix order pay ship deliver` walks one order; `mix order demo` runs the demo.
  PT: `mix order pay ship deliver` conduz um pedido; `mix order demo` roda a demonstração.
  """

  use Mix.Task

  @impl Mix.Task
  def run(args) do
    {output, code} = OrderStateMachine.CLI.run(args)
    IO.puts(output)

    if code != 0 do
      exit({:shutdown, code})
    end
  end
end
