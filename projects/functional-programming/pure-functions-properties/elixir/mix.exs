defmodule PureFunctionsProperties.MixProject do
  use Mix.Project

  # EN: No dependencies: the JSON decoder and the test framework ship with Elixir, and the
  #     property-testing library is the small one in lib/pure_functions_properties/prop.ex.
  # PT: Sem dependências: o decodificador de JSON e o framework de testes vêm com o Elixir, e a
  #     biblioteca de testes de propriedades é a pequena em lib/pure_functions_properties/prop.ex.
  def project do
    [app: :pure_functions_properties, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger]]
  end
end
