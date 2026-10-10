# EN: Parallelism workload in Elixir: count the primes below n, range cut into 256 chunks.
#     BEAM model: lightweight processes on scheduler threads. The VM starts one scheduler per
#     core, each with its own run queue, and moves processes between queues to balance the
#     load. `Task.async_stream` starts one process per chunk and keeps at most `workers` of
#     them alive at a time, so `workers` cores are busy. Processes share no memory: each one
#     returns its count as a message.
# PT: Carga de paralelismo em Elixir: conta os primos abaixo de n, intervalo cortado em 256
#     pedaços. Modelo da BEAM: processos leves sobre threads escalonadoras. A VM sobe um
#     escalonador por núcleo, cada um com sua fila de execução, e move processos entre as filas
#     para equilibrar a carga. O `Task.async_stream` cria um processo por pedaço e mantém no
#     máximo `workers` deles vivos por vez, então `workers` núcleos ficam ocupados. Processos
#     não compartilham memória: cada um devolve sua contagem como mensagem.
# ES: Carga de paralelismo en Elixir: cuenta los primos por debajo de n, rango cortado en 256
#     pedazos. Modelo de la BEAM: procesos livianos sobre threads planificadores. La VM levanta un
#     planificador por núcleo, cada uno con su cola de ejecución, y mueve procesos entre las colas
#     para equilibrar la carga. `Task.async_stream` crea un proceso por pedazo y mantiene como
#     máximo `workers` de ellos vivos a la vez, así que `workers` núcleos quedan ocupados. Los procesos
#     no comparten memoria: cada uno devuelve su conteo como mensaje.
defmodule Main do
  @chunks 256

  defp prime?(k) when k < 2, do: false
  defp prime?(k) when k < 4, do: true
  defp prime?(k) when rem(k, 2) == 0, do: false
  defp prime?(k), do: no_divisor?(k, 3)

  defp no_divisor?(k, d) when d * d > k, do: true
  defp no_divisor?(k, d) when rem(k, d) == 0, do: false
  defp no_divisor?(k, d), do: no_divisor?(k, d + 2)

  # EN: Chunk c covers [c*n/256, (c+1)*n/256).
  # PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
  # ES: El pedazo c cubre [c*n/256, (c+1)*n/256).
  defp count_chunk(chunk, n) do
    count_range(div(chunk * n, @chunks), div((chunk + 1) * n, @chunks), 0)
  end

  defp count_range(k, stop, count) when k >= stop, do: count

  defp count_range(k, stop, count),
    do: count_range(k + 1, stop, if(prime?(k), do: count + 1, else: count))

  defp count_primes(n, workers) do
    0..(@chunks - 1)
    |> Task.async_stream(&count_chunk(&1, n),
      max_concurrency: workers,
      ordered: false,
      timeout: :infinity
    )
    |> Enum.reduce(0, fn {:ok, count}, total -> total + count end)
  end

  defp peak_memory_kb do
    case Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status")) do
      [_, kb] -> String.to_integer(kb)
      _ -> 0
    end
  end

  def main(args) do
    implementation = Enum.at(args, 0, "primes")
    n = args |> Enum.at(1, "100000") |> String.to_integer()
    workers = args |> Enum.at(2, "1") |> String.to_integer()

    start = System.monotonic_time(:microsecond)
    total = count_primes(n, workers)
    elapsed_ms = (System.monotonic_time(:microsecond) - start) / 1000

    IO.puts(
      ~s({"n":#{n},"elapsedMs":#{elapsed_ms},"memoryKb":#{peak_memory_kb()},) <>
        ~s("language":"elixir","implementation":"#{implementation}","checksum":"#{total}"})
    )
  end
end
