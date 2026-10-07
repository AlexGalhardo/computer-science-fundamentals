defmodule CounterRace.MixProject do
  use Mix.Project

  def project do
    [app: :counter_race, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger]]
  end
end
