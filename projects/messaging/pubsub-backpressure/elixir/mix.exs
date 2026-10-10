defmodule PubsubBackpressure.MixProject do
  use Mix.Project

  def project do
    [
      app: :pubsub_backpressure,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: deps()
    ]
  end

  def application do
    [extra_applications: [:logger]]
  end

  # EN: One dependency, pinned to an exact version. `mix.lock` is committed, and the Docker
  #     build refuses to continue if it does not match.
  # PT: Uma dependência, fixada em uma versão exata. O `mix.lock` é versionado, e o build do
  #     Docker se recusa a continuar se ele não bater.
  # ES: Una dependencia, fijada en una versión exacta. `mix.lock` está versionado, y la
  #     construcción de Docker se niega a continuar si no coincide.
  defp deps do
    [{:gen_stage, "== 1.3.2"}]
  end
end
