defmodule CounterRace.CLI do
  @moduledoc """
  Demo: runs one counter variant and prints one JSON line (the benchmark contract of the
  repository). With no arguments it runs every variant and prints a small table.
  """

  # EN: 8 workers by default. The benchmark sets WORKERS to 1, 2, 4 and 8 to show how the fix scales.
  # PT: 8 workers por padrão. O benchmark define WORKERS como 1, 2, 4 e 8 para mostrar como a
  #     correção escala.
  defp workers, do: max(1, String.to_integer(System.get_env("WORKERS", "8")))
  @variants %{"actor" => :actor, "get-then-set" => :get_then_set}

  @spec main([String.t()]) :: :ok
  def main([]) do
    n = 1_000_000
    IO.puts(row(["variant", "final", "lost", "ms"]))

    for name <- ["get-then-set", "actor"] do
      {final, ms} = measure(Map.fetch!(@variants, name), n)
      IO.puts(row([name, final, n - final, Float.round(ms, 1)]))
    end

    :ok
  end

  def main([name | rest]) do
    with {:ok, variant} <- Map.fetch(@variants, name),
         {n, ""} when n >= 8 <- Integer.parse(List.first(rest, "1000000")) do
      {final, ms} = measure(variant, n)

      # EN: The checksum is the final value. For a correct counter it equals n.
      # PT: O checksum é o valor final. Em um contador correto ele é igual a n.
      IO.puts(
        ~s({"n":#{n},"elapsedMs":#{Float.round(ms, 3)},"memoryKb":#{peak_memory_kb()},) <>
          ~s("language":"elixir","implementation":"#{name}","checksum":"#{final}"})
      )
    else
      _ ->
        IO.puts(:stderr, "usage: counter-race-elixir <actor|get-then-set> <n of at least 8>")
        System.halt(2)
    end
  end

  defp measure(variant, n) do
    {micros, final} = :timer.tc(fn -> CounterRace.run(variant, workers(), div(n, workers())) end)
    {final, micros / 1000}
  end

  defp row([name | cells]) do
    String.pad_trailing(name, 12) <>
      Enum.map_join(cells, "", &String.pad_leading(to_string(&1), 11))
  end

  # Peak resident memory of the whole BEAM operating-system process, read from Linux.
  defp peak_memory_kb do
    with {:ok, status} <- File.read("/proc/self/status"),
         [_, kb] <- Regex.run(~r/VmHWM:\s+(\d+) kB/, status) do
      String.to_integer(kb)
    else
      _ -> 0
    end
  end
end
