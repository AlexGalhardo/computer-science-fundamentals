# EN: Memory workload in Elixir: `binary-trees` and `idle`. BEAM model: one private heap per
#     process, collected by a generational copying collector that runs for that process only.
#     There is no global pause: collecting one process never stops the others, and when a
#     process ends its whole heap is released at once. Data is immutable, so a tree is built
#     bottom-up from tuples and never changed.
# PT: Carga de memória em Elixir: `binary-trees` e `idle`. Modelo da BEAM: um heap privado por
#     processo, coletado por um coletor geracional de cópia que roda só para aquele processo.
#     Não existe pausa global: coletar um processo nunca para os outros, e quando um processo
#     termina seu heap inteiro é liberado de uma vez. Os dados são imutáveis, então uma árvore
#     é construída de baixo para cima com tuplas e nunca alterada.
# ES: Carga de memoria en Elixir: `binary-trees` e `idle`. Modelo de la BEAM: un heap privado por
#     proceso, recolectado por un recolector generacional de copia que corre solo para ese proceso.
#     No existe pausa global: recolectar un proceso nunca detiene a los demás, y cuando un proceso
#     termina todo su heap se libera de una vez. Los datos son inmutables, así que un árbol
#     se construye de abajo hacia arriba con tuplas y nunca se modifica.
defmodule Main do
  import Bitwise

  @min_depth 4

  defp make(0), do: {nil, nil}
  defp make(depth), do: {make(depth - 1), make(depth - 1)}

  # EN: Walks the whole tree and counts its nodes.
  # PT: Percorre a árvore inteira e conta os nós.
  # ES: Recorre el árbol completo y cuenta los nodos.
  defp check({nil, nil}), do: 1
  defp check({left, right}), do: 1 + check(left) + check(right)

  defp repeat(0, _depth, total), do: total
  defp repeat(left, depth, total), do: repeat(left - 1, depth, total + check(make(depth)))

  defp binary_trees(n) do
    max_depth = max(@min_depth + 2, n)
    total = check(make(max_depth + 1))
    long_lived = make(max_depth)

    total =
      Enum.reduce(@min_depth..max_depth//2, total, fn depth, acc ->
        repeat(1 <<< (max_depth - depth + @min_depth), depth, acc)
      end)

    total + check(long_lived)
  end

  defp peak_memory_kb do
    case Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status")) do
      [_, kb] -> String.to_integer(kb)
      _ -> 0
    end
  end

  def main(args) do
    implementation = Enum.at(args, 0, "binary-trees")
    n = args |> Enum.at(1, "10") |> String.to_integer()

    start = System.monotonic_time(:microsecond)
    checksum = if implementation == "idle", do: "idle", else: Integer.to_string(binary_trees(n))
    elapsed_ms = (System.monotonic_time(:microsecond) - start) / 1000

    IO.puts(
      ~s({"n":#{n},"elapsedMs":#{elapsed_ms},"memoryKb":#{peak_memory_kb()},) <>
        ~s("language":"elixir","implementation":"#{implementation}","checksum":"#{checksum}"})
    )
  end
end
