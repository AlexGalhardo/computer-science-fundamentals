defmodule EchoServer.Application do
  @moduledoc """
  Starts the listener under a supervisor, which restarts it if it ever crashes.
  """
  use Application

  @impl true
  def start(_type, _args) do
    port = String.to_integer(System.get_env("PORT", "8080"))

    children = [
      Supervisor.child_spec({Task, fn -> EchoServer.listen(port) end}, restart: :permanent)
    ]

    IO.puts("elixir server listening on :#{port}")
    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
