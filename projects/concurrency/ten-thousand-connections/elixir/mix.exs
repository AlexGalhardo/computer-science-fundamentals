defmodule TenThousandConnections.MixProject do
  use Mix.Project

  def project do
    [app: :ten_thousand_connections, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger], mod: {EchoServer.Application, []}]
  end
end
