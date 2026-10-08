defmodule OopVsFunctional.MixProject do
  use Mix.Project

  # EN: No dependencies: the test framework ships with Elixir.
  # PT: Sem dependências: o framework de testes vem com o Elixir.
  def project do
    [app: :oop_vs_functional, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger]]
  end
end
