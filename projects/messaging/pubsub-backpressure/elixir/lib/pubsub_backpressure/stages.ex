defmodule PubsubBackpressure.Producer do
  @moduledoc """
  A GenStage producer that could emit numbers as fast as the CPU allows, but does not decide
  when to emit.

  EN: A GenStage producer never pushes. It waits for `handle_demand/2`, which says how many
  events the consumers asked for, and returns at most that many. Being able to produce a
  million events per second changes nothing: without demand, nothing leaves.

  PT: Um produtor GenStage nunca empurra. Ele espera o `handle_demand/2`, que diz quantos
  eventos os consumidores pediram, e devolve no máximo essa quantidade. Conseguir produzir um
  milhão de eventos por segundo não muda nada: sem demanda, nada sai.

  ES: Un productor GenStage nunca empuja. Espera a `handle_demand/2`, que dice cuántos eventos
  pidieron los consumidores, y devuelve como máximo esa cantidad. Poder producir un millón de
  eventos por segundo no cambia nada: sin demanda, nada sale.
  """
  use GenStage

  alias PubsubBackpressure.Meter

  def start_link({meter, total}), do: GenStage.start_link(__MODULE__, {meter, total})

  @impl true
  def init({meter, total}), do: {:producer, %{meter: meter, next: 0, total: total}}

  @impl true
  def handle_demand(demand, state) do
    count = min(demand, state.total - state.next)
    events = Enum.to_list(state.next..(state.next + count - 1)//1)
    Meter.emitted(state.meter, count)
    {:noreply, events, %{state | next: state.next + count}}
  end
end

defmodule PubsubBackpressure.Consumer do
  @moduledoc """
  A slow GenStage consumer.

  EN: `max_demand` is the size of the buffer: the consumer never has more than that many events
  asked for and not yet processed. `min_demand` is the refill mark: when the events still
  pending fall to it, the consumer asks for more, so it never sits idle waiting for a new batch.

  PT: `max_demand` é o tamanho do buffer: o consumidor nunca tem mais que essa quantidade de
  eventos pedidos e ainda não processados. `min_demand` é a marca de reposição: quando os
  eventos pendentes caem até ela, o consumidor pede mais, então nunca fica parado esperando um
  lote novo.

  ES: `max_demand` es el tamaño del buffer: el consumidor nunca tiene más de esa cantidad de
  eventos pedidos y aún no procesados. `min_demand` es la marca de reposición: cuando los eventos
  pendientes bajan hasta ella, el consumidor pide más, así que nunca se queda parado esperando un
  lote nuevo.
  """
  use GenStage

  alias PubsubBackpressure.Meter

  def start_link(options), do: GenStage.start_link(__MODULE__, options)

  @impl true
  def init(options) do
    subscription =
      {options.producer, max_demand: options.max_demand, min_demand: options.min_demand}

    {:consumer, Map.put(options, :done, 0), subscribe_to: [subscription]}
  end

  @impl true
  def handle_events(events, _from, state) do
    Enum.each(events, fn _event ->
      Process.sleep(state.work_ms)
      Meter.processed(state.meter)
    end)

    done = state.done + length(events)
    if done >= state.total, do: send(state.notify, :pipeline_done)
    {:noreply, [], %{state | done: done}}
  end
end
