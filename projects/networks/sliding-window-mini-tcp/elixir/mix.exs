defmodule SlidingWindowMiniTcp.MixProject do
  use Mix.Project

  def project do
    [app: :sliding_window_mini_tcp, version: "0.1.0", elixir: "~> 1.20", deps: []]
  end

  def application do
    [extra_applications: [:logger, :crypto]]
  end
end
