defmodule SortingRace.Bench do
  @moduledoc """
  EN: `SortingRace.Bench.main([algorithm, variant, n])` reads `data/<variant>-<n>.txt`, sorts it
  and prints one JSON line in the benchmark contract. Only the sort is timed.

  PT: `SortingRace.Bench.main([algoritmo, variante, n])` lê `data/<variante>-<n>.txt`, ordena e
  imprime uma linha JSON no contrato de benchmark. Só a ordenação é cronometrada.
  """

  @variants ["random", "sorted", "reversed"]
  @max_value 2_147_483_647

  @spec main([String.t()]) :: :ok
  def main([implementation, variant, size]) when variant in @variants do
    sort = Map.fetch!(SortingRace.sorts(), implementation)
    n = String.to_integer(size)
    values = read_values("data/#{variant}-#{n}.txt", n)

    {micros, sorted} = best_of(sort, values, 5, 0, nil)

    IO.puts(
      ~s({"n":#{n},"elapsedMs":#{:erlang.float_to_binary(micros / 1000, decimals: 3)},) <>
        ~s("memoryKb":#{peak_memory_kb()},"language":"elixir",) <>
        ~s("implementation":"#{implementation}","checksum":"#{SortingRace.checksum(sorted)}"})
    )
  end

  def main(_args) do
    IO.puts(:stderr, "usage: <algorithm> <random|sorted|reversed> <n>")
    System.halt(2)
  end

  # EN: Up to 5 runs while the total stays under 300 ms, and the fastest one is kept: the minimum
  #     is the measurement least disturbed by other programs on the machine.
  # PT: Até 5 execuções enquanto o total fica abaixo de 300 ms, e a mais rápida é mantida: o
  #     mínimo é a medida menos perturbada por outros programas na máquina.
  defp best_of(_sort, _values, left, spent, best)
       when best != nil and (left == 0 or spent >= 300_000),
       do: best

  defp best_of(sort, values, left, spent, best) do
    {micros, sorted} = :timer.tc(fn -> sort.(values) end)
    kept = if best == nil or micros < elem(best, 0), do: {micros, sorted}, else: best
    best_of(sort, values, left - 1, spent + micros, kept)
  end

  # EN: The file is external input: anything that is not an integer in range raises an error.
  # PT: O arquivo é entrada externa: o que não for um inteiro dentro da faixa gera um erro.
  defp read_values(path, expected) do
    values =
      path |> File.read!() |> String.split("\n", trim: true) |> Enum.map(&String.to_integer/1)

    if length(values) != expected or Enum.any?(values, &(&1 < 0 or &1 > @max_value)) do
      raise ArgumentError, "#{path}: expected #{expected} integers from 0 to #{@max_value}"
    end

    values
  end

  # EN: VmHWM ("high water mark") in /proc/self/status is the peak resident memory in kibibytes.
  # PT: VmHWM ("marca d'água") em /proc/self/status é o pico de memória residente em kibibytes.
  defp peak_memory_kb do
    case Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status")) do
      [_, kb] -> String.to_integer(kb)
      _ -> 0
    end
  end
end
