defmodule PureFunctionsProperties.Normalize do
  @moduledoc """
  EN: Turns a product name typed by a person into a code: no spaces around it, upper case, and
      each run of white space replaced by one hyphen. A normaliser should be idempotent:
      normalising an already normal value changes nothing, so it is safe to apply it again at
      every layer.
  PT: Transforma um nome de produto digitado por uma pessoa em um código: sem espaços em volta,
      em maiúsculas, e com cada sequência de espaços em branco trocada por um hífen. Um
      normalizador deve ser idempotente: normalizar um valor já normal não muda nada, então é
      seguro aplicá-lo de novo em cada camada.
  ES: Transforma un nombre de producto escrito por una persona en un código: sin espacios
      alrededor, en mayúsculas, y con cada secuencia de espacios en blanco cambiada por un
      guion. Un normalizador debe ser idempotente: normalizar un valor ya normal no cambia
      nada, así que es seguro aplicarlo de nuevo en cada capa.
  """

  def normalize_code(name) do
    name
    |> String.trim()
    |> String.upcase()
    |> String.replace(~r/\s+/, "-")
  end
end
