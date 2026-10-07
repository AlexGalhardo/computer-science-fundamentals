defmodule SlidingWindowMiniTcp do
  @moduledoc """
  EN: Entry point of the Elixir implementation: runs the three ARQ protocols over the simulated
  channel at several loss rates and prints a Markdown table.

  PT: Ponto de entrada da implementação em Elixir: roda os três protocolos ARQ sobre o canal
  simulado com várias taxas de perda e imprime uma tabela em Markdown.
  """

  alias SlidingWindowMiniTcp.Arq

  @file_size 256 * 1024
  @payload 1024
  @window 8

  @doc """
  EN: Deterministic pseudo-random file, so every run transfers the same bytes.

  PT: Arquivo pseudoaleatório determinístico, para que toda execução transfira os mesmos bytes.
  """
  @spec random_file(non_neg_integer(), integer()) :: binary()
  def random_file(size, seed) do
    {bytes, _rng} = :rand.bytes_s(size, :rand.seed_s(:exsss, {seed, seed, seed}))
    bytes
  end

  @spec demo() :: :ok
  def demo do
    data = random_file(@file_size, 1)
    want = :crypto.hash(:sha256, data)

    IO.puts("# Results: sliding-window-mini-tcp (Elixir)\n")
    IO.puts("- Command: `docker compose run --rm -T elixir-demo`")
    IO.puts("- Runtime: Elixir #{System.version()} on Erlang/OTP #{System.otp_release()}\n")
    IO.puts("## Simulated channel\n")

    IO.puts(
      "File of #{@file_size} bytes in frames of #{@payload} bytes. Link of 1 frame per tick, " <>
        "delay of 5 ticks, 5% duplication, 20% of the copies delayed by up to 6 extra ticks, " <>
        "seed 2026. Window of #{@window} frames for go-back-N and selective repeat.\n"
    )

    IO.puts("| loss | protocol | ticks | frames sent | retransmissions | intact (SHA-256) |")
    IO.puts("| --- | --- | --- | --- | --- | --- |")

    verdicts =
      for loss <- [0.0, 0.05, 0.1, 0.2, 0.3],
          proto <- [Arq.stop_and_wait(), Arq.go_back_n(@window), Arq.selective_repeat(@window)] do
        link = [loss: loss, duplicate: 0.05, reorder: 0.2, delay: 5, jitter: 6, seed: 2026]
        {:ok, result} = Arq.transfer(data, @payload, proto, link)
        intact = :crypto.hash(:sha256, result.received) == want

        IO.puts(
          "| #{round(loss * 100)}% | #{proto.name} | #{result.ticks} | #{result.frames_sent} | " <>
            "#{result.retransmissions} | #{if intact, do: "yes", else: "NO"} |"
        )

        intact
      end

    if Enum.all?(verdicts), do: :ok, else: exit({:shutdown, 1})
  end
end
