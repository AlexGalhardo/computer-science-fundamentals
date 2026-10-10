defmodule EchoServerTest do
  use ExUnit.Case, async: true

  setup do
    %{in_flight: :counters.new(1, [])}
  end

  test "echo returns the body and its content type", %{in_flight: in_flight} do
    headers = %{"content-type" => "text/plain"}

    assert EchoServer.handle("POST", "/echo", headers, "hello", in_flight) ==
             {200, "text/plain", "hello"}
  end

  test "delay rejects input that is not an integer from 0 to 60000", %{in_flight: in_flight} do
    for target <- ["/delay", "/delay?ms=abc", "/delay?ms=-1", "/delay?ms=1.5", "/delay?ms=60001"] do
      assert {400, "application/json", _} = EchoServer.handle("GET", target, %{}, "", in_flight)
    end
  end

  test "unknown path is 404 and wrong method is 405", %{in_flight: in_flight} do
    assert {404, _, _} = EchoServer.handle("GET", "/nope", %{}, "", in_flight)
    assert {405, _, _} = EchoServer.handle("GET", "/echo", %{}, "", in_flight)
  end

  # EN: 200 processes that each wait 300 ms finish together: sleeping processes do not hold a
  #     scheduler, so they all sleep at the same time.
  # PT: 200 processos que esperam 300 ms cada terminam juntos: processos dormindo não seguram
  #     um escalonador, então todos dormem ao mesmo tempo.
  # ES: 200 procesos que esperan 300 ms cada uno terminan juntos: los procesos dormidos no retienen
  #     un planificador, así que todos duermen al mismo tiempo.
  test "delays overlap, one process each", %{in_flight: in_flight} do
    {micros, results} =
      :timer.tc(fn ->
        1..200
        |> Enum.map(fn _ ->
          Task.async(fn -> EchoServer.handle("GET", "/delay?ms=300", %{}, "", in_flight) end)
        end)
        |> Task.await_many(10_000)
      end)

    assert Enum.all?(results, &match?({200, _, _}, &1))
    assert micros < 5_000_000
  end

  test "the real socket answers a request" do
    port = String.to_integer(System.get_env("PORT", "8080"))
    {:ok, socket} = :gen_tcp.connect(~c"localhost", port, [:binary, active: false])
    :ok = :gen_tcp.send(socket, "GET /health HTTP/1.1\r\nhost: localhost\r\n\r\n")
    {:ok, reply} = :gen_tcp.recv(socket, 0, 5000)
    assert reply =~ "HTTP/1.1 200 OK"
    assert String.ends_with?(reply, "ok")
  end
end
