defmodule PubsubBackpressure.Meter do
  @moduledoc """
  Counts events sent by a producer and events finished by a consumer.

  EN: The difference between the two is the buffer: events that left the producer and were not
  processed yet. The meter keeps the highest value that difference reached, which is the number
  the lesson is about. Counters live outside the processes (`:counters`), so reading them does
  not disturb the pipeline being measured.

  PT: A diferença entre os dois é o buffer: eventos que saíram do produtor e ainda não foram
  processados. O medidor guarda o maior valor que essa diferença atingiu, que é o número de que
  a lição trata. Os contadores ficam fora dos processos (`:counters`), então lê-los não perturba
  o pipeline medido.
  """

  @emitted 1
  @processed 2

  @type t :: %{counts: :counters.counters_ref(), peak: :atomics.atomics_ref()}

  @spec new() :: t()
  def new do
    %{counts: :counters.new(2, [:atomics]), peak: :atomics.new(1, signed: false)}
  end

  @spec emitted(t(), non_neg_integer()) :: :ok
  def emitted(meter, count), do: :counters.add(meter.counts, @emitted, count)

  @doc """
  Records that one event was processed. The buffer is observed first, while this event still
  counts as waiting. Only the consumer process calls it, so the read-then-write on the peak
  has no concurrent writer.
  """
  @spec processed(t()) :: :ok
  def processed(meter) do
    waiting = buffered(meter)

    if waiting > :atomics.get(meter.peak, 1) do
      :atomics.put(meter.peak, 1, waiting)
    end

    :counters.add(meter.counts, @processed, 1)
  end

  @spec buffered(t()) :: integer()
  def buffered(meter) do
    :counters.get(meter.counts, @emitted) - :counters.get(meter.counts, @processed)
  end

  @spec peak(t()) :: non_neg_integer()
  def peak(meter), do: :atomics.get(meter.peak, 1)

  @spec processed_count(t()) :: non_neg_integer()
  def processed_count(meter), do: :counters.get(meter.counts, @processed)
end
