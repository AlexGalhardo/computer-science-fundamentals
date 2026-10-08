defmodule PubsubBackpressureTest do
  use ExUnit.Case, async: false

  # EN: The acceptance criterion: a demand-driven flow keeps the buffer under the configured
  #     size. 2,000 events through a buffer of 10, with a consumer 1,000 times slower than the
  #     producer could be.
  # PT: O critério de aceitação: um fluxo guiado por demanda mantém o buffer abaixo do tamanho
  #     configurado. 2.000 eventos por um buffer de 10, com um consumidor 1.000 vezes mais lento
  #     do que o produtor conseguiria ser.
  @tag timeout: 120_000
  test "GenStage keeps the buffer under max_demand" do
    result = PubsubBackpressure.demand(2_000, max_demand: 10, min_demand: 5)
    IO.puts("demand, max_demand 10: #{inspect(result)}")
    assert result.processed == 2_000
    assert result.peak_buffer <= 10
    assert result.peak_buffer > 0
  end

  @tag timeout: 120_000
  test "the bound follows the configuration, not the number of events" do
    small = PubsubBackpressure.demand(500, max_demand: 4, min_demand: 2)
    large = PubsubBackpressure.demand(1_500, max_demand: 50, min_demand: 25)
    IO.puts("demand, max_demand 4: #{inspect(small)}")
    IO.puts("demand, max_demand 50: #{inspect(large)}")
    assert small.peak_buffer <= 4
    assert large.peak_buffer <= 50
    assert large.peak_buffer > 4
    assert small.processed == 500 and large.processed == 1_500
  end

  # EN: The contrast. With plain `send/2` the buffer is the mailbox, and it grows with the
  #     number of events: ten times more events, about ten times more waiting.
  # PT: O contraste. Com `send/2` puro o buffer é a caixa de mensagens, e ela cresce com o
  #     número de eventos: dez vezes mais eventos, cerca de dez vezes mais espera.
  test "without backpressure the mailbox grows with the number of events" do
    small = PubsubBackpressure.push(1_000)
    large = PubsubBackpressure.push(10_000)
    IO.puts("push: #{inspect(small)} #{inspect(large)}")
    assert small.peak_buffer > 900
    assert large.peak_buffer > 9_000
    assert large.peak_buffer > 5 * small.peak_buffer
  end

  test "a producer with nothing left answers demand with no events" do
    result = PubsubBackpressure.demand(3, max_demand: 10, min_demand: 5)
    assert result.processed == 3
    assert result.peak_buffer <= 3
  end
end
