defmodule Client.MixProject do
  use Mix.Project

  def project do
    [app: :client, version: "0.1.0", elixir: "~> 1.20", deps: deps()]
  end

  def application do
    [extra_applications: [:logger]]
  end

  # EN: Exact version, and mix.lock pins every transitive package too.
  # PT: Versão exata, e o mix.lock fixa também todo pacote transitivo.
  defp deps do
    [{:postgrex, "0.22.4"}]
  end
end
