defmodule CiPipelineSample do
  @moduledoc """
  EN: A well formatted file: mix format has nothing to change here.

  PT: Um arquivo bem formatado: o mix format não tem nada a mudar aqui.

  ES: Un archivo bien formateado: mix format no tiene nada que cambiar aquí.
  """

  @spec total([integer()]) :: integer()
  def total(prices), do: Enum.sum(prices)
end
