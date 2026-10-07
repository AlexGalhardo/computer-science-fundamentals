defmodule SlidingWindowMiniTcp.Channel do
  @moduledoc """
  EN: One direction of a simulated unreliable link. A packet can be lost, delivered twice or
  delayed so much that it arrives after packets sent later (reordering).

  PT: Um sentido de um enlace não confiável simulado. Um pacote pode ser perdido, entregue duas
  vezes ou atrasado a ponto de chegar depois de pacotes enviados mais tarde (reordenação).
  """

  defstruct loss: 0.0,
            duplicate: 0.0,
            reorder: 0.0,
            delay: 1,
            jitter: 0,
            rng: nil,
            sent: 0,
            lost: 0,
            duplicated: 0,
            delayed: 0

  @type t :: %__MODULE__{}

  @doc """
  EN: Builds a channel. The random generator is a value stored inside the struct, not a hidden
  global: every call returns the next generator together with its answer. With immutable data
  this is the only way to be random, and it makes determinism free: the same seed always
  walks through the same sequence of states.

  PT: Constrói um canal. O gerador aleatório é um valor guardado dentro da struct, não um
  global escondido: cada chamada devolve o próximo gerador junto com a resposta. Com dados
  imutáveis essa é a única forma de ser aleatório, e o determinismo vem de graça: a mesma
  semente percorre sempre a mesma sequência de estados.
  """
  @spec new(keyword()) :: t()
  def new(opts) do
    seed = Keyword.get(opts, :seed, 0)
    fields = Keyword.delete(opts, :seed)
    struct!(__MODULE__, [{:rng, :rand.seed_s(:exsss, {seed, seed + 1, seed + 2})} | fields])
  end

  @doc """
  EN: Hands one packet to the channel at tick `now`. Returns the ticks at which its copies
  arrive (an empty list is a loss) and the channel in its next state.

  PT: Entrega um pacote ao canal no tick `now`. Devolve os ticks em que as cópias chegam (uma
  lista vazia é uma perda) e o canal no seu próximo estado.
  """
  @spec transmit(t(), non_neg_integer()) :: {[non_neg_integer()], t()}
  def transmit(%__MODULE__{} = channel, now) do
    {roll, channel} = roll(%{channel | sent: channel.sent + 1})

    if roll < channel.loss do
      {[], %{channel | lost: channel.lost + 1}}
    else
      {first, channel} = delay(channel)
      {roll, channel} = roll(channel)

      if roll < channel.duplicate do
        {second, channel} = delay(channel)
        {[now + first, now + second], %{channel | duplicated: channel.duplicated + 1}}
      else
        {[now + first], channel}
      end
    end
  end

  defp roll(channel) do
    {value, rng} = :rand.uniform_s(channel.rng)
    {value, %{channel | rng: rng}}
  end

  defp delay(%__MODULE__{jitter: 0} = channel), do: {channel.delay, channel}

  defp delay(channel) do
    {roll, channel} = roll(channel)

    if roll < channel.reorder do
      {extra, rng} = :rand.uniform_s(channel.jitter, channel.rng)
      {channel.delay + extra, %{channel | rng: rng, delayed: channel.delayed + 1}}
    else
      {channel.delay, channel}
    end
  end
end
