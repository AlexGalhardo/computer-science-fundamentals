defmodule OrderStateMachine.MixProject do
  use Mix.Project

  # EN: No dependencies: the JSON decoder and the test framework ship with Elixir.
  # PT: Sem dependências: o decodificador de JSON e o framework de testes vêm com o Elixir.
  def project do
    [app: :order_state_machine, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger]]
  end
end
