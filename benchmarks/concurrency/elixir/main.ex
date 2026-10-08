# EN: Concurrency workload in Elixir: n processes wait for a message, receive it, and each one
#     sends its number back. The sum is the checksum.
#     BEAM model: processes. A BEAM process is not an OS process: it is a tiny unit owned by
#     the VM, with its own heap, stack and mailbox, and a few hundred words of memory at
#     start. The VM runs them on one scheduler thread per core and preempts a process after a
#     budget of "reductions" (roughly function calls), so no process can hold a core for long.
#     Processes share nothing, and the only way to talk is to send a message.
# PT: Carga de concorrência em Elixir: n processos esperam uma mensagem, a recebem, e cada um
#     envia seu número de volta. A soma é o checksum.
#     Modelo da BEAM: processos. Um processo da BEAM não é um processo do SO: é uma unidade
#     minúscula da própria VM, com heap, pilha e caixa de mensagens próprios, e algumas
#     centenas de palavras de memória ao nascer. A VM os roda em uma thread escalonadora por
#     núcleo e preempta um processo depois de um orçamento de "reduções" (mais ou menos chamadas
#     de função), então nenhum processo segura um núcleo por muito tempo. Processos não
#     compartilham nada, e o único jeito de conversar é enviar uma mensagem.
defmodule Main do
  defp run(n) do
    parent = self()

    # EN: Here the gate is a message: every process blocks in `receive` until `:go` arrives.
    # PT: Aqui o portão é uma mensagem: cada processo bloqueia no `receive` até o `:go` chegar.
    pids =
      for id <- 0..(n - 1)//1 do
        spawn(fn ->
          receive do
            :go -> send(parent, {:done, id})
          end
        end)
      end

    Enum.each(pids, &send(&1, :go))
    collect(n, 0)
  end

  defp collect(0, sum), do: sum

  defp collect(left, sum) do
    receive do
      {:done, id} -> collect(left - 1, sum + id)
    end
  end

  defp peak_memory_kb do
    case Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status")) do
      [_, kb] -> String.to_integer(kb)
      _ -> 0
    end
  end

  def main(args) do
    implementation = Enum.at(args, 0, "processes")
    n = args |> Enum.at(1, "1000") |> String.to_integer()

    start = System.monotonic_time(:microsecond)
    sum = run(n)
    elapsed_ms = (System.monotonic_time(:microsecond) - start) / 1000

    IO.puts(
      ~s({"n":#{n},"elapsedMs":#{elapsed_ms},"memoryKb":#{peak_memory_kb()},) <>
        ~s("language":"elixir","implementation":"#{implementation}","checksum":"#{sum}"})
    )
  end
end
