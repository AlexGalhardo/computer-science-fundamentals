defmodule PubsubBackpressure do
  @moduledoc """
  Two ways of connecting a fast producer to a slow consumer.

  EN: `push/2` sends messages to the consumer's mailbox as fast as it can: nothing tells the
  producer to slow down, so the mailbox grows with the number of events. `demand/2` uses
  GenStage: the consumer asks for events and the producer sends at most what was asked, so the
  buffer stays under `max_demand` however many events exist.

  PT: `push/2` envia mensagens para a caixa de mensagens do consumidor o mais rápido que
  consegue: nada avisa o produtor para desacelerar, então a caixa cresce com o número de
  eventos. `demand/2` usa GenStage: o consumidor pede eventos e o produtor envia no máximo o
  que foi pedido, então o buffer fica abaixo de `max_demand`, não importa quantos eventos existam.

  ES: `push/2` envía mensajes al buzón del consumidor lo más rápido que puede: nada le dice al
  productor que se ralentice, así que el buzón crece con el número de eventos. `demand/2` usa
  GenStage: el consumidor pide eventos y el productor envía como máximo lo que se pidió, así que
  el buffer se queda por debajo de `max_demand`, sin importar cuántos eventos existan.
  """

  alias PubsubBackpressure.{Consumer, Meter, Producer}

  @type result :: %{events: pos_integer(), processed: non_neg_integer(), peak_buffer: integer()}

  @doc """
  Demand-driven pipeline. Returns after every event was processed.

  Options: `:max_demand` (default 10), `:min_demand` (default half of it), `:work_ms` (time the
  consumer spends on each event, default 1).
  """
  @spec demand(pos_integer(), keyword()) :: result()
  def demand(events, options \\ []) do
    max_demand = Keyword.get(options, :max_demand, 10)
    meter = Meter.new()
    {:ok, producer} = Producer.start_link({meter, events})

    {:ok, consumer} =
      Consumer.start_link(%{
        producer: producer,
        meter: meter,
        total: events,
        notify: self(),
        max_demand: max_demand,
        min_demand: Keyword.get(options, :min_demand, div(max_demand, 2)),
        work_ms: Keyword.get(options, :work_ms, 1)
      })

    receive do
      :pipeline_done -> :ok
    after
      120_000 -> raise "the pipeline did not finish in time"
    end

    GenStage.stop(consumer)
    GenStage.stop(producer)
    %{events: events, processed: Meter.processed_count(meter), peak_buffer: Meter.peak(meter)}
  end

  @doc """
  Push pipeline with no backpressure. The producer sends every event at once; the buffer is the
  mailbox of the consumer process, measured right after the producer finished sending. The slow
  consumer is stopped after the measurement instead of being left to drain the backlog.
  """
  @spec push(pos_integer(), keyword()) :: result()
  def push(events, options \\ []) do
    work_ms = Keyword.get(options, :work_ms, 1)
    meter = Meter.new()
    consumer = spawn(fn -> push_consumer(meter, work_ms) end)

    # EN: `send/2` never blocks and never fails because the receiver is busy. That is exactly
    #     the problem: the sender gets no signal that the receiver is falling behind.
    # PT: O `send/2` nunca bloqueia e nunca falha porque o receptor está ocupado. Esse é
    #     exatamente o problema: o remetente não recebe sinal de que o receptor está ficando para trás.
    # ES: `send/2` nunca bloquea y nunca falla porque el receptor esté ocupado. Ese es
    #     exactamente el problema: el emisor no recibe ninguna señal de que el receptor se está
    #     quedando atrás.
    Enum.each(1..events, fn event -> send(consumer, {:event, event}) end)
    {:message_queue_len, waiting} = Process.info(consumer, :message_queue_len)
    Process.exit(consumer, :kill)

    %{events: events, processed: Meter.processed_count(meter), peak_buffer: waiting}
  end

  defp push_consumer(meter, work_ms) do
    receive do
      {:event, _event} ->
        Process.sleep(work_ms)
        Meter.processed(meter)
        push_consumer(meter, work_ms)
    end
  end

  @doc "Prints the comparison used in the README."
  @spec main() :: :ok
  def main do
    IO.puts("fast producer, slow consumer (1 ms per event)\n")

    IO.puts(
      String.pad_trailing("pipeline", 34) <> String.pad_leading("events", 8) <> "   peak buffer"
    )

    for events <- [1_000, 10_000, 100_000] do
      print_row("push, no backpressure", events, push(events).peak_buffer)
    end

    for events <- [1_000, 3_000] do
      print_row("GenStage, max_demand 10", events, demand(events, max_demand: 10).peak_buffer)
    end

    print_row("GenStage, max_demand 100", 3_000, demand(3_000, max_demand: 100).peak_buffer)
    :ok
  end

  defp print_row(name, events, peak) do
    IO.puts(
      String.pad_trailing(name, 34) <>
        String.pad_leading(Integer.to_string(events), 8) <>
        String.pad_leading(Integer.to_string(peak), 14)
    )
  end
end
