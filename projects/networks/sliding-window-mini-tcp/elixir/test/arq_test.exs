defmodule SlidingWindowMiniTcp.ArqTest do
  use ExUnit.Case, async: true

  alias SlidingWindowMiniTcp.{Arq, Channel}

  @lossy [loss: 0.2, duplicate: 0.05, reorder: 0.2, delay: 5, jitter: 6, seed: 2026]

  defp protocols, do: [Arq.stop_and_wait(), Arq.go_back_n(8), Arq.selective_repeat(8)]

  defp trace(link, packets) do
    {arrivals, _channel} =
      Enum.map_reduce(0..(packets - 1), Channel.new(link), fn now, channel ->
        Channel.transmit(channel, now)
      end)

    arrivals
  end

  test "the channel is deterministic with a fixed seed" do
    assert trace(@lossy, 2000) == trace(@lossy, 2000)
    refute trace(@lossy, 2000) == trace(Keyword.put(@lossy, :seed, 7), 2000)
  end

  test "the channel loses, duplicates and reorders" do
    arrivals = trace(@lossy, 20_000)
    lost = Enum.count(arrivals, &(&1 == []))
    duplicated = Enum.count(arrivals, &(length(&1) == 2))
    flat = List.flatten(arrivals)

    assert_in_delta lost / 20_000, 0.2, 0.02
    assert duplicated > 0
    assert flat != Enum.sort(flat)
  end

  # Acceptance criterion of MP-NET-1.2: every protocol delivers a file intact at 20% loss.
  for proto <- ["stop-and-wait", "go-back-n", "selective-repeat"] do
    test "#{proto} delivers the file intact at 20% loss" do
      proto = Enum.find(protocols(), &(&1.name == unquote(proto)))
      data = SlidingWindowMiniTcp.random_file(128 * 1024 + 123, 5)

      assert {:ok, result} = Arq.transfer(data, 1024, proto, @lossy)
      assert :crypto.hash(:sha256, result.received) == :crypto.hash(:sha256, data)
      assert result.frames_lost > 0
      assert result.retransmissions > 0
    end
  end

  test "the same seed gives the same transfer" do
    data = SlidingWindowMiniTcp.random_file(32 * 1024, 6)

    for proto <- protocols() do
      assert Arq.transfer(data, 512, proto, @lossy) == Arq.transfer(data, 512, proto, @lossy)
    end
  end

  test "a perfect channel needs no retransmission" do
    data = SlidingWindowMiniTcp.random_file(32 * 1024, 7)

    for proto <- protocols() do
      assert {:ok, result} = Arq.transfer(data, 1024, proto, delay: 5, seed: 1)
      assert result.received == data
      assert result.retransmissions == 0
      assert result.frames_sent == result.frames
    end
  end

  test "a window uses the link better than stop-and-wait" do
    data = SlidingWindowMiniTcp.random_file(64 * 1024, 8)
    {:ok, slow} = Arq.transfer(data, 1024, Arq.stop_and_wait(), delay: 5, seed: 1)
    {:ok, fast} = Arq.transfer(data, 1024, Arq.go_back_n(16), delay: 5, seed: 1)

    assert slow.ticks > 5 * fast.ticks
  end

  test "window limits" do
    assert Arq.max_window(3, :in_order) == 7
    assert Arq.max_window(3, :selective) == 4
    assert {:error, _reason} = Arq.transfer("abc", 1, Arq.selective_repeat(32_769), delay: 1)
    assert {:error, _reason} = Arq.transfer("abc", 1, Arq.go_back_n(0), delay: 1)
  end

  test "an empty file finishes at once" do
    assert {:ok, %{received: "", ticks: 0}} = Arq.transfer("", 1024, Arq.go_back_n(4), delay: 1)
  end
end
