defmodule PureFunctionsProperties.Codec do
  @moduledoc """
  EN: Run-length encoding: "aaabcc" becomes "3a1b2c". The input may contain any character
      except digits, which the encoded form reserves for the counts.
  PT: Codificação run-length: "aaabcc" vira "3a1b2c". A entrada pode conter qualquer caractere
      exceto dígitos, que a forma codificada reserva para as contagens.
  """

  # EN: A pipeline: split into characters, group neighbours that are equal, and write each
  #     group as its length followed by its character.
  # PT: Um pipeline: separar em caracteres, agrupar vizinhos iguais, e escrever cada grupo como
  #     o seu comprimento seguido do seu caractere.
  def encode(text) do
    text
    |> String.graphemes()
    |> Enum.chunk_by(& &1)
    |> Enum.map_join(fn [letter | _rest] = run -> "#{length(run)}#{letter}" end)
  end

  # EN: `\d+` reads a count with any number of digits, so a run of 10 or more decodes
  #     correctly.
  # PT: `\d+` lê uma contagem com qualquer número de dígitos, então uma sequência de 10 ou mais
  #     é decodificada corretamente.
  def decode(encoded), do: expand(encoded, ~r/(\d+)(\D)/)

  # EN: SEEDED BUG, kept on purpose. `\d` reads a single digit, so "10a" is read as the pair
  #     "0a" and the run disappears. Every example with runs shorter than 10 still passes,
  #     which is why the example tests do not notice it and the round-trip property does.
  # PT: ERRO PLANTADO, mantido de propósito. `\d` lê um único dígito, então "10a" é lido como
  #     o par "0a" e a sequência desaparece. Todo exemplo com sequências menores que 10
  #     continua passando, e é por isso que os testes com exemplos não percebem o erro e a
  #     propriedade de ida e volta percebe.
  def decode_buggy(encoded), do: expand(encoded, ~r/(\d)(\D)/)

  defp expand(encoded, pattern) do
    pattern
    |> Regex.scan(encoded)
    |> Enum.map_join(fn [_pair, count, letter] ->
      String.duplicate(letter, String.to_integer(count))
    end)
  end
end
