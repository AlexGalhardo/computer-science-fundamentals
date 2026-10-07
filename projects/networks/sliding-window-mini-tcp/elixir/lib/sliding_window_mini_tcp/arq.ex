defmodule SlidingWindowMiniTcp.Arq do
  @moduledoc """
  EN: Stop-and-wait, go-back-N and selective repeat over the simulated channel, written as a
  pure function: the whole transfer is one immutable state that each tick turns into the next
  state. There are no processes and no clocks, so a run can be replayed exactly.

  PT: Stop-and-wait, go-back-N e retransmissão seletiva sobre o canal simulado, escritos como
  uma função pura: a transferência inteira é um estado imutável que cada tick transforma no
  estado seguinte. Não há processos nem relógios, então uma execução pode ser repetida
  exatamente.
  """

  import Bitwise

  alias SlidingWindowMiniTcp.Channel

  @seq_bits 16
  @seq_space 1 <<< @seq_bits

  defmodule Protocol do
    @moduledoc """
    EN: A sliding window protocol is described by its two windows. Stop-and-wait has a send
    window of 1. Go-back-N lets the sender run ahead while the receiver accepts only the next
    frame in order. Selective repeat gives the receiver a window too.

    PT: Um protocolo de janela deslizante é descrito pelas suas duas janelas. O stop-and-wait
    tem janela de envio 1. O go-back-N deixa o transmissor avançar enquanto o receptor aceita
    apenas o próximo quadro em ordem. A retransmissão seletiva dá uma janela também ao receptor.
    """
    @enforce_keys [:name, :send_window, :recv_window]
    defstruct [:name, :send_window, :recv_window]

    @type t :: %__MODULE__{
            name: String.t(),
            send_window: pos_integer(),
            recv_window: pos_integer()
          }
  end

  defstruct [
    :frames,
    :total,
    :proto,
    :timeout,
    :max_ticks,
    :data_ch,
    :ack_ch,
    frame_arrivals: %{},
    ack_arrivals: %{},
    base: 0,
    next: 0,
    acked: MapSet.new(),
    deadlines: %{},
    window_timer: nil,
    retransmit: :queue.new(),
    queued: MapSet.new(),
    expected: 0,
    buffer: %{},
    received: [],
    frames_sent: 0,
    retransmissions: 0,
    acks_sent: 0
  ]

  @spec stop_and_wait() :: Protocol.t()
  def stop_and_wait, do: %Protocol{name: "stop-and-wait", send_window: 1, recv_window: 1}

  @spec go_back_n(pos_integer()) :: Protocol.t()
  def go_back_n(window), do: %Protocol{name: "go-back-n", send_window: window, recv_window: 1}

  @spec selective_repeat(pos_integer()) :: Protocol.t()
  def selective_repeat(window) do
    %Protocol{name: "selective-repeat", send_window: window, recv_window: window}
  end

  @doc """
  EN: Largest safe send window for a sequence number of `bits` bits. An in-order receiver
  allows 2^n - 1. A receiver that buffers needs its old and new windows to be disjoint, so the
  limit is half the sequence space, 2^(n-1).

  PT: Maior janela de envio segura para um número de sequência de `bits` bits. Um receptor que
  só aceita em ordem permite 2^n - 1. Um receptor que guarda quadros precisa que a janela
  antiga e a nova não se sobreponham, então o limite é metade do espaço de sequência, 2^(n-1).
  """
  @spec max_window(pos_integer(), :in_order | :selective) :: pos_integer()
  def max_window(bits, :in_order), do: (1 <<< bits) - 1
  def max_window(bits, :selective), do: 1 <<< (bits - 1)

  @doc """
  EN: Sends `data` in frames of `payload_size` bytes over a link described by `link` (the
  options of `Channel.new/1`) and returns what the receiver delivered and what it cost.

  PT: Envia `data` em quadros de `payload_size` bytes por um enlace descrito por `link` (as
  opções de `Channel.new/1`) e devolve o que o receptor entregou e quanto custou.
  """
  @spec transfer(binary(), pos_integer(), Protocol.t(), keyword()) ::
          {:ok, map()} | {:error, String.t()}
  def transfer(data, payload_size, %Protocol{} = proto, link) do
    kind = if selective?(proto), do: :selective, else: :in_order

    cond do
      proto.send_window < 1 or proto.recv_window < 1 ->
        {:error, "windows must be at least 1"}

      proto.send_window > max_window(@seq_bits, kind) ->
        {:error, "send window #{proto.send_window} is too large for #{@seq_bits}-bit numbers"}

      true ->
        frames = chunk(data, payload_size, [])
        total = tuple_size(frames)
        delay = Keyword.get(link, :delay, 1)
        jitter = Keyword.get(link, :jitter, 0)

        # EN: The timeout must exceed a worst-case round trip, otherwise the sender resends
        #     frames whose acknowledgement is still on its way.
        # PT: O tempo limite precisa superar uma ida e volta no pior caso, senão o transmissor
        #     reenvia quadros cuja confirmação ainda está a caminho.
        timeout = 2 * (delay + jitter) + proto.send_window + 2

        # EN: Acknowledgements cross their own channel, with the same faults and another seed.
        # PT: As confirmações atravessam um canal próprio, com as mesmas falhas e outra semente.
        ack_link = Keyword.update(link, :seed, 1, &(&1 + 1))

        run(
          %__MODULE__{
            frames: frames,
            total: total,
            proto: proto,
            timeout: timeout,
            max_ticks: 1000 * total * (timeout + 1) + 1000,
            data_ch: Channel.new(link),
            ack_ch: Channel.new(ack_link)
          },
          0
        )
    end
  end

  defp chunk(<<>>, _size, acc), do: acc |> Enum.reverse() |> List.to_tuple()

  defp chunk(data, size, acc) when byte_size(data) <= size, do: chunk(<<>>, size, [data | acc])

  defp chunk(data, size, acc) do
    <<head::binary-size(^size), rest::binary>> = data
    chunk(rest, size, [head | acc])
  end

  defp selective?(%Protocol{recv_window: window}), do: window > 1

  # EN: Frames carry only the low 16 bits of their position. Each side recovers the full
  #     position from the distance to the edge of its window, always modulo 2^16.
  # PT: Os quadros levam só os 16 bits baixos da sua posição. Cada lado recupera a posição
  #     completa pela distância até a borda da sua janela, sempre módulo 2^16.
  defp offset(seq, base), do: Integer.mod(seq - base, @seq_space)

  # EN: The loop of the simulation is a recursive function. Each clause is one possible
  #     situation of the transfer: finished, stuck, or one more tick to compute.
  # PT: O laço da simulação é uma função recursiva. Cada cláusula é uma situação possível da
  #     transferência: terminada, travada, ou mais um tick a calcular.
  defp run(%__MODULE__{base: base, total: total} = state, now) when base >= total do
    {:ok,
     %{
       received: state.received |> Enum.reverse() |> IO.iodata_to_binary(),
       ticks: now,
       frames: total,
       frames_sent: state.frames_sent,
       retransmissions: state.retransmissions,
       acks_sent: state.acks_sent,
       frames_lost: state.data_ch.lost,
       acks_lost: state.ack_ch.lost
     }}
  end

  defp run(%__MODULE__{max_ticks: max_ticks, proto: proto}, now) when now > max_ticks do
    {:error, "#{proto.name} did not finish in #{max_ticks} ticks"}
  end

  defp run(state, now) do
    state
    |> receive_frames(now)
    |> receive_acks(now)
    |> fire_timers(now)
    |> send_one(now)
    |> run(now + 1)
  end

  # Receiver: frames arriving in this tick.
  defp receive_frames(state, now) do
    {arrivals, pending} = Map.pop(state.frame_arrivals, now, [])

    arrivals
    |> Enum.reverse()
    |> Enum.reduce(%{state | frame_arrivals: pending}, &receive_frame(&1, &2, now))
  end

  defp receive_frame({seq, payload}, state, now) do
    ahead = offset(seq, state.expected)

    state =
      if ahead < state.proto.recv_window do
        deliver(%{state | buffer: Map.put(state.buffer, state.expected + ahead, payload)})
      else
        state
      end

    # EN: A cumulative ACK says "I have everything before this number". A selective ACK names
    #     the frame that just arrived, even an old copy, because a repeated frame usually means
    #     that its first ACK was lost.
    # PT: Um ACK cumulativo diz "tenho tudo antes deste número". Um ACK seletivo nomeia o quadro
    #     que acabou de chegar, mesmo uma cópia antiga, porque um quadro repetido costuma
    #     indicar que o primeiro ACK se perdeu.
    ack = if selective?(state.proto), do: seq, else: rem(state.expected, @seq_space)
    {ticks, ack_ch} = Channel.transmit(state.ack_ch, now)

    %{
      state
      | ack_ch: ack_ch,
        ack_arrivals: schedule(state.ack_arrivals, ticks, ack),
        acks_sent: state.acks_sent + 1
    }
  end

  # EN: Delivery is in order: the receiver hands over frames only while there is no hole.
  # PT: A entrega é em ordem: o receptor só repassa quadros enquanto não houver buraco.
  defp deliver(state) do
    case Map.pop(state.buffer, state.expected) do
      {nil, _buffer} ->
        state

      {chunk, buffer} ->
        deliver(%{
          state
          | buffer: buffer,
            received: [chunk | state.received],
            expected: state.expected + 1
        })
    end
  end

  defp schedule(arrivals, ticks, item) do
    Enum.reduce(ticks, arrivals, fn at, acc -> Map.update(acc, at, [item], &[item | &1]) end)
  end

  # Sender: acknowledgements arriving in this tick.
  defp receive_acks(state, now) do
    {arrivals, pending} = Map.pop(state.ack_arrivals, now, [])

    arrivals
    |> Enum.reverse()
    |> Enum.reduce(%{state | ack_arrivals: pending}, &receive_ack(&1, &2, now))
  end

  defp receive_ack(ack, state, now) do
    ahead = offset(ack, state.base)
    outstanding = state.next - state.base

    cond do
      selective?(state.proto) and ahead < outstanding ->
        index = state.base + ahead

        slide(%{
          state
          | acked: MapSet.put(state.acked, index),
            deadlines: Map.delete(state.deadlines, index)
        })

      not selective?(state.proto) and ahead >= 1 and ahead <= outstanding ->
        base = state.base + ahead
        %{state | base: base, window_timer: if(base < state.next, do: now + state.timeout)}

      true ->
        state
    end
  end

  defp slide(state) do
    if MapSet.member?(state.acked, state.base) do
      slide(%{state | acked: MapSet.delete(state.acked, state.base), base: state.base + 1})
    else
      state
    end
  end

  # EN: Selective repeat has one timer per frame and resends only the frame that expired.
  #     Go-back-N has a single timer: when it expires, the whole window is sent again, because
  #     the receiver threw away everything that came after the hole.
  # PT: A retransmissão seletiva tem um temporizador por quadro e reenvia só o quadro que
  #     expirou. O go-back-N tem um temporizador só: quando ele expira, a janela inteira é
  #     enviada de novo, porque o receptor descartou tudo o que veio depois do buraco.
  defp fire_timers(state, now) do
    cond do
      selective?(state.proto) ->
        expired =
          for index <- state.base..(state.next - 1)//1,
              is_map_key(state.deadlines, index) and state.deadlines[index] <= now,
              not MapSet.member?(state.queued, index),
              do: index

        %{
          state
          | deadlines: Map.drop(state.deadlines, expired),
            retransmit: Enum.reduce(expired, state.retransmit, &:queue.in/2),
            queued: Enum.reduce(expired, state.queued, &MapSet.put(&2, &1))
        }

      state.window_timer != nil and now >= state.window_timer ->
        window = Enum.to_list(state.base..(state.next - 1)//1)

        %{
          state
          | retransmit: :queue.from_list(window),
            queued: MapSet.new(window),
            window_timer: now + state.timeout
        }

      true ->
        state
    end
  end

  # Sender: at most one frame per tick, retransmissions first.
  defp send_one(state, now) do
    case next_frame(state) do
      {nil, state} -> state
      {index, state} -> put_on_link(state, index, now)
    end
  end

  defp next_frame(state) do
    case :queue.out(state.retransmit) do
      {{:value, index}, rest} ->
        state = %{state | retransmit: rest, queued: MapSet.delete(state.queued, index)}

        if index >= state.base and not MapSet.member?(state.acked, index) do
          {index, %{state | retransmissions: state.retransmissions + 1}}
        else
          next_frame(state)
        end

      {:empty, _queue} ->
        if state.next < state.total and state.next < state.base + state.proto.send_window do
          {state.next, %{state | next: state.next + 1}}
        else
          {nil, state}
        end
    end
  end

  defp put_on_link(state, index, now) do
    state =
      if selective?(state.proto) do
        %{state | deadlines: Map.put(state.deadlines, index, now + state.timeout)}
      else
        %{state | window_timer: state.window_timer || now + state.timeout}
      end

    {ticks, data_ch} = Channel.transmit(state.data_ch, now)
    frame = {rem(index, @seq_space), elem(state.frames, index)}

    %{
      state
      | data_ch: data_ch,
        frame_arrivals: schedule(state.frame_arrivals, ticks, frame),
        frames_sent: state.frames_sent + 1
    }
  end
end
