defmodule PureFunctionsProperties.CodecTest do
  use ExUnit.Case, async: true

  alias PureFunctionsProperties.{Cases, Codec, Prop}

  # EN: Strings made of runs of "a", "b" and "c", up to 6 runs of up to 12 characters each.
  # PT: Textos feitos de sequências de "a", "b" e "c", até 6 sequências de até 12 caracteres.
  # ES: Textos hechos de secuencias de "a", "b" y "c", hasta 6 secuencias de hasta 12 caracteres.
  defp texts, do: Prop.run_string("abc", 6, 12)

  describe "example tests" do
    # EN: The examples are the ones a person would write by hand, and every one of them
    #     passes against BOTH decoders. They do not tell the correct one from the buggy one.
    # PT: Os exemplos são os que uma pessoa escreveria à mão, e todos passam nos DOIS
    #     decodificadores. Eles não distinguem o correto do que tem o erro.
    # ES: Los ejemplos son los que una persona escribiría a mano, y todos pasan en los DOS
    #     decodificadores. No distinguen el correcto del que tiene el error.
    test "every shared example passes against both decoders" do
      for [plain, encoded] <- Cases.load()["codec"]["examples"] do
        assert Codec.encode(plain) == encoded
        assert Codec.decode(encoded) == plain
        assert Codec.decode_buggy(encoded) == plain
      end
    end
  end

  describe "round-trip property" do
    # EN: Round trip: decoding what was encoded gives back the original, for any input.
    # PT: Ida e volta: decodificar o que foi codificado devolve o original, para qualquer entrada.
    # ES: Ida y vuelta: decodificar lo que se codificó devuelve el original, para cualquier entrada.
    test "decode(encode(text)) == text holds for the correct decoder" do
      assert Prop.check(texts(), &(Codec.decode(Codec.encode(&1)) == &1), runs: 500) == {:ok, 500}
    end

    test "the same property finds the seeded bug and shrinks it to ten equal characters" do
      assert {:error, failure} =
               Prop.check(texts(), &(Codec.decode_buggy(Codec.encode(&1)) == &1), runs: 500)

      assert failure.shrunk == "aaaaaaaaaa"
      assert String.length(failure.original) > String.length(failure.shrunk)
      assert Codec.decode_buggy(Codec.encode(failure.shrunk)) == ""
    end

    # EN: Reproducible: the seed is the whole state of the generator, so the same seed gives
    #     the same failure, byte for byte.
    # PT: Reproduzível: a semente é todo o estado do gerador, então a mesma semente dá a mesma
    #     falha, byte a byte.
    # ES: Reproducible: la semilla es todo el estado del generador, así que la misma semilla da el
    #     mismo fallo, byte a byte.
    test "the same seed reproduces the same counterexample" do
      run = fn ->
        Prop.check(texts(), &(Codec.decode_buggy(Codec.encode(&1)) == &1), runs: 500, seed: 7)
      end

      assert run.() == run.()
    end
  end
end
